/*
Finds user-facing strings in the app source so they can be moved into the
translation files. Prints a JSON list; used by the i18n migration and by the
"no hard-coded strings" test.

Usage: node tools/extract-strings.cjs [--summary]
Also used as a library: require('./extract-strings.cjs').findStrings()
(src/i18n/noHardcodedStrings.test.ts runs it on every test run).
*/
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const SKIP_DIRS = new Set(['i18n', 'theme']);
const SKIP_FILES = new Set(['demoWorkspace.ts', 'mockData.ts', 'mockLocationData.ts', 'mockAvailabilityData.ts', 'testSupabaseConnection.ts', 'analyticsService.ts']);
const TEXT_ATTRS = new Set(['placeholder', 'title', 'label', 'accessibilityLabel', 'accessibilityHint', 'description', 'subtitle', 'headerTitle', 'tabBarLabel']);
const TEXT_PROPS = new Set(['label', 'title', 'text', 'message', 'description', 'subtitle', 'placeholder', 'hint', 'headline', 'tabBarLabel', 'cta', 'tag', 'badge', 'note']);

// Only the fixed text counts: a template like `${a} ${b}` has no words of its own.
const hasLetters = (s) => /\p{L}/u.test(s.replace(/\$\{[^}]*\}/g, ''));
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); }
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && !SKIP_FILES.has(name)) files.push(p);
  }
})(ROOT);

function findStrings() {
const found = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(path.join(__dirname, '..'), file);
  const add = (node, kind, value) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    found.push({ file: rel, line: line + 1, kind, value });
  };
  // text of a string-ish node, or null
  const literal = (n) => {
    if (!n) return null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
    if (ts.isTemplateExpression(n)) {
      let out = n.head.text;
      n.templateSpans.forEach((s, i) => { out += '${' + s.expression.getText(sf) + '}' + s.literal.text; });
      return out;
    }
    return null;
  };
  // string literals inside a (conditional / logical) expression
  const strings = (n, kind) => {
    if (!n) return;
    const v = literal(n);
    if (v !== null) { if (hasLetters(v)) add(n, kind, v); return; }
    if (ts.isParenthesizedExpression(n)) return strings(n.expression, kind);
    if (ts.isConditionalExpression(n)) { strings(n.whenTrue, kind); strings(n.whenFalse, kind); return; }
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind)) {
      strings(n.right, kind); return;
    }
  };
  const visit = (n) => {
    if (ts.isJsxText(n)) {
      const t = n.getText(sf).replace(/\s+/g, ' ').trim();
      if (t && hasLetters(t)) add(n, 'jsx-text', t);
    } else if (ts.isJsxExpression(n) && n.parent && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent))) {
      strings(n.expression, 'jsx-expr');
    } else if (ts.isJsxAttribute(n)) {
      const name = n.name.getText(sf);
      if (TEXT_ATTRS.has(name) && n.initializer) {
        if (ts.isStringLiteral(n.initializer)) { if (hasLetters(n.initializer.text)) add(n, 'attr:' + name, n.initializer.text); }
        else if (ts.isJsxExpression(n.initializer)) strings(n.initializer.expression, 'attr:' + name);
      }
    } else if (ts.isCallExpression(n)) {
      const callee = n.expression.getText(sf);
      if (callee === 'Alert.alert') {
        strings(n.arguments[0], 'alert-title'); strings(n.arguments[1], 'alert-message');
      } else if (callee === 'showToast') {
        strings(n.arguments[0], 'toast');
      } else if (/(^|\.)confirm$/.test(callee)) {
        strings(n.arguments[0], 'confirm');
      }
    } else if (ts.isNewExpression(n) && n.expression.getText(sf) === 'Error') {
      strings(n.arguments && n.arguments[0], 'error');
    } else if (ts.isPropertyAssignment(n)) {
      const key = n.name.getText(sf).replace(/['"]/g, '');
      if (TEXT_PROPS.has(key)) strings(n.initializer, 'prop:' + key);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
return found;
}

if (require.main === module) {
const found = findStrings();
if (process.argv.includes('--summary')) {
  const byFile = {};
  for (const f of found) byFile[f.file] = (byFile[f.file] || 0) + 1;
  const rows = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
  console.log('total strings:', found.length, 'in', rows.length, 'files');
  rows.forEach(([f, n]) => console.log(String(n).padStart(4), f));
} else {
  console.log(JSON.stringify(found, null, 1));
}
}

module.exports = { findStrings };

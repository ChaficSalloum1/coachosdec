import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import palette from './palette.json';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'theme' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

describe('colours', () => {
  it('lives only in src/theme/palette.json: no hex or rgba values anywhere else in the app', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/#[0-9a-fA-F]{3,8}\b/.test(line) || /\brgba?\(/.test(line)) {
            offenders.push(`${file.replace(SRC, 'src')}:${i + 1}  ${line.trim()}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it('every palette value is a valid colour', () => {
    const values: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') values.push(node);
      else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(palette);
    const valid = /^(#[0-9A-Fa-f]{6}|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\))$/;
    expect(values.filter((v) => !valid.test(v))).toEqual([]);
  });
});

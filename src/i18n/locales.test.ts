import { describe, expect, it } from 'vitest';

import { en } from './locales/en';
import { el } from './locales/el';

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    if (typeof value === 'string') out[prefix + key] = value;
    else Object.assign(out, flatten(value, `${prefix}${key}.`));
    return out;
  }, {});

const placeholders = (text: string) => [...text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort();

const english = flatten(en as Tree);
const greek = flatten(el as Tree);

describe('translations', () => {
  it('give Greek exactly the keys English has', () => {
    expect(Object.keys(greek).sort()).toEqual(Object.keys(english).sort());
  });

  it('keep the same {{placeholders}} in both languages', () => {
    const mismatched = Object.keys(english).filter(
      (key) => placeholders(english[key]).join() !== placeholders(greek[key] ?? '').join()
    );
    // Plural forms may drop {{count}} when the number is spelled out ("one lesson"), so compare ignoring it.
    const real = mismatched.filter(
      (key) =>
        placeholders(english[key]).filter((p) => p !== 'count').join() !==
        placeholders(greek[key] ?? '').filter((p) => p !== 'count').join()
    );
    expect(real).toEqual([]);
  });

  it('have no empty text', () => {
    expect(Object.keys(greek).filter((key) => !greek[key].trim())).toEqual([]);
    expect(Object.keys(english).filter((key) => !english[key].trim())).toEqual([]);
  });

  it('give every plural key both forms', () => {
    const singles = Object.keys(english).filter((key) => key.endsWith('_one'));
    const missing = singles.filter((key) => !(key.replace(/_one$/, '_other') in english));
    expect(missing).toEqual([]);
  });
});

/*
i18next picks "one"/"other" forms with Intl.PluralRules. Some phone JavaScript
engines ship without it, and then every counted text would show its raw key.
English and Greek both use the same rule (exactly 1 is "one", anything else is
"other"), so a tiny stand-in is enough for the two languages the app has.
*/
type PluralGlobal = { Intl?: { PluralRules?: unknown } };

class SimplePluralRules {
  select(count: number): 'one' | 'other' {
    return count === 1 ? 'one' : 'other';
  }
  resolvedOptions() {
    return { pluralCategories: ['one', 'other'] };
  }
  static supportedLocalesOf(locales: string | string[]) {
    return Array.isArray(locales) ? locales : [locales];
  }
}

export function ensurePluralRules(target: PluralGlobal = globalThis as PluralGlobal): void {
  if (typeof target.Intl?.PluralRules === 'function') return;
  target.Intl = { ...(target.Intl ?? {}), PluralRules: SimplePluralRules };
}

/*
i18next picks "one"/"other" forms with Intl.PluralRules. Some phone JavaScript
engines (Hermes on iOS) ship an Intl without it, and then every counted text
would show its raw key. English and Greek both use the same rule (exactly 1 is
"one", anything else is "other"), so a tiny stand-in is enough.

The rest of Intl (NumberFormat, DateTimeFormat) must stay exactly as it is:
its members are not enumerable, so copying the object ({ ...Intl }) would
silently drop them and break all money and date formatting.
*/
type IntlLike = { PluralRules?: unknown };
type PluralGlobal = { Intl?: IntlLike };

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
  const intl = target.Intl;
  if (typeof intl?.PluralRules === 'function') return;

  if (intl) {
    try {
      // Add to the real Intl object in place.
      Object.defineProperty(intl, 'PluralRules', { value: SimplePluralRules, configurable: true, writable: true });
      return;
    } catch {
      // A frozen Intl: put a wrapper in front of it that still reaches everything on the original.
      const wrapper = Object.create(intl) as IntlLike;
      wrapper.PluralRules = SimplePluralRules;
      target.Intl = wrapper;
      return;
    }
  }

  target.Intl = { PluralRules: SimplePluralRules };
}

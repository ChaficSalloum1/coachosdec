/*
App translations. English is the source language and defines the keys; Greek
must provide every one of them (the compiler checks, see locales/el/index.ts).
`t('namespace.key')` is typed, so a misspelt key fails to compile.

This file is pure (no React Native), so logic modules and their tests can use
it. Remembering the chosen language lives in ./persistence.ts.
*/
import i18n from 'i18next';

import { en, type Translation } from './locales/en';
import { el } from './locales/el';
import { ensurePluralRules } from './pluralFallback';

export const LANGUAGES = ['en', 'el'] as const;
export type Language = (typeof LANGUAGES)[number];

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}

ensurePluralRules();

i18n.init({
  resources: { en: { translation: en }, el: { translation: el } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false, // load the bundled resources synchronously: no flash of raw keys
});

// Works anywhere (components, hooks, stores, plain modules). Screens redraw on a
// language change because the app root is remounted (see App.tsx).
export const t = i18n.t.bind(i18n);

export const currentLanguage = (): Language => (i18n.language === 'el' ? 'el' : 'en');

export const setLanguage = (language: Language) => i18n.changeLanguage(language);

export default i18n;

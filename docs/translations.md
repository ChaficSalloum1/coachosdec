# Translations

CoachOS ships in English and Greek. Every word a coach or a student can read comes from
`src/i18n/locales/<language>/<area>.ts`, never from the screen code.

## Using text

```ts
import { t } from '../i18n';

t('students.title');                              // plain text
t('students.requestPaymentFrom', { name });       // {{name}} placeholder
t('students.lessonCount', { count: 3 });          // plural: needs lessonCount_one and lessonCount_other
```

Keys are typed. A misspelt key, or a Greek file missing a key English has, does not compile.

## Adding or changing text

1. Add the key to `src/i18n/locales/en/<area>.ts` (English defines the keys).
2. Add the same key to `src/i18n/locales/el/<area>.ts`. It is typed against English, so the
   compiler tells you if you forget.
3. A new area (file) is registered in both `en/index.ts` and `el/index.ts`.

`npx vitest run src/i18n` checks that both languages have the same keys and `{{placeholders}}`,
and that no screen contains English text outside `t()`. A developer-only message (a config
error, a log line) can stay in code if it is listed in `src/i18n/noHardcodedStrings.test.ts`.

## Rules that are easy to get wrong

- **Dates and weekdays**: use `formatLocalized` / `weekdayName` from `src/i18n/formatDate.ts`,
  never `format(date, 'EEE')` for text. Machine formats (`yyyy-MM-dd`, `HH:mm`) are fine.
- **Clock times** shown to people: `formatClockTime` (12-hour in English, 24-hour in Greek).
- **Stored values stay English**: sport names (`Tennis`) and note tags are saved in English and
  only translated for display (`sportLabel`, the topic chips in `QuickNoteSheet`).
- **Tone**: the coach's own screens use the formal plural in Greek (σας). Anything a student
  reads (booking page, cancellation and reminder messages, payment requests) uses the informal
  singular (σου).
- **Language switch**: `App.tsx` remounts the navigator when the language changes, so screens
  pick up new text without each one subscribing.
- **Web booking page** (`web/booking`): follows the visitor's browser language; `?lang=el` or
  `?lang=en` forces one.

## Adding a language

Copy `locales/el` to a new folder, translate, add it to `LANGUAGES` and `resources` in
`src/i18n/index.ts`, add a `date-fns` locale in `formatDate.ts`, and add a row to
`LanguageSelector`. Plural rules in `pluralFallback.ts` are only right for languages where
exactly 1 is the singular.

/*
Keeps new screens from sneaking in English-only text. Every string the coach or
a student can read must go through t(); the few below are for developers only
(configuration problems, logs, internal labels) and are listed on purpose.
*/
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

type Found = { file: string; line: number; kind: string; value: string };

const require = createRequire(import.meta.url);
const { findStrings } = require('../../tools/extract-strings.cjs') as { findStrings: () => Found[] };

// file -> developer-only strings that are allowed to stay in English.
const DEVELOPER_ONLY: Record<string, string[]> = {
  'src/api/supabase.ts': [
    'Supabase URL must start with https://',
    'Supabase URL must be your project URL, for example https://project-ref.supabase.co',
    'Supabase URL is invalid. Use the project URL, not a REST or auth endpoint.',
    'Supabase anon/publishable key is missing.',
    'Supabase key format is invalid. Use the anon public key or publishable key from Supabase.',
    'Supabase credentials are required. Please add them in the ENV tab.',
  ],
  'src/components/AvailabilityModals.tsx': [
    'Invalid time format: ${timeString}. Expected HH:mm format.',
    'Invalid time values: ${timeString}',
  ],
  'src/utils/timeFormat.ts': ['Invalid time format: ${time}. Expected HH:mm format.'],
  'src/services/syncRegistry.ts': ['No sync entry for ${kind}'],
  'src/state/slices/bookingRequestsSlice.ts': ['Booking request must have an ID'],
  'src/utils/encryption.ts': ['Failed to initialize encryption key'],
  // Names used inside sync error logs, never shown on screen.
  'src/services/supabaseSync.ts': [
    'student',
    'lesson',
    'student note',
    'area',
    'facility',
    'court',
    'availability range',
    'blackout date',
  ],
  // The product name is not translated.
  'src/screens/LoginScreen.tsx': ['CoachOS'],
};

describe('user-facing text', () => {
  it('goes through the translation system', () => {
    const unexpected = findStrings().filter((s) => !DEVELOPER_ONLY[s.file]?.includes(s.value));
    const report = unexpected.map((s) => `${s.file}:${s.line} (${s.kind}) ${JSON.stringify(s.value)}`);
    expect(report, 'Move these into src/i18n/locales/en + el and use t(), or list them as developer-only').toEqual([]);
  });
});

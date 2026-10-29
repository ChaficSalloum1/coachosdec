import { describe, expect, it } from 'vitest';

import { migratePersistedState, partializeState } from './persistence';

const coach = {
  id: 'c1',
  name: 'Chris',
  pricePerHour: 40,
  paymentSettings: { cashEnabled: true, paymentPreference: 'CASH', currency: 'GBP', revolutLink: 'https://revolut.me/x' },
};

const state = {
  isDemoMode: false,
  coach,
  bookingRequests: [{ id: 'r' }],
  lessons: [{ id: 'l' }],
  students: [{ id: 's' }],
  studentNotes: [{ id: 'n' }],
  areas: [{ id: 'a' }],
  facilities: [{ id: 'f' }],
  courts: [{ id: 'k' }],
  availabilityRanges: [{ id: 'v' }],
  blackoutDates: [{ id: 'b' }],
};

describe('partializeState', () => {
  it('with a backend, keeps locations and availability but not people or lessons', () => {
    const saved = partializeState(state as never, true);
    expect(saved.lessons).toEqual([]);
    expect(saved.students).toEqual([]);
    expect(saved.studentNotes).toEqual([]);
    expect(saved.bookingRequests).toEqual([]);
    expect(saved.areas).toEqual([{ id: 'a' }]);
    expect(saved.availabilityRanges).toEqual([{ id: 'v' }]);
  });

  it('does not crash on a coach with no payment settings', () => {
    const saved = partializeState({ ...state, coach: { ...coach, paymentSettings: null } } as never, true);
    expect(saved.coach?.paymentSettings).toEqual({ cashEnabled: true, paymentPreference: 'CASH', currency: undefined });
  });

  it('keeps the coach but drops payment details beyond the basics when the server owns them', () => {
    const saved = partializeState(state as never, true);
    expect(saved.coach?.paymentSettings).toEqual({ cashEnabled: true, paymentPreference: 'CASH', currency: 'GBP' });
  });

  it('keeps everything locally without a backend or in demo mode', () => {
    expect(partializeState(state as never, false).lessons).toEqual([{ id: 'l' }]);
    expect(partializeState({ ...state, isDemoMode: true } as never, true).students).toEqual([{ id: 's' }]);
  });
});

describe('migratePersistedState', () => {
  it('passes a missing saved state through', () => {
    expect(migratePersistedState(null, true)).toBeNull();
  });

  it('with a backend, clears server-owned lists and leaves demo mode', () => {
    const result = migratePersistedState({ ...state, isDemoMode: false }, true);
    expect(result.lessons).toEqual([]);
    expect(result.students).toEqual([]);
    expect(result.coach.paymentSettings.currency).toBe('GBP');
    expect(result.areas).toEqual([{ id: 'a' }]);
  });

  it('without a backend, keeps lessons and fills in their payment fields', () => {
    const lesson = { id: 'l', studentId: 's', isPaid: false, price: 40 };
    const result = migratePersistedState({ ...state, lessons: [lesson] }, false);
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0].paymentStatus).toBeTruthy();
    expect(result.lessons[0].paymentReferenceCode).toBeTruthy();
  });

  it('keeps demo data even with a backend', () => {
    const result = migratePersistedState({ ...state, isDemoMode: true, lessons: [{ id: 'l', isPaid: false }] }, true);
    expect(result.isDemoMode).toBe(true);
    expect(result.lessons).toHaveLength(1);
  });
});

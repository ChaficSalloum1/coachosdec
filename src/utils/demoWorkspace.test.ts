import { describe, expect, it } from 'vitest';

import { createDemoWorkspace } from './demoWorkspace';

describe('demo workspace', () => {
  it('loads a professional coach workspace with payment settings', () => {
    const demo = createDemoWorkspace();

    expect(demo.coach.name).toBe('Nikos Papadakis');
    expect(demo.coach.sports).toEqual(['Tennis', 'Padel']);
    expect(demo.coach.paymentSettings.paymentPreference).toBe('MULTIPLE');
    expect(demo.coach.paymentSettings.revolutLink).toContain('revolut.me');
    expect(demo.coach.paymentSettings.irisAlias).toBe('@nikoscoach');
    expect(demo.coach.paymentSettings.iban).toMatch(/^GR/);
    expect(demo.coach.paymentSettings.cancellationPolicy).toContain('24 hours');
  });

  it('includes meaningful records for the primary demo screens', () => {
    const demo = createDemoWorkspace();

    expect(demo.students.length).toBeGreaterThanOrEqual(4);
    expect(demo.lessons.length).toBeGreaterThanOrEqual(4);
    expect(demo.bookingRequests.length).toBeGreaterThanOrEqual(2);
    expect(demo.areas.length).toBeGreaterThanOrEqual(3);
    expect(demo.facilities.length).toBeGreaterThanOrEqual(3);
    expect(demo.courts.length).toBeGreaterThanOrEqual(4);
    expect(demo.availabilityRanges.length).toBeGreaterThanOrEqual(5);
  });

  it('shows the V1 manual payment states in sample lessons', () => {
    const paymentStatuses = new Set(createDemoWorkspace().lessons.map(lesson => lesson.paymentStatus));

    expect(paymentStatuses).toContain('PAID_CONFIRMED');
    expect(paymentStatuses).toContain('REQUESTED');
    expect(paymentStatuses).toContain('REMINDER_SENT');
    expect(paymentStatuses).toContain('FAILED_OR_CANCELLED');
  });

  it('keeps all demo-owned records under the demo coach', () => {
    const demo = createDemoWorkspace();
    const coachOwnedRecords = [
      ...demo.bookingRequests,
      ...demo.lessons,
      ...demo.students,
      ...demo.studentNotes,
      ...demo.areas,
      ...demo.facilities,
      ...demo.courts,
      ...demo.availabilityRanges,
      ...demo.blackoutDates,
    ];

    expect(coachOwnedRecords.every(record => record.coachId === demo.coach.id)).toBe(true);
  });
});

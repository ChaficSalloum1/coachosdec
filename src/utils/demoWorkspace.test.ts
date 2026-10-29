import { describe, expect, it } from 'vitest';

import { createDemoWorkspace } from './demoWorkspace';

describe('demo workspace', () => {
  it('loads a professional coach workspace with payment settings', () => {
    const demo = createDemoWorkspace();

    expect(demo.coach.name).toBe('Marcus Bennett');
    expect(demo.coach.sports).toEqual(['Padel', 'Tennis']);
    expect(demo.coach.paymentSettings.paymentPreference).toBe('MULTIPLE');
    expect(demo.coach.paymentSettings.revolutLink).toContain('revolut.me');
    expect(demo.coach.paymentSettings.cancellationPolicy).toContain('24 hours');
  });

  it('is a London coach: pounds, London areas and UK contact details', () => {
    const demo = createDemoWorkspace();

    expect(demo.coach.paymentSettings.currency).toBe('GBP');
    expect(demo.areas.map(area => area.name)).toEqual(['North London', 'South West London', 'East London']);
    expect(demo.facilities.every(facility => /London [A-Z]{1,2}\d/.test(facility.address ?? ''))).toBe(true);
    const phones = [...demo.students.map(s => s.contact), ...demo.bookingRequests.map(r => r.studentContact)].filter(c => !c.includes('@'));
    expect(phones.length).toBeGreaterThan(0);
    expect(phones.every(phone => phone.startsWith('+44 7700 900'))).toBe(true); // numbers Ofcom reserves for drama use
  });

  it('shows each student with a real history and the right balance', () => {
    const demo = createDemoWorkspace();
    const byName = Object.fromEntries(demo.students.map(student => [student.name, student]));

    expect(byName['Amelia Clarke'].totalLessons).toBe(3);
    expect(byName['Chloe Evans'].totalLessons).toBe(4);
    expect(byName['Tom Hargreaves'].totalLessons).toBe(1); // his rained-off lesson is cancelled, not counted
    expect(byName['Raj Patel'].balance).toBe(70); // today's lesson, payment requested
    expect(byName['Chloe Evans'].balance).toBe(105); // tomorrow's 90 minutes, reminder sent
    expect(byName['Chloe Evans'].lastLessonDate! < demo.lessons.find(l => l.status === 'scheduled' && l.studentName === 'Chloe Evans')!.date).toBe(true);
  });

  it('prices every lesson from the coach hourly rate', () => {
    const demo = createDemoWorkspace();

    for (const lesson of demo.lessons) {
      expect(lesson.price).toBe((demo.coach.pricePerHour * lesson.duration) / 60);
    }
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

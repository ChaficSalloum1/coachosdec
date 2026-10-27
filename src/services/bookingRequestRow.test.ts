import { describe, expect, it } from 'vitest';

import { toBookingRequest } from './bookingRequestRow';

describe('toBookingRequest', () => {
  it('maps a database row, trimming the time and keeping the location', () => {
    expect(
      toBookingRequest(
        {
          id: 'r1', coach_id: 'c1', student_name: 'Ana', student_contact: 'ana@x.com', requested_date: '2026-11-02',
          requested_time: '10:00:00', duration: 90, note: 'hi', status: 'pending', created_at: '2026-10-01T00:00:00Z',
          area_id: 'a', facility_id: 'f', court_id: 'k',
        } as never,
        'fallback'
      )
    ).toEqual({
      id: 'r1', coachId: 'c1', studentName: 'Ana', studentContact: 'ana@x.com', requestedDate: '2026-11-02',
      requestedTime: '10:00', duration: 90, note: 'hi', status: 'pending', createdAt: '2026-10-01T00:00:00Z',
      areaId: 'a', facilityId: 'f', courtId: 'k',
    });
  });

  it('fills gaps: coach from context, one-hour default, pending status', () => {
    const request = toBookingRequest({ id: 'r2' } as never, 'coach-9');
    expect(request).toMatchObject({ coachId: 'coach-9', duration: 60, status: 'pending', studentName: '', areaId: undefined });
  });

  it('accepts a row already in app form', () => {
    expect(toBookingRequest({ id: 'r3', studentName: 'Bo', requestedTime: '09:30', courtId: 'k' } as never, 'c').courtId).toBe('k');
  });
});

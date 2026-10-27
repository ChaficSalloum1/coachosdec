import { describe, expect, it } from 'vitest';

import { getApprovalBlocker, resolveRequestStudent } from './bookingApproval';
import type { BookingRequest, Lesson, Student } from '../types/coach';

const request = (over: Partial<BookingRequest> = {}): BookingRequest => ({
  id: 'r1',
  coachId: 'c',
  studentName: 'Ana',
  studentContact: '+30 694 123 4567',
  requestedDate: '2026-11-02',
  requestedTime: '10:00',
  duration: 60,
  status: 'pending',
  createdAt: '',
  ...over,
});

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l', coachId: 'c', studentId: 's9', studentName: 'Ben', date: '2026-11-02',
    startTime: '10:30', endTime: '11:30', duration: 60, price: 40, isPaid: false,
    status: 'scheduled', createdAt: '', ...over,
  }) as Lesson;

describe('getApprovalBlocker', () => {
  it('allows a free slot', () => {
    expect(getApprovalBlocker({ request: request(), lessons: [], requests: [request()] })).toBeNull();
  });

  it('accepts times with seconds as they come from the database', () => {
    expect(getApprovalBlocker({ request: request({ requestedTime: '10:00:00' }), lessons: [], requests: [] })).toBeNull();
  });

  it('rejects a malformed date or time', () => {
    expect(getApprovalBlocker({ request: request({ requestedDate: 'soon' }), lessons: [], requests: [] })).toMatch(/Invalid date or time/);
    expect(getApprovalBlocker({ request: request({ requestedTime: '10am' }), lessons: [], requests: [] })).toMatch(/Invalid date or time/);
  });

  it('blocks when another pending request wants the same slot', () => {
    const other = request({ id: 'r2' });
    expect(getApprovalBlocker({ request: request(), lessons: [], requests: [request(), other] })).toMatch(/Another booking request/);
    expect(getApprovalBlocker({ request: request(), lessons: [], requests: [request(), { ...other, status: 'declined' }] })).toBeNull();
  });

  it('blocks when it overlaps a lesson, naming the student, but not a cancelled one or back-to-back', () => {
    expect(getApprovalBlocker({ request: request(), lessons: [lesson({})], requests: [] })).toMatch(/lesson with Ben/);
    expect(getApprovalBlocker({ request: request(), lessons: [lesson({ status: 'cancelled' })], requests: [] })).toBeNull();
    expect(getApprovalBlocker({ request: request(), lessons: [lesson({ startTime: '11:00', endTime: '12:00' })], requests: [] })).toBeNull();
  });
});

describe('resolveRequestStudent', () => {
  const existing = { id: 's1', contact: '+30 694 123 4567', name: 'Ana P' } as Student;

  it('reuses a student with the same contact', () => {
    const result = resolveRequestStudent([existing], request(), () => 'new', 'now');
    expect(result).toEqual({ student: existing, isNew: false });
  });

  it('creates a new student otherwise', () => {
    const result = resolveRequestStudent([], request(), () => 'new-id', '2026-10-01T00:00:00.000Z');
    expect(result.isNew).toBe(true);
    expect(result.student).toMatchObject({ id: 'new-id', name: 'Ana', totalLessons: 0, balance: 0 });
  });
});

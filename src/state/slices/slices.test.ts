import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

vi.stubGlobal('__DEV__', false);
// Native storage and the outbox are not available under test.
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { clear: vi.fn(), getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
const clearQueue = vi.fn();
vi.mock('../offlineQueueStore', () => ({ useOfflineQueueStore: { getState: () => ({ clear: clearQueue }) } }));

import { createCoachState, type CoachState } from './index';
import type { AvailabilityRange, Area, BookingRequest, Coach, Court, Facility, Student } from '../../types/coach';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
};

const makeStore = () => create<CoachState>()(persist(createCoachState, { name: 'test', storage: createJSONStorage(() => memory()) }));

const coach = { id: 'c1', name: 'Chris Coach', pricePerHour: 40, paymentSettings: { cashEnabled: true, paymentPreference: 'CASH' } } as unknown as Coach;
const student = (id: string, name = id): Student => ({ id, coachId: 'c1', name, contact: `${id}@x.com`, totalLessons: 0, totalSpent: 0, balance: 0, createdAt: '' });

let store: ReturnType<typeof makeStore>;
const s = () => store.getState();

beforeEach(() => {
  store = makeStore();
  clearQueue.mockClear();
  s().setCoach(coach);
  s().addStudent(student('ana', 'Ana'));
  s().addStudent(student('ben', 'Ben'));
});

const book = (studentId = 'ana', over: Partial<Parameters<CoachState['createLesson']>[0]> = {}) =>
  s().createLesson({ studentId, studentName: studentId, date: '2026-11-02', startTime: '10:00', duration: 60, price: 40, ...over });

describe('lessons', () => {
  it('creates a lesson and updates the student totals', () => {
    book();
    expect(s().lessons).toHaveLength(1);
    expect(s().lessons[0]).toMatchObject({ endTime: '11:00', status: 'scheduled', isPaid: false, coachId: 'c1' });
    expect(s().students.find((x) => x.id === 'ana')).toMatchObject({ totalLessons: 1, totalSpent: 40, balance: 40, lastLessonDate: '2026-11-02' });
  });

  it('does nothing without a coach profile', () => {
    s().setCoach(null);
    book();
    expect(s().lessons).toHaveLength(0);
  });

  it('cancels a lesson once and lowers the totals', async () => {
    book();
    const id = s().lessons[0].id;
    await s().cancelLesson(id);
    await s().cancelLesson(id); // second call is a no-op
    expect(s().lessons[0].status).toBe('cancelled');
    expect(s().students.find((x) => x.id === 'ana')).toMatchObject({ totalLessons: 0, totalSpent: 0, balance: 0 });
  });

  it('removing a student cancels their lessons', () => {
    book('ana');
    book('ben');
    s().removeStudent('ana');
    expect(s().students.map((x) => x.id)).toEqual(['ben']);
    expect(s().lessons.map((l) => [l.studentId, l.status]).sort()).toEqual([['ana', 'cancelled'], ['ben', 'scheduled']]);
  });

  it('lists a student\'s lessons newest first', () => {
    book('ana', { date: '2026-11-02' });
    book('ana', { date: '2026-11-09' });
    expect(s().getStudentLessons('ana').map((l) => l.date)).toEqual(['2026-11-09', '2026-11-02']);
  });

  it('completes lessons whose end time has passed', () => {
    book('ana', { date: '2000-01-01' });
    book('ana', { date: '2999-01-01' });
    s().autoCompletePastLessons();
    expect(s().lessons.map((l) => l.status).sort()).toEqual(['completed', 'scheduled']);
  });
});

describe('payments', () => {
  it('marks a lesson paid, then withdraws the payment, keeping the balance in step', () => {
    book();
    const id = s().lessons[0].id;
    s().markLessonPaid(id);
    expect(s().lessons[0]).toMatchObject({ isPaid: true, paymentStatus: 'PAID_CONFIRMED' });
    expect(s().students.find((x) => x.id === 'ana')!.balance).toBe(0);
    s().cancelLessonPayment(id);
    expect(s().lessons[0].isPaid).toBe(false);
    expect(s().students.find((x) => x.id === 'ana')!.balance).toBe(40);
  });

  it('records a payment request and a reminder', () => {
    book();
    const id = s().lessons[0].id;
    s().requestLessonPayment(id);
    expect(s().lessons[0].paymentRequestedAt).toBeTruthy();
    s().sendLessonPaymentReminder(id);
    expect(s().lessons[0].lastReminderSentAt).toBeTruthy();
  });
});

describe('group lessons and series', () => {
  it('creates one lesson per player and rejects an unknown player', () => {
    const groupId = s().createGroupLesson({ studentIds: ['ana', 'ben'], date: '2026-11-02', startTime: '18:00', duration: 60, pricePerPlayer: 20 });
    const members = s().lessons.filter((l) => l.groupId === groupId);
    expect(members).toHaveLength(2);
    expect(members.every((l) => l.groupCapacity === 4 && l.price === 20)).toBe(true);
    expect(() => s().createGroupLesson({ studentIds: ['nobody'], date: '2026-11-02', startTime: '18:00', duration: 60, pricePerPlayer: 20 })).toThrow(/not found/);
  });

  it('adds a player to a group, removes one, and cancels the whole group', async () => {
    s().addStudent(student('cy', 'Cy'));
    const groupId = s().createGroupLesson({ studentIds: ['ana'], date: '2026-11-02', startTime: '18:00', duration: 60, pricePerPlayer: 20 });
    s().addToGroupLesson(groupId, 'ben');
    expect(s().lessons.filter((l) => l.groupId === groupId)).toHaveLength(2);
    await s().removeFromGroupLesson(groupId, 'ana');
    expect(s().lessons.filter((l) => l.groupId === groupId && l.status !== 'cancelled')).toHaveLength(1);
    await s().cancelGroupLesson(groupId);
    expect(s().lessons.every((l) => l.status === 'cancelled')).toBe(true);
    await expect(s().removeFromGroupLesson(groupId, 'cy')).rejects.toThrow(/not in this group/);
  });

  it('cancels this lesson and all later ones in a series, leaving earlier ones', async () => {
    ['2026-11-02', '2026-11-09', '2026-11-16'].forEach((date) => book('ana', { date, seriesId: 'S' }));
    const second = s().lessons.find((l) => l.date === '2026-11-09')!;
    expect(await s().cancelSeriesFrom(second.id)).toBe(2);
    expect(s().lessons.map((l) => [l.date, l.status]).sort()).toEqual([
      ['2026-11-02', 'scheduled'], ['2026-11-09', 'cancelled'], ['2026-11-16', 'cancelled'],
    ]);
  });
});

describe('booking requests', () => {
  const request = (over: Partial<BookingRequest> = {}): BookingRequest => ({
    id: 'r1', coachId: 'c1', studentName: 'Dana', studentContact: 'dana@x.com', requestedDate: '2026-11-02',
    requestedTime: '10:00:00', duration: 60, status: 'pending', createdAt: '2026-10-01T00:00:00.000Z', ...over,
  });

  it('validates a request on the way in and lists pending ones newest first', () => {
    expect(() => s().addBookingRequest(request({ studentName: '' }))).toThrow(/Missing required/);
    s().addBookingRequest(request({ id: 'a', createdAt: '2026-10-01T00:00:00.000Z', requestedTime: '09:00' }));
    s().addBookingRequest(request({ id: 'b', createdAt: '2026-10-02T00:00:00.000Z', requestedTime: '12:00' }));
    expect(s().getPendingRequests().map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('approving creates the student and a priced lesson, and marks the request approved', async () => {
    s().addBookingRequest(request());
    await s().approveBookingRequest('r1');
    const lesson = s().lessons.find((l) => l.studentName === 'Dana')!;
    expect(lesson).toMatchObject({ date: '2026-11-02', startTime: '10:00', endTime: '11:00', price: 40 });
    expect(s().students.find((x) => x.name === 'Dana')).toMatchObject({ totalLessons: 1, balance: 40 });
    expect(s().bookingRequests[0].status).toBe('approved');
    await expect(s().approveBookingRequest('r1')).rejects.toThrow(/already been processed/);
  });

  it('refuses to approve into a clash and reuses an existing student by contact', async () => {
    book('ana', { startTime: '10:30' });
    s().addBookingRequest(request());
    await expect(s().approveBookingRequest('r1')).rejects.toThrow(/Time conflict/);
    s().declineBookingRequest('r1');
    expect(s().bookingRequests[0].status).toBe('declined');

    s().addBookingRequest(request({ id: 'r2', studentName: 'Ana again', studentContact: 'ana@x.com', requestedTime: '15:00' }));
    await s().approveBookingRequest('r2');
    expect(s().students.filter((x) => x.contact === 'ana@x.com')).toHaveLength(1);
  });
});

describe('locations and availability', () => {
  const area: Area = { id: 'a1', coachId: 'c1', name: 'North' };
  const facility: Facility = { id: 'f1', coachId: 'c1', areaId: 'a1', name: 'Club' };
  const court: Court = { id: 'k1', coachId: 'c1', facilityId: 'f1', label: 'Court 1' };
  const range = (id: string, dayOfWeek: number, startTime: string, endTime: string): AvailabilityRange => ({ id, coachId: 'c1', dayOfWeek, startTime, endTime, areaId: 'a1' });

  it('formats a location and cascades deletes down the chain', () => {
    s().addArea(area); s().addFacility(facility); s().addCourt(court);
    expect(s().formatLocationText('a1', 'f1', 'k1')).toBe('Club • Court 1 (North)');
    expect(s().formatLocationText('a1')).toBe('North');
    expect(s().formatLocationText(undefined, 'f1')).toBe('');
    s().deleteArea('a1');
    expect([s().areas, s().facilities, s().courts].map((x) => x.length)).toEqual([0, 0, 0]);
  });

  it('deleting a facility removes its courts but not the area', () => {
    s().addArea(area); s().addFacility(facility); s().addCourt(court);
    s().deleteFacility('f1');
    expect([s().areas.length, s().facilities.length, s().courts.length]).toEqual([1, 0, 0]);
  });

  it('detects availability overlap and lists a day\'s ranges', () => {
    s().addAvailabilityRange(range('r1', 1, '09:00', '12:00'));
    expect(s().validateRangeOverlap({ dayOfWeek: 1, startTime: '11:00', endTime: '13:00', areaId: 'a1' })).toBe(true);
    expect(s().validateRangeOverlap({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', areaId: 'a1' }, 'r1')).toBe(false);
    expect(s().getAvailabilityRangesForDay(1)).toHaveLength(1);
    expect(s().getAvailabilityRangesForDay(2)).toHaveLength(0);
  });
});

describe('notes', () => {
  it('adds, searches, updates and deletes notes for a student', () => {
    s().addStudentNote({ studentId: 'ana', coachId: 'c1', content: 'Great backhand', tags: ['Backhand'] });
    s().addStudentNote({ studentId: 'ana', coachId: 'c1', content: 'Work on serve', tags: [] });
    s().addStudentNote({ studentId: 'ben', coachId: 'c1', content: 'Other student', tags: [] });
    expect(s().getStudentNotes('ana')).toHaveLength(2);
    expect(s().searchStudentNotes('ana', 'backhand')).toHaveLength(1);
    const id = s().getStudentNotes('ana')[0].id;
    s().updateStudentNote(id, 'edited');
    expect(s().studentNotes.find((n) => n.id === id)).toMatchObject({ content: 'edited' });
    s().deleteStudentNote(id);
    expect(s().getStudentNotes('ana')).toHaveLength(1);
  });
});

describe('session', () => {
  it('clears everything, the outbox included, on sign-out', () => {
    book();
    s().clearAllData();
    expect(s().coach).toBeNull();
    expect(s().lessons).toEqual([]);
    expect(s().students).toEqual([]);
    expect(clearQueue).toHaveBeenCalledTimes(1);
  });

  it('enters demo mode with sample data and leaves it empty', () => {
    s().enterDemoMode();
    expect(s().isDemoMode).toBe(true);
    expect(s().coach).toBeTruthy();
    expect(s().students.length).toBeGreaterThan(0);
    s().exitDemoMode();
    expect(s()).toMatchObject({ isDemoMode: false, coach: null, lessons: [], students: [] });
  });

  it('keeps student totals honest after a recalculation', () => {
    book();
    s().updateStudent('ana', { totalLessons: 99, balance: 5 });
    s().recalculateStudentTotals();
    expect(s().students.find((x) => x.id === 'ana')).toMatchObject({ totalLessons: 1, balance: 40 });
    expect(s().checkDataIntegrity().studentIssues).toEqual([]);
  });
});

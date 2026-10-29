import { addDays, format } from 'date-fns';

import { recalculateStudentTotals } from './lessonMaintenance';
import {
  Area,
  AvailabilityRange,
  BlackoutDate,
  BookingRequest,
  Coach,
  Court,
  Facility,
  Lesson,
  Student,
  StudentNote,
} from '../types/coach';

const COACH_ID = '00000000-0000-4000-8000-000000000001';
const STUDENT_IDS = {
  amelia: '00000000-0000-4000-8000-000000000101',
  raj: '00000000-0000-4000-8000-000000000102',
  chloe: '00000000-0000-4000-8000-000000000103',
  tom: '00000000-0000-4000-8000-000000000104',
};

const today = () => new Date();
const iso = (offsetDays = 0) => format(addDays(today(), offsetDays), 'yyyy-MM-dd');
const timestamp = (offsetHours = 0) => new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString();

export type DemoWorkspace = {
  coach: Coach;
  bookingRequests: BookingRequest[];
  lessons: Lesson[];
  students: Student[];
  studentNotes: StudentNote[];
  areas: Area[];
  facilities: Facility[];
  courts: Court[];
  availabilityRanges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];
};

export function createDemoWorkspace(): DemoWorkspace {
  const coach: Coach = {
    id: COACH_ID,
    name: 'Marcus Bennett',
    sports: ['Padel', 'Tennis'],
    pricePerHour: 70,
    paymentSettings: {
      paymentPreference: 'MULTIPLE',
      currency: 'GBP',
      revolutLink: 'https://revolut.me/marcusbennettcoach',
      cancellationPolicy: 'Please cancel at least 24 hours before the lesson. Late cancellations are charged in full.',
      cashEnabled: true,
    },
    availability: {},
    blackoutDates: [],
    bookingLink: 'marcus-padel-tennis-demo',
    calendarSyncEnabled: false,
  };

  const areas: Area[] = [
    { id: '00000000-0000-4000-8000-000000000201', coachId: COACH_ID, name: 'North London' },
    { id: '00000000-0000-4000-8000-000000000202', coachId: COACH_ID, name: 'South West London' },
    { id: '00000000-0000-4000-8000-000000000203', coachId: COACH_ID, name: 'East London' },
  ];

  const facilities: Facility[] = [
    {
      id: '00000000-0000-4000-8000-000000000301',
      coachId: COACH_ID,
      areaId: areas[0].id,
      name: 'Canalside Padel Club',
      address: 'Islington, London N1',
      notes: 'Indoor courts, so rain never cancels a lesson. Entrance on the towpath side.',
    },
    {
      id: '00000000-0000-4000-8000-000000000302',
      coachId: COACH_ID,
      areaId: areas[1].id,
      name: 'Riverside Tennis Centre',
      address: 'Battersea, London SW11',
    },
    {
      id: '00000000-0000-4000-8000-000000000303',
      coachId: COACH_ID,
      areaId: areas[2].id,
      name: 'Eastside Racquet Club',
      address: 'Hackney, London E8',
    },
  ];

  const courts: Court[] = [
    { id: '00000000-0000-4000-8000-000000000401', coachId: COACH_ID, facilityId: facilities[0].id, label: 'Padel 1', sport: 'Padel' },
    { id: '00000000-0000-4000-8000-000000000402', coachId: COACH_ID, facilityId: facilities[0].id, label: 'Padel 2', sport: 'Padel' },
    { id: '00000000-0000-4000-8000-000000000403', coachId: COACH_ID, facilityId: facilities[1].id, label: 'Court 3', sport: 'Tennis' },
    { id: '00000000-0000-4000-8000-000000000404', coachId: COACH_ID, facilityId: facilities[2].id, label: 'Court 1', sport: 'Tennis' },
  ];

  const students: Student[] = [
    {
      id: STUDENT_IDS.amelia,
      coachId: COACH_ID,
      name: 'Amelia Clarke',
      contact: 'amelia.clarke@example.com',
      totalLessons: 8,
      totalSpent: 560,
      balance: 0,
      notes: 'Improving padel player. Wants to move up the club ladder: bandeja and consistency off the back wall.',
      createdAt: timestamp(-24 * 45),
      lastLessonDate: iso(0),
    },
    {
      id: STUDENT_IDS.raj,
      coachId: COACH_ID,
      name: 'Raj Patel',
      contact: '+44 7700 900123',
      totalLessons: 4,
      totalSpent: 280,
      balance: 70,
      notes: 'Tennis beginner after years of cricket. Strong forehand, needs a reliable backhand.',
      createdAt: timestamp(-24 * 18),
      lastLessonDate: iso(0),
    },
    {
      id: STUDENT_IDS.chloe,
      coachId: COACH_ID,
      name: 'Chloe Evans',
      contact: 'chloe.evans@example.com',
      totalLessons: 12,
      totalSpent: 840,
      balance: 105,
      notes: 'Advanced junior. Preparing for the county tournament in the spring.',
      createdAt: timestamp(-24 * 80),
      lastLessonDate: iso(-4),
    },
    {
      id: STUDENT_IDS.tom,
      coachId: COACH_ID,
      name: 'Tom Hargreaves',
      contact: '+44 7700 900456',
      totalLessons: 2,
      totalSpent: 140,
      balance: 0,
      createdAt: timestamp(-24 * 9),
      lastLessonDate: iso(-9),
    },
  ];

  const lessons: Lesson[] = [
    {
      id: '00000000-0000-4000-8000-000000000501',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.amelia,
      studentName: 'Amelia Clarke',
      date: iso(0),
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      price: 70,
      isPaid: true,
      paymentStatus: 'PAID_CONFIRMED',
      paymentMethodRequested: 'REVOLUT',
      paymentReferenceCode: 'COACHOS-MARCUS-AMELI1',
      paymentRequestedAt: timestamp(-48),
      paidConfirmedAt: timestamp(-36),
      status: 'scheduled',
      notes: 'Warm-up, bandeja technique, then 20 minutes of points off the glass.',
      createdAt: timestamp(-72),
      areaId: areas[0].id,
      facilityId: facilities[0].id,
      courtId: courts[0].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000502',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.raj,
      studentName: 'Raj Patel',
      date: iso(0),
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      price: 70,
      isPaid: false,
      paymentStatus: 'REQUESTED',
      paymentMethodRequested: 'REVOLUT',
      paymentReferenceCode: 'COACHOS-MARCUS-RAJ002',
      paymentRequestedAt: timestamp(-8),
      status: 'scheduled',
      notes: 'Tennis backhand fundamentals: grip, footwork and a slow rally.',
      createdAt: timestamp(-24),
      areaId: areas[1].id,
      facilityId: facilities[1].id,
      courtId: courts[2].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000503',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.chloe,
      studentName: 'Chloe Evans',
      date: iso(1),
      startTime: '17:30',
      endTime: '19:00',
      duration: 90,
      price: 105,
      isPaid: false,
      paymentStatus: 'REMINDER_SENT',
      paymentMethodRequested: 'REVOLUT',
      paymentReferenceCode: 'COACHOS-MARCUS-CHLOE3',
      paymentRequestedAt: timestamp(-30),
      lastReminderSentAt: timestamp(-2),
      status: 'scheduled',
      notes: 'County tournament prep: baseline patterns and tie-break scenarios.',
      createdAt: timestamp(-96),
      areaId: areas[2].id,
      facilityId: facilities[2].id,
      courtId: courts[3].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000504',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.tom,
      studentName: 'Tom Hargreaves',
      date: iso(-2),
      startTime: '18:00',
      endTime: '19:00',
      duration: 60,
      price: 70,
      isPaid: false,
      paymentStatus: 'FAILED_OR_CANCELLED',
      paymentMethodRequested: 'CASH',
      paymentReferenceCode: 'COACHOS-MARCUS-TOM004',
      status: 'cancelled',
      notes: 'Cancelled: outdoor court under water after the rain.',
      createdAt: timestamp(-120),
      areaId: areas[1].id,
      facilityId: facilities[1].id,
      courtId: courts[2].id,
    },
  ];

  // Past, paid lessons: a believable history, so totals and Earnings are not empty.
  const completed = (
    n: number,
    studentId: string,
    studentName: string,
    daysAgo: number,
    startTime: string,
    endTime: string,
    duration: number,
    place: { area: number; facility: number; court: number },
    notes: string
  ): Lesson => ({
    id: `00000000-0000-4000-8000-0000000005${String(n).padStart(2, '0')}`,
    coachId: COACH_ID,
    studentId,
    studentName,
    date: iso(-daysAgo),
    startTime,
    endTime,
    duration,
    price: (coach.pricePerHour * duration) / 60,
    isPaid: true,
    paymentStatus: 'PAID_CONFIRMED',
    paymentMethodRequested: 'REVOLUT',
    paymentReferenceCode: `COACHOS-MARCUS-PAST${String(n).padStart(2, '0')}`,
    paymentRequestedAt: timestamp(-24 * daysAgo - 4),
    paidConfirmedAt: timestamp(-24 * daysAgo + 2),
    status: 'completed',
    notes,
    createdAt: timestamp(-24 * daysAgo - 48),
    areaId: areas[place.area].id,
    facilityId: facilities[place.facility].id,
    courtId: courts[place.court].id,
  });

  lessons.push(
    completed(5, STUDENT_IDS.amelia, 'Amelia Clarke', 3, '18:00', '19:00', 60, { area: 0, facility: 0, court: 1 }, 'Wall play and the lob.'),
    completed(6, STUDENT_IDS.amelia, 'Amelia Clarke', 10, '18:00', '19:00', 60, { area: 0, facility: 0, court: 0 }, 'Serve and return patterns for doubles.'),
    completed(7, STUDENT_IDS.raj, 'Raj Patel', 5, '12:00', '13:00', 60, { area: 1, facility: 1, court: 2 }, 'Forehand drills and first backhand slice.'),
    completed(8, STUDENT_IDS.chloe, 'Chloe Evans', 4, '17:30', '19:00', 90, { area: 2, facility: 2, court: 3 }, 'Serve plus one, then match play.'),
    completed(9, STUDENT_IDS.chloe, 'Chloe Evans', 7, '17:30', '19:00', 90, { area: 2, facility: 2, court: 3 }, 'Return of serve under pressure.'),
    completed(11, STUDENT_IDS.tom, 'Tom Hargreaves', 9, '19:00', '20:00', 60, { area: 0, facility: 0, court: 1 }, 'First padel session: grip, stance and keeping the ball in play.'),
    completed(10, STUDENT_IDS.chloe, 'Chloe Evans', 12, '17:30', '19:00', 90, { area: 2, facility: 2, court: 3 }, 'Fitness and footwork circuit.'),
  );

  const bookingRequests: BookingRequest[] = [
    {
      id: '00000000-0000-4000-8000-000000000601',
      coachId: COACH_ID,
      studentName: 'Isabelle Moreau',
      studentContact: 'isabelle.moreau@example.com',
      requestedDate: iso(2),
      requestedTime: '10:00',
      duration: 60,
      note: 'First padel lesson for me and a friend. We have played a couple of times on holiday.',
      status: 'pending',
      createdAt: timestamp(-3),
      areaId: areas[0].id,
      facilityId: facilities[0].id,
      courtId: courts[1].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000602',
      coachId: COACH_ID,
      studentName: 'Kwame Mensah',
      studentContact: '+44 7700 900789',
      requestedDate: iso(3),
      requestedTime: '18:00',
      duration: 90,
      note: 'Looking for tennis coaching after work. Happy to start with the basics.',
      status: 'pending',
      createdAt: timestamp(-1),
      areaId: areas[1].id,
      facilityId: facilities[1].id,
      courtId: courts[2].id,
    },
  ];

  const studentNotes: StudentNote[] = [
    {
      id: '00000000-0000-4000-8000-000000000701',
      studentId: STUDENT_IDS.amelia,
      coachId: COACH_ID,
      lessonId: lessons[0].id,
      content: 'Bandeja landing deeper when she turns her shoulders early. Next session: add target zones.',
      tags: ['bandeja', 'progress'],
      createdAt: timestamp(-18),
    },
    {
      id: '00000000-0000-4000-8000-000000000702',
      studentId: STUDENT_IDS.chloe,
      coachId: COACH_ID,
      lessonId: lessons[2].id,
      content: 'Strong cross-court pattern. Needs work staying calm after a missed first serve.',
      tags: ['tournament', 'mental'],
      createdAt: timestamp(-6),
    },
  ];

  const availabilityRanges: AvailabilityRange[] = [
    { id: '00000000-0000-4000-8000-000000000801', coachId: COACH_ID, dayOfWeek: 1, startTime: '09:00', endTime: '13:00', areaId: areas[0].id, facilityId: facilities[0].id, courtId: courts[0].id },
    { id: '00000000-0000-4000-8000-000000000802', coachId: COACH_ID, dayOfWeek: 2, startTime: '16:00', endTime: '20:00', areaId: areas[1].id, facilityId: facilities[1].id, courtId: courts[2].id },
    { id: '00000000-0000-4000-8000-000000000803', coachId: COACH_ID, dayOfWeek: 3, startTime: '10:00', endTime: '14:00', areaId: areas[2].id, facilityId: facilities[2].id, courtId: courts[3].id },
    { id: '00000000-0000-4000-8000-000000000804', coachId: COACH_ID, dayOfWeek: 5, startTime: '15:00', endTime: '19:00', areaId: areas[0].id, facilityId: facilities[0].id, courtId: courts[1].id },
    { id: '00000000-0000-4000-8000-000000000805', coachId: COACH_ID, dayOfWeek: 6, startTime: '09:00', endTime: '12:00', areaId: areas[1].id, facilityId: facilities[1].id, courtId: courts[2].id },
  ];

  const blackoutDates: BlackoutDate[] = [
    { id: '00000000-0000-4000-8000-000000000901', coachId: COACH_ID, date: iso(7) },
  ];

  return {
    coach,
    bookingRequests,
    lessons,
    // Totals come from the lessons above, so the Students screen can never disagree with Today.
    students: recalculateStudentTotals(lessons, students),
    studentNotes,
    areas,
    facilities,
    courts,
    availabilityRanges,
    blackoutDates,
  };
}

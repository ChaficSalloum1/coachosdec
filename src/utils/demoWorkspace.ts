import { addDays, format } from 'date-fns';

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
  elena: '00000000-0000-4000-8000-000000000101',
  alex: '00000000-0000-4000-8000-000000000102',
  maria: '00000000-0000-4000-8000-000000000103',
  theo: '00000000-0000-4000-8000-000000000104',
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
    name: 'Nikos Papadakis',
    sports: ['Tennis', 'Padel'],
    pricePerHour: 45,
    paymentSettings: {
      paymentPreference: 'MULTIPLE',
      revolutLink: 'https://revolut.me/nikoscoach',
      irisAlias: '@nikoscoach',
      iban: 'GR1601101250000000012300695',
      ibanBeneficiaryName: 'Nikos Papadakis',
      cancellationPolicy: 'Please cancel at least 24 hours before the lesson. Late cancellations may be charged manually by the coach.',
      cashEnabled: true,
    },
    availability: {},
    blackoutDates: [],
    bookingLink: 'nikos-padel-tennis-demo',
    calendarSyncEnabled: false,
  };

  const areas: Area[] = [
    { id: '00000000-0000-4000-8000-000000000201', coachId: COACH_ID, name: 'Athens Center' },
    { id: '00000000-0000-4000-8000-000000000202', coachId: COACH_ID, name: 'Glyfada' },
    { id: '00000000-0000-4000-8000-000000000203', coachId: COACH_ID, name: 'Kifisia' },
  ];

  const facilities: Facility[] = [
    {
      id: '00000000-0000-4000-8000-000000000301',
      coachId: COACH_ID,
      areaId: areas[0].id,
      name: 'Athens Tennis Club',
      address: 'Leof. Vasilissis Sofias 12, Athens',
      notes: 'Two clay courts, lights after 18:00.',
    },
    {
      id: '00000000-0000-4000-8000-000000000302',
      coachId: COACH_ID,
      areaId: areas[1].id,
      name: 'Glyfada Padel Arena',
      address: 'Poseidonos Ave 41, Glyfada',
    },
    {
      id: '00000000-0000-4000-8000-000000000303',
      coachId: COACH_ID,
      areaId: areas[2].id,
      name: 'Kifisia Racquet Club',
      address: 'Kassaveti 8, Kifisia',
    },
  ];

  const courts: Court[] = [
    { id: '00000000-0000-4000-8000-000000000401', coachId: COACH_ID, facilityId: facilities[0].id, label: 'Clay 1', sport: 'Tennis' },
    { id: '00000000-0000-4000-8000-000000000402', coachId: COACH_ID, facilityId: facilities[0].id, label: 'Clay 2', sport: 'Tennis' },
    { id: '00000000-0000-4000-8000-000000000403', coachId: COACH_ID, facilityId: facilities[1].id, label: 'Padel A', sport: 'Padel' },
    { id: '00000000-0000-4000-8000-000000000404', coachId: COACH_ID, facilityId: facilities[2].id, label: 'Center Court', sport: 'Tennis' },
  ];

  const students: Student[] = [
    {
      id: STUDENT_IDS.elena,
      coachId: COACH_ID,
      name: 'Elena Markou',
      contact: 'elena.markou@example.com',
      totalLessons: 8,
      totalSpent: 360,
      balance: 0,
      notes: 'Intermediate tennis player. Wants serve consistency and better match confidence.',
      createdAt: timestamp(-24 * 45),
      lastLessonDate: iso(0),
    },
    {
      id: STUDENT_IDS.alex,
      coachId: COACH_ID,
      name: 'Alex Dimitriou',
      contact: '+30 690 123 4567',
      totalLessons: 4,
      totalSpent: 225,
      balance: 45,
      notes: 'Padel beginner. Strong motivation, needs positioning work.',
      createdAt: timestamp(-24 * 18),
      lastLessonDate: iso(0),
    },
    {
      id: STUDENT_IDS.maria,
      coachId: COACH_ID,
      name: 'Maria Ioannou',
      contact: 'maria.ioannou@example.com',
      totalLessons: 12,
      totalSpent: 540,
      balance: 90,
      notes: 'Advanced junior. Preparing for club tournament.',
      createdAt: timestamp(-24 * 80),
      lastLessonDate: iso(1),
    },
    {
      id: STUDENT_IDS.theo,
      coachId: COACH_ID,
      name: 'Theo Karalis',
      contact: '+30 694 222 1111',
      totalLessons: 2,
      totalSpent: 90,
      balance: 0,
      createdAt: timestamp(-24 * 9),
      lastLessonDate: iso(-2),
    },
  ];

  const lessons: Lesson[] = [
    {
      id: '00000000-0000-4000-8000-000000000501',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.elena,
      studentName: 'Elena Markou',
      date: iso(0),
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      price: 45,
      isPaid: true,
      paymentStatus: 'PAID_CONFIRMED',
      paymentMethodRequested: 'REVOLUT',
      paymentReferenceCode: 'COACHIKO-NIKOS-ELENA1',
      paymentRequestedAt: timestamp(-48),
      paidConfirmedAt: timestamp(-36),
      status: 'scheduled',
      notes: 'Warm-up, serve rhythm, then 20 minutes of point play.',
      createdAt: timestamp(-72),
      areaId: areas[0].id,
      facilityId: facilities[0].id,
      courtId: courts[0].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000502',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.alex,
      studentName: 'Alex Dimitriou',
      date: iso(0),
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      price: 45,
      isPaid: false,
      paymentStatus: 'REQUESTED',
      paymentMethodRequested: 'IRIS',
      paymentReferenceCode: 'COACHIKO-NIKOS-ALEX02',
      paymentRequestedAt: timestamp(-8),
      status: 'scheduled',
      notes: 'Padel positioning and wall recovery.',
      createdAt: timestamp(-24),
      areaId: areas[1].id,
      facilityId: facilities[1].id,
      courtId: courts[2].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000503',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.maria,
      studentName: 'Maria Ioannou',
      date: iso(1),
      startTime: '17:30',
      endTime: '19:00',
      duration: 90,
      price: 90,
      isPaid: false,
      paymentStatus: 'REMINDER_SENT',
      paymentMethodRequested: 'IBAN',
      paymentReferenceCode: 'COACHIKO-NIKOS-MARIA3',
      paymentRequestedAt: timestamp(-30),
      lastReminderSentAt: timestamp(-2),
      status: 'scheduled',
      notes: 'Tournament prep: baseline patterns and tie-break scenarios.',
      createdAt: timestamp(-96),
      areaId: areas[2].id,
      facilityId: facilities[2].id,
      courtId: courts[3].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000504',
      coachId: COACH_ID,
      studentId: STUDENT_IDS.theo,
      studentName: 'Theo Karalis',
      date: iso(-2),
      startTime: '18:00',
      endTime: '19:00',
      duration: 60,
      price: 45,
      isPaid: false,
      paymentStatus: 'FAILED_OR_CANCELLED',
      paymentMethodRequested: 'CASH',
      paymentReferenceCode: 'COACHIKO-NIKOS-THEO04',
      status: 'cancelled',
      notes: 'Cancelled due to rain.',
      createdAt: timestamp(-120),
      areaId: areas[0].id,
      facilityId: facilities[0].id,
      courtId: courts[1].id,
    },
  ];

  const bookingRequests: BookingRequest[] = [
    {
      id: '00000000-0000-4000-8000-000000000601',
      coachId: COACH_ID,
      studentName: 'Sofia Laskaridou',
      studentContact: 'sofia.laskaridou@example.com',
      requestedDate: iso(2),
      requestedTime: '10:00',
      duration: 60,
      note: 'I want to book a first tennis lesson and understand which package fits me.',
      status: 'pending',
      createdAt: timestamp(-3),
      areaId: areas[0].id,
      facilityId: facilities[0].id,
      courtId: courts[1].id,
    },
    {
      id: '00000000-0000-4000-8000-000000000602',
      coachId: COACH_ID,
      studentName: 'George Pappas',
      studentContact: '+30 697 555 4433',
      requestedDate: iso(3),
      requestedTime: '18:00',
      duration: 90,
      note: 'Padel doubles session for two players if possible.',
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
      studentId: STUDENT_IDS.elena,
      coachId: COACH_ID,
      lessonId: lessons[0].id,
      content: 'Serve toss improved when using slower setup cue. Next session: add target zones.',
      tags: ['serve', 'progress'],
      createdAt: timestamp(-18),
    },
    {
      id: '00000000-0000-4000-8000-000000000702',
      studentId: STUDENT_IDS.maria,
      coachId: COACH_ID,
      lessonId: lessons[2].id,
      content: 'Strong cross-court pattern. Needs work staying calm after missed first serve.',
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
    students,
    studentNotes,
    areas,
    facilities,
    courts,
    availabilityRanges,
    blackoutDates,
  };
}

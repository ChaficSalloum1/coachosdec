import { BookingRequest, Lesson, Student, Coach } from '../types/coach';
import { format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Generate consistent UUIDs for mock data using a deterministic seed approach
const generateMockUUID = (seed: string) => {
  // Use a namespace UUID (v5) approach for consistency across app restarts
  // For now, we'll use v4 but store them as constants
  return uuidv4();
};

// Fixed UUIDs for consistency
const COACH_ID = '550e8400-e29b-41d4-a716-446655440000';
const STUDENT_1_ID = '550e8400-e29b-41d4-a716-446655440001';
const STUDENT_2_ID = '550e8400-e29b-41d4-a716-446655440002';
const STUDENT_3_ID = '550e8400-e29b-41d4-a716-446655440003';
const STUDENT_4_ID = '550e8400-e29b-41d4-a716-446655440004';

export const mockCoach: Coach = {
  id: COACH_ID,
  name: 'Sarah Johnson',
  sports: ['Tennis', 'Pickleball'],
  pricePerHour: 75,
  paymentSettings: {
    qrCode: 'venmo @sarah-tennis',
    phoneId: '(555) 123-4567',
    cashEnabled: true,
  },
  availability: {
    monday: [
      { id: uuidv4(), startTime: '09:00', endTime: '12:00', areaId: '550e8400-e29b-41d4-a716-446655440010', facilityId: '550e8400-e29b-41d4-a716-446655440020', courtId: '550e8400-e29b-41d4-a716-446655440030' },
      { id: uuidv4(), startTime: '14:00', endTime: '18:00', areaId: '550e8400-e29b-41d4-a716-446655440011', facilityId: '550e8400-e29b-41d4-a716-446655440021' },
    ],
    tuesday: [
      { id: uuidv4(), startTime: '09:00', endTime: '17:00', areaId: '550e8400-e29b-41d4-a716-446655440010', facilityId: '550e8400-e29b-41d4-a716-446655440022', courtId: '550e8400-e29b-41d4-a716-446655440032' },
    ],
    wednesday: [
      { id: uuidv4(), startTime: '09:00', endTime: '12:00', areaId: '550e8400-e29b-41d4-a716-446655440010', facilityId: '550e8400-e29b-41d4-a716-446655440020', courtId: '550e8400-e29b-41d4-a716-446655440031' },
      { id: uuidv4(), startTime: '14:00', endTime: '18:00', areaId: '550e8400-e29b-41d4-a716-446655440009' },
    ],
    thursday: [
      { id: uuidv4(), startTime: '09:00', endTime: '17:00', areaId: '550e8400-e29b-41d4-a716-446655440011', facilityId: '550e8400-e29b-41d4-a716-446655440021', courtId: '550e8400-e29b-41d4-a716-446655440033' },
    ],
    friday: [
      { id: uuidv4(), startTime: '09:00', endTime: '15:00', areaId: '550e8400-e29b-41d4-a716-446655440010', facilityId: '550e8400-e29b-41d4-a716-446655440020' },
    ],
  },
  blackoutDates: [],
  bookingLink: 'sarah-tennis-coach',
};

export const mockBookingRequests: BookingRequest[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440100',
    coachId: COACH_ID,
    studentName: 'Mike Chen',
    studentContact: 'mike.chen@email.com',
    requestedDate: format(new Date(), 'yyyy-MM-dd'), // Today
    requestedTime: '15:00',
    duration: 60,
    note: 'Looking to improve my serve and backhand technique',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    courtId: '550e8400-e29b-41d4-a716-446655440031'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    coachId: COACH_ID,
    studentName: 'Emily Rodriguez',
    studentContact: '(555) 987-6543',
    requestedDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // Tomorrow
    requestedTime: '10:00',
    duration: 90,
    note: 'First time player, need beginner lesson',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    areaId: '550e8400-e29b-41d4-a716-446655440011',
    facilityId: '550e8400-e29b-41d4-a716-446655440021'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    coachId: COACH_ID,
    studentName: 'James Wilson',
    studentContact: 'jwilson@company.com',
    requestedDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'), // 3 days from now
    requestedTime: '16:00',
    duration: 60,
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    areaId: '550e8400-e29b-41d4-a716-446655440009'
  },
];

export const mockLessons: Lesson[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440200',
    coachId: COACH_ID,
    studentId: STUDENT_1_ID,
    studentName: 'Alice Smith',
    date: format(new Date(), 'yyyy-MM-dd'), // Today
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    price: 75,
    isPaid: true,
    status: 'scheduled',
    notes: 'Focus on forehand consistency',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    courtId: '550e8400-e29b-41d4-a716-446655440030'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    coachId: COACH_ID,
    studentId: STUDENT_2_ID,
    studentName: 'Bob Jones',
    date: format(new Date(), 'yyyy-MM-dd'), // Today
    startTime: '11:00',
    endTime: '12:30',
    duration: 90,
    price: 112.5,
    isPaid: false,
    status: 'scheduled',
    notes: 'Working on volleys and net play',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    areaId: '550e8400-e29b-41d4-a716-446655440011',
    facilityId: '550e8400-e29b-41d4-a716-446655440021',
    courtId: '550e8400-e29b-41d4-a716-446655440033'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440202',
    coachId: COACH_ID,
    studentId: STUDENT_3_ID,
    studentName: 'Carol Davis',
    date: format(new Date(), 'yyyy-MM-dd'), // Today
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    price: 75,
    isPaid: false,
    status: 'scheduled',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    areaId: '550e8400-e29b-41d4-a716-446655440009'
  },
];

export const mockStudents: Student[] = [
  {
    id: STUDENT_1_ID,
    coachId: COACH_ID,
    name: 'Alice Smith',
    contact: 'alice.smith@email.com',
    totalLessons: 1, // Fixed: aligned with actual lessons
    totalSpent: 75, // Fixed: aligned with actual lessons
    balance: 0, // Paid
    notes: 'Very dedicated player, loves working on technique',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    lastLessonDate: format(new Date(), 'yyyy-MM-dd'), // Today
  },
  {
    id: STUDENT_2_ID,
    coachId: COACH_ID,
    name: 'Bob Jones',
    contact: 'bob.jones@email.com',
    totalLessons: 1, // Fixed: aligned with actual lessons
    totalSpent: 112.5, // Fixed: aligned with actual lessons
    balance: 112.5, // Unpaid
    notes: 'Working on doubles strategy',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    lastLessonDate: format(new Date(), 'yyyy-MM-dd'), // Today
  },
  {
    id: STUDENT_3_ID,
    coachId: COACH_ID,
    name: 'Carol Davis',
    contact: 'carol.davis@email.com',
    totalLessons: 1, // Fixed: aligned with actual lessons
    totalSpent: 75, // Fixed: aligned with actual lessons
    balance: 75, // Unpaid
    notes: 'Tournament preparation focus',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    lastLessonDate: format(new Date(), 'yyyy-MM-dd'), // Today
  },
  {
    id: STUDENT_4_ID,
    coachId: COACH_ID,
    name: 'David Kim',
    contact: '(555) 123-9876',
    totalLessons: 0, // Fixed: no lessons in mock data
    totalSpent: 0, // Fixed: no lessons in mock data
    balance: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    lastLessonDate: undefined, // No lessons yet
  },
];
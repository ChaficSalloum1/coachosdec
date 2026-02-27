import { AvailabilityRange, BlackoutDate } from '../types/coach';
import { format, addDays } from 'date-fns';

// Fixed UUIDs matching mockData.ts
const COACH_ID = '550e8400-e29b-41d4-a716-446655440000';

export const mockAvailabilityRanges: AvailabilityRange[] = [
  // Monday
  {
    id: '550e8400-e29b-41d4-a716-446655440050',
    coachId: COACH_ID,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '12:00',
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    courtId: '550e8400-e29b-41d4-a716-446655440030'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440051',
    coachId: COACH_ID,
    dayOfWeek: 1, // Monday
    startTime: '14:00',
    endTime: '18:00',
    areaId: '550e8400-e29b-41d4-a716-446655440011',
    facilityId: '550e8400-e29b-41d4-a716-446655440021'
  },

  // Tuesday
  {
    id: '550e8400-e29b-41d4-a716-446655440052',
    coachId: COACH_ID,
    dayOfWeek: 2, // Tuesday
    startTime: '09:00',
    endTime: '17:00',
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440022',
    courtId: '550e8400-e29b-41d4-a716-446655440032'
  },

  // Wednesday
  {
    id: '550e8400-e29b-41d4-a716-446655440053',
    coachId: COACH_ID,
    dayOfWeek: 3, // Wednesday
    startTime: '09:00',
    endTime: '12:00',
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    courtId: '550e8400-e29b-41d4-a716-446655440031'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440054',
    coachId: COACH_ID,
    dayOfWeek: 3, // Wednesday
    startTime: '14:00',
    endTime: '18:00',
    areaId: '550e8400-e29b-41d4-a716-446655440009'
  },

  // Thursday
  {
    id: '550e8400-e29b-41d4-a716-446655440055',
    coachId: COACH_ID,
    dayOfWeek: 4, // Thursday
    startTime: '09:00',
    endTime: '17:00',
    areaId: '550e8400-e29b-41d4-a716-446655440011',
    facilityId: '550e8400-e29b-41d4-a716-446655440021',
    courtId: '550e8400-e29b-41d4-a716-446655440033'
  },

  // Friday
  {
    id: '550e8400-e29b-41d4-a716-446655440056',
    coachId: COACH_ID,
    dayOfWeek: 5, // Friday
    startTime: '09:00',
    endTime: '15:00',
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    facilityId: '550e8400-e29b-41d4-a716-446655440020'
  }
];

export const mockBlackoutDates: BlackoutDate[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440060',
    coachId: COACH_ID,
    date: format(addDays(new Date(), 7), 'yyyy-MM-dd') // Next week
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440061',
    coachId: COACH_ID,
    date: format(addDays(new Date(), 10), 'yyyy-MM-dd') // 10 days from now
  }
];
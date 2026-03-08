import { Area, Facility, Court } from '../types/coach';

// Fixed UUIDs matching mockData.ts
const COACH_ID = '550e8400-e29b-41d4-a716-446655440000';

export const mockAreas: Area[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    coachId: COACH_ID,
    name: 'General'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    coachId: COACH_ID,
    name: 'Downtown'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    coachId: COACH_ID,
    name: 'Westside'
  }
];

export const mockFacilities: Facility[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    coachId: COACH_ID,
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Pro Club',
    address: '123 Main St, Downtown',
    notes: 'Premium facility with indoor courts'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    coachId: COACH_ID,
    areaId: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Community Center',
    address: '456 Oak Ave, Westside'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    coachId: COACH_ID,
    areaId: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Tennis Center',
    address: '789 Court Blvd, Downtown'
  }
];

export const mockCourts: Court[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440030',
    coachId: COACH_ID,
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    label: 'Court 1',
    sport: 'Tennis'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440031',
    coachId: COACH_ID,
    facilityId: '550e8400-e29b-41d4-a716-446655440020',
    label: 'Court 2',
    sport: 'Tennis'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440033',
    coachId: COACH_ID,
    facilityId: '550e8400-e29b-41d4-a716-446655440021',
    label: 'Main Court',
    sport: 'Pickleball'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440032',
    coachId: COACH_ID,
    facilityId: '550e8400-e29b-41d4-a716-446655440022',
    label: 'Center Court',
    sport: 'Tennis'
  }
];
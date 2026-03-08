export interface Coach {
  id: string;
  name: string;
  photo?: string;
  sports: string[];
  pricePerHour: number;
  paymentSettings: PaymentSettings;
  availability: WeeklyAvailability;
  blackoutDates: string[]; // ISO date strings
  bookingLink: string;
  calendarSyncEnabled?: boolean; // Whether to sync approved lessons to device calendar
  version?: number; // Optimistic locking version number
}

export interface Area {
  id: string;
  coachId: string;
  name: string;
  version?: number; // Optimistic locking version number
}

export interface Facility {
  id: string;
  coachId: string;
  areaId: string;
  name: string;
  address?: string;
  notes?: string;
}

export interface Court {
  id: string;
  coachId: string;
  facilityId: string;
  label: string;
  sport?: string;
}

export interface PaymentSettings {
  /** @encrypted QR code data for payment */
  qrCode?: string;
  /** @encrypted Phone ID for payment (Venmo, etc.) */
  phoneId?: string;
  cashEnabled: boolean;
}

export interface WeeklyAvailability {
  [key: string]: TimeSlot[]; // 'monday', 'tuesday', etc.
}

export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  areaId?: string;
  facilityId?: string;
  courtId?: string;
}

export interface AvailabilityRange {
  id: string;
  coachId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  areaId: string;
  facilityId?: string;
  courtId?: string;
}

export interface BlackoutDate {
  id: string;
  coachId: string;
  date: string; // ISO date string
}

export interface BookingRequest {
  id: string;
  coachId: string;
  studentName: string;
  studentContact: string;
  requestedDate: string; // ISO date string
  requestedTime: string; // HH:mm format
  duration: number; // minutes
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  version?: number; // Optimistic locking version number
}

export interface Lesson {
  id: string;
  coachId: string;
  studentId: string;
  studentName: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // minutes
  price: number;
  isPaid: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  calendarEventId?: string; // Device calendar event ID for synced lessons
  version?: number; // Optimistic locking version number
}

export interface StudentNote {
  id: string;
  studentId: string;
  coachId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  lessonId?: string; // Optional: link note to a specific lesson
  tags?: string[]; // Optional: categorize notes (e.g., "technique", "progress", "goal")
  version?: number; // Optimistic locking version number
}

export interface Student {
  id: string;
  coachId: string;
  name: string;
  /** @encrypted Contact information (email or phone) */
  contact: string;
  totalLessons: number;
  totalSpent: number;
  balance: number; // outstanding balance
  notes?: string; // Deprecated: keeping for backward compatibility, use studentNotes instead
  createdAt: string;
  lastLessonDate?: string;
  version?: number; // Optimistic locking version number
}
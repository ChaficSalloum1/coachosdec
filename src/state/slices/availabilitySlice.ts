import type { AvailabilityRange, BlackoutDate } from '../../types/coach';
import { generateHourlySlots, hasRangeOverlap, normalizeRanges, type OpenSlot } from '../../utils/availabilityRanges';
import type { SliceCreator } from './types';

// When the coach can teach: weekly ranges plus dates they are away.
export interface AvailabilitySlice {
  availabilityRanges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];

  addAvailabilityRange: (range: AvailabilityRange) => void;
  updateAvailabilityRange: (rangeId: string, updates: Partial<AvailabilityRange>) => void;
  deleteAvailabilityRange: (rangeId: string) => void;
  addBlackoutDate: (blackout: BlackoutDate) => void;
  removeBlackoutDate: (blackoutId: string) => void;
  // Start-up housekeeping: blank facility/court ids from older saves become "not set".
  normalizeAvailabilityRanges: () => void;

  getAvailabilityRangesForDay: (dayOfWeek: number) => AvailabilityRange[];
  // Hourly open slots for the public booking window, skipping blackout dates.
  getOpenSlots: () => OpenSlot[];
  // True if the range clashes with another on the same weekday (`excludeId` = the one being edited).
  validateRangeOverlap: (range: Omit<AvailabilityRange, 'id' | 'coachId'>, excludeId?: string) => boolean;
}

export const createAvailabilitySlice: SliceCreator<AvailabilitySlice> = (set, get) => ({
  availabilityRanges: [],
  blackoutDates: [],

  addAvailabilityRange: (range) =>
    set((state) => ({ availabilityRanges: [...state.availabilityRanges, range] })),

  updateAvailabilityRange: (rangeId, updates) =>
    set((state) => ({
      availabilityRanges: state.availabilityRanges.map((r) => (r.id === rangeId ? { ...r, ...updates } : r)),
    })),

  deleteAvailabilityRange: (rangeId) =>
    set((state) => ({ availabilityRanges: state.availabilityRanges.filter((r) => r.id !== rangeId) })),

  addBlackoutDate: (blackout) => set((state) => ({ blackoutDates: [...state.blackoutDates, blackout] })),

  removeBlackoutDate: (blackoutId) =>
    set((state) => ({ blackoutDates: state.blackoutDates.filter((b) => b.id !== blackoutId) })),

  normalizeAvailabilityRanges: () =>
    set((state) => ({ availabilityRanges: normalizeRanges(state.availabilityRanges) })),

  getAvailabilityRangesForDay: (dayOfWeek) => get().availabilityRanges.filter((r) => r.dayOfWeek === dayOfWeek),

  getOpenSlots: () => {
    const { availabilityRanges, blackoutDates } = get();
    return generateHourlySlots({ ranges: availabilityRanges, blackoutDates });
  },

  validateRangeOverlap: (range, excludeId) => hasRangeOverlap(range, get().availabilityRanges, excludeId),
});

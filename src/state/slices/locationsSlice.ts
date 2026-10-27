import type { Area, Court, Facility } from '../../types/coach';
import type { SliceCreator } from './types';

// Where lessons happen: area > facility > court.
export interface LocationsSlice {
  areas: Area[];
  facilities: Facility[];
  courts: Court[];

  addArea: (area: Area) => void;
  updateArea: (areaId: string, updates: Partial<Area>) => void;
  deleteArea: (areaId: string) => void; // also removes its facilities and their courts

  addFacility: (facility: Facility) => void;
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  deleteFacility: (facilityId: string) => void; // also removes its courts

  addCourt: (court: Court) => void;
  updateCourt: (courtId: string, updates: Partial<Court>) => void;
  deleteCourt: (courtId: string) => void;

  // "Facility • Court (Area)", or just the area name; '' if the area is unknown.
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
}

export const createLocationsSlice: SliceCreator<LocationsSlice> = (set, get) => ({
  areas: [],
  facilities: [],
  courts: [],

  addArea: (area) => set((state) => ({ areas: [...state.areas, area] })),

  updateArea: (areaId, updates) =>
    set((state) => ({ areas: state.areas.map((a) => (a.id === areaId ? { ...a, ...updates } : a)) })),

  deleteArea: (areaId) =>
    set((state) => ({
      areas: state.areas.filter((a) => a.id !== areaId),
      facilities: state.facilities.filter((f) => f.areaId !== areaId),
      courts: state.courts.filter((c) => state.facilities.find((f) => f.id === c.facilityId)?.areaId !== areaId),
    })),

  addFacility: (facility) => set((state) => ({ facilities: [...state.facilities, facility] })),

  updateFacility: (facilityId, updates) =>
    set((state) => ({
      facilities: state.facilities.map((f) => (f.id === facilityId ? { ...f, ...updates } : f)),
    })),

  deleteFacility: (facilityId) =>
    set((state) => ({
      facilities: state.facilities.filter((f) => f.id !== facilityId),
      courts: state.courts.filter((c) => c.facilityId !== facilityId),
    })),

  addCourt: (court) => set((state) => ({ courts: [...state.courts, court] })),

  updateCourt: (courtId, updates) =>
    set((state) => ({ courts: state.courts.map((c) => (c.id === courtId ? { ...c, ...updates } : c)) })),

  deleteCourt: (courtId) => set((state) => ({ courts: state.courts.filter((c) => c.id !== courtId) })),

  formatLocationText: (areaId, facilityId, courtId) => {
    const state = get();
    const area = areaId ? state.areas.find((a) => a.id === areaId) : null;
    if (!area) return '';
    const facility = facilityId ? state.facilities.find((f) => f.id === facilityId) : null;
    const court = courtId ? state.courts.find((c) => c.id === courtId) : null;

    const parts: string[] = [];
    if (facility) parts.push(facility.name);
    if (court) parts.push(court.label);
    return parts.length > 0 ? `${parts.join(' • ')} (${area.name})` : area.name;
  },
});

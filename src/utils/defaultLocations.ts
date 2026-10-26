import type { Area, Court, Facility } from '../types/coach';

export interface DefaultLocationNames {
  area: string;
  facility: string;
  court: string;
}

// One Area > Facility > Court chain so a single-location coach can add
// availability and lessons straight away instead of building the hierarchy
// first. Every coach gets fresh IDs (never shared constants), since ids are
// primary keys in Supabase.
export function createDefaultLocations(
  coachId: string,
  names: DefaultLocationNames,
  newId: () => string
): { area: Area; facility: Facility; court: Court } {
  const area: Area = { id: newId(), coachId, name: names.area };
  const facility: Facility = { id: newId(), coachId, areaId: area.id, name: names.facility };
  const court: Court = { id: newId(), coachId, facilityId: facility.id, label: names.court };
  return { area, facility, court };
}

import { describe, expect, it } from 'vitest';

import { createDefaultLocations } from './defaultLocations';

const names = { area: 'My area', facility: 'My club', court: 'Court 1' };

describe('createDefaultLocations', () => {
  it('builds a linked area > facility > court chain owned by the coach', () => {
    let n = 0;
    const { area, facility, court } = createDefaultLocations('coach-1', names, () => `id-${++n}`);

    expect(area).toEqual({ id: 'id-1', coachId: 'coach-1', name: 'My area' });
    expect(facility).toEqual({ id: 'id-2', coachId: 'coach-1', areaId: 'id-1', name: 'My club' });
    expect(court).toEqual({ id: 'id-3', coachId: 'coach-1', facilityId: 'id-2', label: 'Court 1' });
  });

  it('never reuses ids between calls', () => {
    let n = 0;
    const gen = () => `id-${++n}`;
    const a = createDefaultLocations('coach-1', names, gen);
    const b = createDefaultLocations('coach-2', names, gen);

    expect(new Set([a.area.id, a.facility.id, a.court.id, b.area.id, b.facility.id, b.court.id]).size).toBe(6);
  });
});

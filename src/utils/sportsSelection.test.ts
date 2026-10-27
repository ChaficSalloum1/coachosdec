import { describe, expect, it } from 'vitest';

import { buildSportsSelection, splitSportsForSelection } from './sportsSelection';

describe('sports selection', () => {
  it('splits a saved list into ready-made tiles and a free-text other', () => {
    const { selectedSports, otherSport } = splitSportsForSelection(['Tennis', 'Padel', 'Pickleball']);
    expect(selectedSports).toContain('Tennis');
    expect(selectedSports).toContain('Padel');
    expect(otherSport).toBe('Pickleball');
  });

  it('builds the saved list back from tiles plus the other sport, without blanks or duplicates', () => {
    const list = buildSportsSelection(['Tennis'], '  Pickleball ');
    expect(list).toContain('Tennis');
    expect(list).toContain('Pickleball');
    expect(buildSportsSelection(['Tennis'], '   ')).toEqual(['Tennis']);
  });
});

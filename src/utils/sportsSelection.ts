/* Which sports a coach has picked, split into the ready-made tiles and a free-text "other". */
import { SPORT_OPTIONS } from '../constants/sports';

export function buildSportsSelection(selectedSports: string[], otherSport: string): string[] {
  const baseSports = selectedSports.filter(sport => sport !== 'Other');
  const customSport = otherSport.trim();
  return customSport ? [...baseSports, customSport] : baseSports;
}

export function splitSportsForSelection(sports: string[]): { selectedSports: string[]; otherSport: string } {
  const optionLabels = SPORT_OPTIONS.map(option => option.value);
  const selectedKnownSports = sports.filter(sport => optionLabels.includes(sport));
  const customSports = sports.filter(sport => !optionLabels.includes(sport));
  return {
    selectedSports: customSports.length > 0
      ? [...selectedKnownSports, 'Other']
      : selectedKnownSports,
    otherSport: customSports.join(', '),
  };
}

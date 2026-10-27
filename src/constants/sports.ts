import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { t } from '../i18n';
import type { Translation } from '../i18n/locales/en';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type SportOption = {
  value: string; // what is stored on the coach profile (always English)
  key: keyof Translation['sports']; // translation key for the display name
  icon: IconName;
};

export const SPORT_OPTIONS: SportOption[] = [
  { value: 'Tennis', key: 'tennis', icon: 'tennisball-outline' },
  { value: 'Padel', key: 'padel', icon: 'albums-outline' },
  { value: 'Fitness', key: 'fitness', icon: 'barbell-outline' },
  { value: 'Swimming', key: 'swimming', icon: 'water-outline' },
  { value: 'Football', key: 'football', icon: 'football-outline' },
  { value: 'Basketball', key: 'basketball', icon: 'basketball-outline' },
  { value: 'Running', key: 'running', icon: 'walk-outline' },
  { value: 'Other', key: 'other', icon: 'add-circle-outline' },
];

// Known sports show in the app language; a custom sport the coach typed is shown as typed.
export function sportLabel(value: string): string {
  const option = SPORT_OPTIONS.find((o) => o.value === value);
  return option ? t(`sports.${option.key}`) : value;
}

export const sportsLabel = (values: string[], separator = ', ') => values.map(sportLabel).join(separator);

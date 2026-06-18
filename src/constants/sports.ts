import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type SportOption = {
  label: string;
  icon: IconName;
};

export const SPORT_OPTIONS: SportOption[] = [
  { label: 'Tennis', icon: 'tennisball-outline' },
  { label: 'Padel', icon: 'albums-outline' },
  { label: 'Fitness', icon: 'barbell-outline' },
  { label: 'Swimming', icon: 'water-outline' },
  { label: 'Football', icon: 'football-outline' },
  { label: 'Basketball', icon: 'basketball-outline' },
  { label: 'Running', icon: 'walk-outline' },
  { label: 'Other', icon: 'add-circle-outline' },
];

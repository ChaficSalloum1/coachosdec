import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { PublicBookingPreview } from '../screens/PublicBookingPreview';
import { PublicBookingWrapper } from '../screens/PublicBookingWrapper';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Locations: undefined;
  Availability: undefined;
  PublicBookingPreview: { slug: string };
  PublicBooking: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen 
        name="Locations" 
        component={LocationsScreen}
        options={{
          headerShown: true,
          presentation: 'modal',
          headerTitle: '',
          headerBackTitle: 'Settings',
        }}
      />
      <Stack.Screen 
        name="Availability" 
        component={AvailabilityScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PublicBookingPreview" 
        component={PublicBookingPreview}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PublicBooking" 
        component={PublicBookingWrapper}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
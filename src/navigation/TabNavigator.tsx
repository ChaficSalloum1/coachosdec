import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { TodayScreen } from '../screens/TodayScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { StudentsScreen } from '../screens/StudentsScreen';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { useCoachStore } from '../state/coachStore';
import type { Coach } from '../types/coach';
import { createDefaultLocations } from '../utils/defaultLocations';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DemoBanner } from '../components/DemoBanner';

export type TabParamList = {
  Today: undefined;
  Requests: undefined;
  Students: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const coach = useCoachStore(s => s.coach);
  const setCoach = useCoachStore(s => s.setCoach);
  const isDemoMode = useCoachStore(s => s.isDemoMode);
  const pendingCount = useCoachStore(
    s => s.bookingRequests.filter(r => r.status === 'pending').length
  );

  // A brand-new coach starts with one location chain so availability and
  // lessons work immediately; they can rename or delete it in Locations.
  const handleOnboardingComplete = (newCoach: Coach) => {
    setCoach(newCoach);
    const { areas, addArea, addFacility, addCourt } = useCoachStore.getState();
    if (areas.length > 0) return;
    const defaults = createDefaultLocations(
      newCoach.id,
      { area: t('defaultAreaName'), facility: t('defaultFacilityName'), court: t('defaultCourtName') },
      uuidv4
    );
    addArea(defaults.area);
    addFacility(defaults.facility);
    addCourt(defaults.court);
  };

  if (!coach) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const tabs = (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Today':
              iconName = focused ? 'today' : 'today-outline';
              break;
            case 'Requests':
              iconName = focused ? 'mail' : 'mail-outline';
              break;
            case 'Students':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: '#42526E',
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -4,
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E0E0E0',
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: '600',
          color: '#0B1220',
        },
        headerTintColor: '#0B1220',
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: t('today'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          title: t('requests'),
          headerShown: false,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{
          title: t('students'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: t('settings'),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );

  if (isDemoMode) {
    return (
      <View style={{ flex: 1 }}>
        <DemoBanner />
        {tabs}
      </View>
    );
  }

  return tabs;
}

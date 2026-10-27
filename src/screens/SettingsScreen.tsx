import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BookingLinkCard } from '../components/BookingLinkCard';
import { useCoachStore } from '../state/coachStore';
import { OnboardingScreen } from './OnboardingScreen';
import { AccountSection } from './settings/AccountSection';
import { AvailabilityCard } from './settings/AvailabilityCard';
import { CalendarSyncCard } from './settings/CalendarSyncCard';
import { DataSection } from './settings/DataSection';
import { DemoNotice } from './settings/DemoNotice';
import { EarningsCard } from './settings/EarningsCard';
import { LanguageSelector } from './settings/LanguageSelector';
import { LocationsCard } from './settings/LocationsCard';
import { PaymentSettings } from './settings/PaymentSettings';
import { ProfileCard } from './settings/ProfileCard';
import { SettingsSection } from './settings/SettingsSection';
import { UpgradeBanner } from './settings/UpgradeBanner';

// Everything about the coach's account and how the app behaves, one section per concern.
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { coach, updateCoach, setCoach, lessons, isDemoMode } = useCoachStore();
  const [isEditing, setIsEditing] = useState(false);

  if (!coach) {
    return <OnboardingScreen onComplete={setCoach} />;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
          {t('settings')}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <View className="px-4 py-6">
          {isDemoMode ? <DemoNotice /> : <UpgradeBanner />}

          <SettingsSection title="Earnings">
            <EarningsCard lessons={lessons} />
          </SettingsSection>

          {/* On-court essentials first */}
          <SettingsSection title={t('availability')}>
            <AvailabilityCard coach={coach} />
          </SettingsSection>

          <SettingsSection title={t('bookingLink')}>
            <BookingLinkCard coach={coach} />
          </SettingsSection>

          <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

          <SettingsSection title={t('profile')}>
            <ProfileCard coach={coach} isEditing={isEditing} onUpdate={updateCoach} />
            <Pressable
              onPress={() => setIsEditing(!isEditing)}
              className="mt-4 bg-primary rounded-default py-3 px-4 active:bg-primary/80"
            >
              <Text className="text-body font-medium text-white text-center">
                {isEditing ? t('saveChanges') : t('editProfile')}
              </Text>
            </Pressable>
          </SettingsSection>

          <SettingsSection title={t('locations')}>
            <LocationsCard />
          </SettingsSection>

          <SettingsSection title={t('paymentSettings')}>
            <PaymentSettings coach={coach} onUpdate={updateCoach} />
          </SettingsSection>

          <SettingsSection title={t('calendarIntegration')}>
            <CalendarSyncCard coach={coach} onUpdate={updateCoach} />
          </SettingsSection>

          <SettingsSection title={t('language')}>
            <LanguageSelector />
          </SettingsSection>

          <DataSection />
          <AccountSection isDemoMode={isDemoMode} />
        </View>
      </ScrollView>
    </View>
  );
}

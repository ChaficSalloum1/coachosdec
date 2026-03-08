import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useCoachStore } from '../state/coachStore';
import { Coach } from '../types/coach';
import { exportData } from '../utils/dataExport';
import { useNavigation } from '@react-navigation/native';
import { BookingLinkCard } from '../components/BookingLinkCard';
import { saveLanguage } from '../i18n/config';
import { getCurrentUser, signOut } from '../services/authService';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { coach, updateCoach, setCoach, bookingRequests, lessons, students } = useCoachStore();
  const [isEditing, setIsEditing] = useState(false);

  if (!coach) {
    return <OnboardingScreen onComplete={setCoach} />;
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // RootNavigator's onAuthStateChange listener handles navigation
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      t('exportDataTitle'),
      t('exportDataMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('export'),
          onPress: async () => {
            await exportData({
              coach,
              bookingRequests,
              lessons,
              students,
            });
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
          {t('settings')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Quick Access — on-court essentials first */}
          <Section title={t('availability')}>
            <AvailabilityCard coach={coach} />
          </Section>

          {/* Booking Link */}
          <Section title={t('bookingLink')}>
            <BookingLinkCard coach={coach} />
          </Section>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

          {/* Profile Section */}
          <Section title={t('profile')}>
            <ProfileCard coach={coach} isEditing={isEditing} onUpdate={updateCoach} />
            <Pressable
              onPress={() => setIsEditing(!isEditing)}
              className="mt-4 bg-primary rounded-default py-3 px-4 active:bg-primary/80"
            >
              <Text className="text-body font-medium text-white text-center">
                {isEditing ? t('saveChanges') : t('editProfile')}
              </Text>
            </Pressable>
          </Section>

          {/* Locations */}
          <Section title={t('locations')}>
            <LocationsCard />
          </Section>

          {/* Payment Settings */}
          <Section title={t('paymentSettings')}>
            <PaymentSettings coach={coach} onUpdate={updateCoach} />
          </Section>

          {/* Calendar Sync */}
          <Section title={t('calendarIntegration')}>
            <CalendarSyncCard coach={coach} onUpdate={updateCoach} />
          </Section>

          {/* Language Section */}
          <Section title={t('language')}>
            <LanguageSelector />
          </Section>

          {/* Data Management */}
          <Section title={t('data')}>
            <View className="space-y-3">
              <Pressable
                onPress={handleExportData}
                className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-medium mb-1" style={{ color: '#0B1220' }}>
                      {t('exportData')}
                    </Text>
                    <Text className="text-sm" style={{ color: '#42526E' }}>
                      {t('exportDataDesc')}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color="#42526E" />
                </View>
              </Pressable>
            </View>
          </Section>

          {/* Account */}
          <Section title="Account">
            <Pressable
              onPress={handleSignOut}
              className="bg-red-50 rounded-xl p-4 active:bg-red-100"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium" style={{ color: '#D32F2F' }}>
                  Sign Out
                </Text>
                <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
              </View>
            </Pressable>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View className="mb-8">
      <Text className="text-section font-semibold text-ink-900 mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="space-y-3">
        <Pressable
          onPress={() => handleLanguageChange('en')}
          className={`flex-row items-center justify-between p-3 rounded-lg ${
            currentLanguage === 'en' ? 'bg-blue-100' : 'bg-white'
          }`}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Text className="text-lg">🇬🇧</Text>
            </View>
            <Text
              className="text-base font-medium"
              style={{ color: currentLanguage === 'en' ? '#1E88E5' : '#0B1220' }}
            >
              {t('english')}
            </Text>
          </View>
          {currentLanguage === 'en' && (
            <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleLanguageChange('el')}
          className={`flex-row items-center justify-between p-3 rounded-lg ${
            currentLanguage === 'el' ? 'bg-blue-100' : 'bg-white'
          }`}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Text className="text-lg">🇬🇷</Text>
            </View>
            <Text
              className="text-base font-medium"
              style={{ color: currentLanguage === 'el' ? '#1E88E5' : '#0B1220' }}
            >
              {t('greek')}
            </Text>
          </View>
          {currentLanguage === 'el' && (
            <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface ProfileCardProps {
  coach: Coach;
  isEditing: boolean;
  onUpdate: (updates: Partial<Coach>) => void;
}

function ProfileCard({ coach, isEditing, onUpdate }: ProfileCardProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(coach.name);
  const [sports, setSports] = useState(coach.sports.join(', '));
  const [price, setPrice] = useState(coach.pricePerHour.toString());

  React.useEffect(() => {
    if (!isEditing) {
      onUpdate({
        name,
        sports: sports.split(',').map(s => s.trim()).filter(Boolean),
        pricePerHour: parseFloat(price) || 0,
      });
    }
  }, [isEditing]);

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('name')}</Text>
        {isEditing ? (
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('yourName')}
          />
        ) : (
          <Text className="text-body text-ink-900">{coach.name}</Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('sports')}</Text>
        {isEditing ? (
          <TextInput
            value={sports}
            onChangeText={setSports}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('sportsPlaceholder')}
          />
        ) : (
          <Text className="text-body text-ink-900">{coach.sports.join(', ')}</Text>
        )}
      </View>

      <View>
        <Text className="text-small font-medium text-ink-900 mb-2">{t('pricePerHour')}</Text>
        {isEditing ? (
          <View className="flex-row items-center">
            <Text className="text-body text-ink-900 mr-2">$</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              className="flex-1 bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
              placeholder="50"
              keyboardType="numeric"
            />
          </View>
        ) : (
          <Text className="text-body text-ink-900">${coach.pricePerHour}</Text>
        )}
      </View>
    </View>
  );
}

interface PaymentSettingsProps {
  coach: Coach;
  onUpdate: (updates: Partial<Coach>) => void;
}

function PaymentSettings({ coach, onUpdate }: PaymentSettingsProps) {
  const { t } = useTranslation();
  const updatePaymentSettings = (updates: Partial<Coach['paymentSettings']>) => {
    onUpdate({
      paymentSettings: {
        ...coach.paymentSettings,
        ...updates,
      },
    });
  };

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('qrCode')}</Text>
        <TextInput
          value={coach.paymentSettings.qrCode || ''}
          onChangeText={(text) => updatePaymentSettings({ qrCode: text })}
          className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
          placeholder={t('qrCodePlaceholder')}
        />
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('phoneId')}</Text>
        <TextInput
          value={coach.paymentSettings.phoneId || ''}
          onChangeText={(text) => updatePaymentSettings({ phoneId: text })}
          className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
          placeholder={t('phoneIdPlaceholder')}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-body font-medium text-ink-900">{t('acceptCash')}</Text>
        <Switch
          value={coach.paymentSettings.cashEnabled}
          onValueChange={(value) => updatePaymentSettings({ cashEnabled: value })}
          trackColor={{ false: '#E0E0E0', true: '#1E88E5' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

interface AvailabilityCardProps {
  coach: Coach;
}

function AvailabilityCard({ coach: _coach }: AvailabilityCardProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { availabilityRanges } = useCoachStore();

  const getAvailabilityText = () => {
    const uniqueDays = new Set(availabilityRanges.map(r => r.dayOfWeek));
    if (uniqueDays.size === 0) return t('noAvailabilitySet');
    return t('availableDays', { count: uniqueDays.size });
  };

  return (
    <Pressable
      onPress={() => navigation.navigate('Availability' as never)}
      className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium mb-1" style={{ color: '#0B1220' }}>
            {t('weeklySchedule')}
          </Text>
          <Text className="text-sm" style={{ color: '#42526E' }}>
            {getAvailabilityText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#42526E" />
      </View>
    </Pressable>
  );
}

interface CalendarSyncCardProps {
  coach: Coach;
  onUpdate: (updates: Partial<Coach>) => void;
}

function CalendarSyncCard({ coach, onUpdate }: CalendarSyncCardProps) {
  const { t } = useTranslation();
  const [isInitializing, setIsInitializing] = React.useState(false);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Request calendar permissions when enabling
      setIsInitializing(true);
      try {
        const { CalendarService } = await import('../utils/calendarService');
        const hasPermission = await CalendarService.checkPermissions();

        if (!hasPermission) {
          const initialized = await CalendarService.initialize();
          if (!initialized) {
            Alert.alert(
              t('calendarAccessRequired'),
              t('calendarAccessMessage'),
              [{ text: t('ok') }]
            );
            return;
          }
        }

        onUpdate({ calendarSyncEnabled: true });
        Alert.alert(
          t('calendarSyncEnabled'),
          t('calendarSyncEnabledMessage'),
          [{ text: t('gotIt') }]
        );
      } catch (error) {
        Alert.alert(
          t('calendarSyncFailed'),
          t('calendarSyncFailedMessage'),
          [{ text: t('ok') }]
        );
      } finally {
        setIsInitializing(false);
      }
    } else {
      onUpdate({ calendarSyncEnabled: false });
    }
  };

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: '#0B1220' }}>
              {t('syncToCalendar')}
            </Text>
          </View>
          <Text className="text-sm" style={{ color: '#42526E' }}>
            {t('syncToCalendarDesc')}
          </Text>
        </View>
        <Switch
          value={coach.calendarSyncEnabled ?? false}
          onValueChange={handleToggle}
          disabled={isInitializing}
          trackColor={{ false: '#E0E0E0', true: '#1E88E5' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {coach.calendarSyncEnabled && (
        <View className="bg-blue-50 rounded-lg p-3 mt-2">
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#1E88E5" style={{ marginRight: 6, marginTop: 2 }} />
            <Text className="text-xs flex-1" style={{ color: '#1E88E5' }}>
              {t('calendarSyncActive')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function LocationsCard() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { areas, facilities, courts } = useCoachStore();

  const getLocationsText = () => {
    const counts = [];
    if (areas.length > 0) counts.push(t('areas', { count: areas.length }));
    if (facilities.length > 0) counts.push(t('facilities', { count: facilities.length }));
    if (courts.length > 0) counts.push(t('courts', { count: courts.length }));

    if (counts.length === 0) return t('noLocationsSetUp');
    return counts.join(', ');
  };

  return (
    <Pressable
      onPress={() => navigation.navigate('Locations' as never)}
      className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium mb-1" style={{ color: '#0B1220' }}>
            {t('manageLocations')}
          </Text>
          <Text className="text-sm" style={{ color: '#42526E' }}>
            {getLocationsText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#42526E" />
      </View>
    </Pressable>
  );
}

interface OnboardingScreenProps {
  onComplete: (coach: Coach) => void;
}

function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [sports, setSports] = useState('');
  const [price, setPrice] = useState('');

  const handleComplete = async () => {
    if (!name.trim() || !sports.trim() || !price.trim()) {
      Alert.alert(t('missingInformation'), t('fillAllFields'));
      return;
    }

    // Get authenticated user ID - coach.id must match auth.uid() for RLS policies
    const user = await getCurrentUser();
    if (!user?.id) {
      Alert.alert(
        t('error') || 'Error',
        t('mustBeLoggedIn') || 'You must be logged in to create a coach profile'
      );
      return;
    }

    const coach: Coach = {
      id: user.id, // Use auth.uid() instead of generated ID for RLS security
      name: name.trim(),
      sports: sports.split(',').map(s => s.trim()).filter(Boolean),
      pricePerHour: parseFloat(price) || 0,
      paymentSettings: {
        cashEnabled: true,
      },
      availability: {},
      blackoutDates: [],
      bookingLink: `${name.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`,
    };

    onComplete(coach);
  };

  return (
    <View className="flex-1 bg-white px-4 py-6">
      <View className="items-center mb-8">
        <Ionicons name="person-circle-outline" size={80} color="#1E88E5" />
        <Text className="text-title font-semibold text-ink-900 mt-4 mb-2">
          {t('welcomeToCoachOS')}
        </Text>
        <Text className="text-body text-ink-600 text-center">
          {t('setupProfile')}
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-small font-medium text-ink-900 mb-2">{t('yourName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-gray-50 rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200"
            placeholder="John Smith"
          />
        </View>

        <View>
          <Text className="text-small font-medium text-ink-900 mb-2">{t('sportsYouCoach')}</Text>
          <TextInput
            value={sports}
            onChangeText={setSports}
            className="bg-gray-50 rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200"
            placeholder={t('sportsPlaceholder')}
          />
        </View>

        <View>
          <Text className="text-small font-medium text-ink-900 mb-2">{t('pricePerHour')}</Text>
          <View className="flex-row items-center">
            <Text className="text-body text-ink-900 mr-2">$</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              className="flex-1 bg-gray-50 rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200"
              placeholder="50"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleComplete}
        className="mt-8 bg-primary rounded-default py-4 px-4 active:bg-primary/80"
      >
        <Text className="text-body font-medium text-white text-center">
          {t('getStarted')}
        </Text>
      </Pressable>
    </View>
  );
}
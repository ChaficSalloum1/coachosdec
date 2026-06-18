import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  Platform,
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
import type { PaymentPreference } from '../modules/payments';
import { normalizePaymentSettings } from '../modules/payments';
import { SPORT_OPTIONS } from '../constants/sports';

const SUBSCRIPTIONS_ENABLED = process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { coach, updateCoach, setCoach, bookingRequests, lessons, students, isDemoMode, exitDemoMode } = useCoachStore();
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

  const confirmExitDemo = async () => {
    await signOut();
    exitDemoMode();
  };

  const handleExitDemo = () => {
    const message = 'This will clear demo data and return you to sign up or sign in.';

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Exit demo workspace?\n\n${message}`)) {
        void confirmExitDemo();
      }
      return;
    }

    Alert.alert(
      'Exit demo workspace?',
      message,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Exit Demo',
          style: 'destructive',
          onPress: () => {
            void confirmExitDemo();
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      >
        <View className="px-4 py-6">
          {isDemoMode && (
            <View
              style={{
                backgroundColor: '#FFF7E0',
                borderColor: '#F2D28A',
                borderWidth: 1,
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#8A5A00', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
                Demo workspace
              </Text>
              <Text style={{ color: '#8A5A00', fontSize: 13, lineHeight: 18 }}>
                You are exploring sample data locally. Nothing is synced to Supabase.
              </Text>
            </View>
          )}

          {/* Upgrade CTA */}
          {!isDemoMode && SUBSCRIPTIONS_ENABLED && (
            <Pressable
              onPress={() => navigation.navigate('Paywall' as never)}
              style={{
                backgroundColor: '#0B1220',
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Upgrade to CoachOS Pro
              </Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}

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
            {isDemoMode ? (
              <Pressable
                onPress={handleExitDemo}
                className="bg-blue-50 rounded-xl p-4 active:bg-blue-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-medium mb-1" style={{ color: '#1E88E5' }}>
                      Exit Demo & Create Account
                    </Text>
                    <Text className="text-sm" style={{ color: '#42526E' }}>
                      Clear sample data and return to sign up or sign in.
                    </Text>
                  </View>
                  <Ionicons name="person-add-outline" size={20} color="#1E88E5" />
                </View>
              </Pressable>
            ) : (
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
            )}
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

interface SportsTileSelectorProps {
  selectedSports: string[];
  onChange: (sports: string[]) => void;
  otherSport: string;
  onOtherSportChange: (sport: string) => void;
  compact?: boolean;
}

function SportsTileSelector({
  selectedSports,
  onChange,
  otherSport,
  onOtherSportChange,
  compact = false,
}: SportsTileSelectorProps) {
  const toggleSport = (sport: string) => {
    if (sport === 'Other') {
      if (selectedSports.includes('Other')) {
        onOtherSportChange('');
        onChange(selectedSports.filter(item => item !== 'Other'));
      } else {
        onChange([...selectedSports, 'Other']);
      }
      return;
    }

    if (selectedSports.includes(sport)) {
      onChange(selectedSports.filter(item => item !== sport));
      return;
    }

    onChange([...selectedSports, sport]);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SPORT_OPTIONS.map(option => {
          const selected = selectedSports.includes(option.label);
          return (
            <Pressable
              key={option.label}
              onPress={() => toggleSport(option.label)}
              style={{
                width: compact ? '31%' : '48%',
                minHeight: compact ? 86 : 104,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? '#1E88E5' : '#D7DEE8',
                backgroundColor: selected ? '#E8F2FF' : '#FFFFFF',
                padding: compact ? 10 : 14,
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Ionicons
                  name={option.icon}
                  size={compact ? 22 : 26}
                  color={selected ? '#1E88E5' : '#42526E'}
                />
                {selected && <Ionicons name="checkmark-circle" size={18} color="#1E88E5" />}
              </View>
              <Text
                style={{
                  color: selected ? '#1E88E5' : '#0B1220',
                  fontSize: compact ? 13 : 15,
                  fontWeight: '700',
                  marginTop: 10,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedSports.includes('Other') && (
        <TextInput
          value={otherSport}
          onChangeText={onOtherSportChange}
          className="bg-white rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200 mt-3"
          placeholder="Add your sport"
          autoCapitalize="words"
        />
      )}
    </View>
  );
}

function buildSportsSelection(selectedSports: string[], otherSport: string): string[] {
  const baseSports = selectedSports.filter(sport => sport !== 'Other');
  const customSport = otherSport.trim();
  return customSport ? [...baseSports, customSport] : baseSports;
}

function splitSportsForSelection(sports: string[]): { selectedSports: string[]; otherSport: string } {
  const optionLabels = SPORT_OPTIONS.map(option => option.label);
  const selectedKnownSports = sports.filter(sport => optionLabels.includes(sport));
  const customSports = sports.filter(sport => !optionLabels.includes(sport));
  return {
    selectedSports: customSports.length > 0
      ? [...selectedKnownSports, 'Other']
      : selectedKnownSports,
    otherSport: customSports.join(', '),
  };
}

interface ProfileCardProps {
  coach: Coach;
  isEditing: boolean;
  onUpdate: (updates: Partial<Coach>) => void;
}

function ProfileCard({ coach, isEditing, onUpdate }: ProfileCardProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(coach.name);
  const initialSports = splitSportsForSelection(coach.sports);
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports.selectedSports);
  const [otherSport, setOtherSport] = useState(initialSports.otherSport);
  const [price, setPrice] = useState(coach.pricePerHour.toString());

  React.useEffect(() => {
    if (!isEditing) {
      onUpdate({
        name,
        sports: buildSportsSelection(selectedSports, otherSport),
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
          <SportsTileSelector
            selectedSports={selectedSports}
            onChange={setSelectedSports}
            otherSport={otherSport}
            onOtherSportChange={setOtherSport}
            compact
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
  const settings = normalizePaymentSettings(coach.paymentSettings);
  const updatePaymentSettings = (updates: Partial<Coach['paymentSettings']>) => {
    onUpdate({
      paymentSettings: {
        ...settings,
        ...updates,
      },
    });
  };

  const methods: { value: PaymentPreference; label: string }[] = [
    { value: 'REVOLUT', label: 'Revolut' },
    { value: 'IRIS', label: 'IRIS' },
    { value: 'IBAN', label: 'IBAN' },
    { value: 'CASH', label: 'Cash' },
    { value: 'MULTIPLE', label: 'Multiple' },
  ];

  const showRevolut = settings.paymentPreference === 'REVOLUT' || settings.paymentPreference === 'MULTIPLE';
  const showIris = settings.paymentPreference === 'IRIS' || settings.paymentPreference === 'MULTIPLE';
  const showIban = settings.paymentPreference === 'IBAN' || settings.paymentPreference === 'MULTIPLE';

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="mb-5">
        <Text className="text-base font-semibold mb-1" style={{ color: '#0B1220' }}>
          How do you want clients to pay you?
        </Text>
        <Text className="text-sm" style={{ color: '#42526E', lineHeight: 19 }}>
          Coachiko does not process payments directly yet. We help you send clear payment requests and track who has paid.
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">Preferred method</Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {methods.map(method => {
            const selected = settings.paymentPreference === method.value;
            return (
              <Pressable
                key={method.value}
                onPress={() => updatePaymentSettings({ paymentPreference: method.value })}
                className="rounded-lg px-3 py-2 border"
                style={{
                  backgroundColor: selected ? '#E8F2FF' : '#FFFFFF',
                  borderColor: selected ? '#1E88E5' : '#D7DEE8',
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: selected ? '#1E88E5' : '#0B1220' }}
                >
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showRevolut && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">Revolut payment link</Text>
          <TextInput
            value={settings.revolutLink || ''}
            onChangeText={(text) => updatePaymentSettings({ revolutLink: text.trim() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="https://revolut.me/coachname"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
            Clients can open this directly from their session reminder.
          </Text>
        </View>
      )}

      {showIris && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">IRIS alias</Text>
          <TextInput
            value={settings.irisAlias || ''}
            onChangeText={(text) => updatePaymentSettings({ irisAlias: text.trim() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="@coachalias or phone"
            autoCapitalize="none"
          />
          <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
            Clients will use this alias inside their own banking app.
          </Text>
        </View>
      )}

      {showIban && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">IBAN</Text>
          <TextInput
            value={settings.iban || ''}
            onChangeText={(text) => updatePaymentSettings({ iban: text.toUpperCase() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="GR..."
            autoCapitalize="characters"
          />
          <Text className="text-small font-medium text-ink-900 mt-3 mb-2">Beneficiary name</Text>
          <TextInput
            value={settings.ibanBeneficiaryName || ''}
            onChangeText={(text) => updatePaymentSettings({ ibanBeneficiaryName: text })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={coach.name}
          />
          <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
            Used for bank transfer instructions and SEPA-compatible QR codes where supported.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-body font-medium text-ink-900">Accept cash/manual payment</Text>
        <Switch
          value={settings.cashEnabled}
          onValueChange={(value) => updatePaymentSettings({ cashEnabled: value })}
          trackColor={{ false: '#E0E0E0', true: '#1E88E5' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View>
        <Text className="text-small font-medium text-ink-900 mb-2">Cancellation policy</Text>
        <TextInput
          value={settings.cancellationPolicy || ''}
          onChangeText={(text) => updatePaymentSettings({ cancellationPolicy: text })}
          className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
          placeholder="Example: Cancel at least 24 hours before the lesson."
          multiline
          numberOfLines={3}
          maxLength={600}
          style={{ textAlignVertical: 'top' }}
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

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [otherSport, setOtherSport] = useState('');
  const [price, setPrice] = useState('');

  const handleComplete = async () => {
    const sports = buildSportsSelection(selectedSports, otherSport);

    if (!name.trim() || sports.length === 0 || !price.trim()) {
      Alert.alert(
        t('missingInformation'),
        'Add your name, choose at least one sport, and set your starting hourly price.'
      );
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
      sports,
      pricePerHour: parseFloat(price) || 0,
      paymentSettings: {
        cashEnabled: true,
        paymentPreference: 'CASH',
      },
      availability: {},
      blackoutDates: [],
      bookingLink: `${name.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`,
    };

    onComplete(coach);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
      >
        <View className="mb-7">
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: '#E8F2FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Ionicons name="briefcase-outline" size={28} color="#1E88E5" />
          </View>
          <Text style={{ color: '#0B1220', fontSize: 28, fontWeight: '800', lineHeight: 34 }}>
            Set up your coaching profile
          </Text>
          <Text style={{ color: '#42526E', fontSize: 15, lineHeight: 22, marginTop: 8 }}>
            Start with the essentials. Payments, availability, locations, and booking link can all be finished later in Settings.
          </Text>
        </View>

        <View style={{ gap: 22 }}>
          <View>
            <Text className="text-small font-medium text-ink-900 mb-2">Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-gray-50 rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200"
              placeholder="Nikos Papadakis"
              autoCapitalize="words"
            />
          </View>

          <View>
            <Text className="text-small font-medium text-ink-900 mb-2">Sports you coach</Text>
            <Text style={{ color: '#42526E', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
              Choose one or more. You can change this later.
            </Text>
            <SportsTileSelector
              selectedSports={selectedSports}
              onChange={setSelectedSports}
              otherSport={otherSport}
              onOtherSportChange={setOtherSport}
            />
          </View>

          <View>
            <Text className="text-small font-medium text-ink-900 mb-2">Starting hourly price</Text>
            <View className="flex-row items-center">
              <Text className="text-body text-ink-900 mr-2">€</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                className="flex-1 bg-gray-50 rounded-default px-3 py-3 text-body text-ink-900 border border-gray-200"
                placeholder="45"
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
            Create workspace
          </Text>
        </Pressable>

        <Text style={{ color: '#42526E', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 14 }}>
          Optional setup steps are waiting in Settings whenever you are ready.
        </Text>
      </ScrollView>
    </View>
  );
}

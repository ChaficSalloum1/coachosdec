import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { showToast } from '../state/toastStore';
import { Coach } from '../types/coach';
import { getCurrentUser } from '../services/authService';
import { currencySymbol, type CurrencyCode } from '../modules/payments';
import { CurrencyPicker } from '../components/CurrencyPicker';

import { SportsTileSelector } from './settings/SportsTileSelector';
import { buildSportsSelection } from '../utils/sportsSelection';
import { DesignTokens } from '../utils/designTokens';

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
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');

  const handleComplete = async () => {
    const sports = buildSportsSelection(selectedSports, otherSport);

    if (!name.trim() || sports.length === 0 || !price.trim()) {
      showToast('Add your name, choose at least one sport, and set your starting hourly price.', 'error');
      return;
    }

    // Get authenticated user ID - coach.id must match auth.uid() for RLS policies
    const user = await getCurrentUser();
    if (!user?.id) {
      showToast(t('mustBeLoggedIn', 'You must be logged in to create a coach profile'), 'error');
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
        currency,
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
              backgroundColor: DesignTokens.colors.brand.tint,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Ionicons name="briefcase-outline" size={28} color={DesignTokens.colors.brand.default} />
          </View>
          <Text style={{ color: DesignTokens.colors.text.strong, fontSize: 28, fontWeight: '800', lineHeight: 34 }}>
            Set up your coaching profile
          </Text>
          <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 15, lineHeight: 22, marginTop: 8 }}>
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
            <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
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
            <Text className="text-small font-medium text-ink-900 mb-2">Currency</Text>
            <CurrencyPicker value={currency} onChange={setCurrency} />
          </View>

          <View>
            <Text className="text-small font-medium text-ink-900 mb-2">Starting hourly price</Text>
            <View className="flex-row items-center">
              <Text className="text-body text-ink-900 mr-2">{currencySymbol(currency)}</Text>
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

        <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 14 }}>
          Optional setup steps are waiting in Settings whenever you are ready.
        </Text>
      </ScrollView>
    </View>
  );
}

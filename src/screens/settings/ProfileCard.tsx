import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Coach } from '../../types/coach';
import { currencySymbol, formatMoney, resolveCurrency } from '../../modules/payments';

import { SportsTileSelector } from './SportsTileSelector';
import { buildSportsSelection, splitSportsForSelection } from '../../utils/sportsSelection';
import { t } from '../../i18n';
import { sportsLabel } from '../../constants/sports';

interface ProfileCardProps {
  coach: Coach;
  isEditing: boolean;
  onUpdate: (updates: Partial<Coach>) => void;
}

export function ProfileCard({ coach, isEditing, onUpdate }: ProfileCardProps) {
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
        <Text className="text-small font-medium text-ink-900 mb-2">{t('common.name')}</Text>
        {isEditing ? (
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('settings.yourName')}
          />
        ) : (
          <Text className="text-body text-ink-900">{coach.name}</Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.sports')}</Text>
        {isEditing ? (
          <SportsTileSelector
            selectedSports={selectedSports}
            onChange={setSelectedSports}
            otherSport={otherSport}
            onOtherSportChange={setOtherSport}
            compact
          />
        ) : (
          <Text className="text-body text-ink-900">{sportsLabel(coach.sports)}</Text>
        )}
      </View>

      <View>
        <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.pricePerHour')}</Text>
        {isEditing ? (
          <View className="flex-row items-center">
            <Text className="text-body text-ink-900 mr-2">{currencySymbol(resolveCurrency(coach.paymentSettings?.currency))}</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              className="flex-1 bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
              placeholder="50"
              keyboardType="numeric"
            />
          </View>
        ) : (
          <Text className="text-body text-ink-900">{formatMoney(coach.pricePerHour, resolveCurrency(coach.paymentSettings?.currency))}</Text>
        )}
      </View>
    </View>
  );
}

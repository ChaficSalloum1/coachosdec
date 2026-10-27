import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../../state/coachStore';
import { Coach } from '../../types/coach';
import { useNavigation } from '@react-navigation/native';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

interface AvailabilityCardProps {
  coach: Coach;
}

export function AvailabilityCard({ coach: _coach }: AvailabilityCardProps) {
  const navigation = useNavigation();
  const { availabilityRanges } = useCoachStore();

  const getAvailabilityText = () => {
    const uniqueDays = new Set(availabilityRanges.map(r => r.dayOfWeek));
    if (uniqueDays.size === 0) return t('settings.noAvailabilitySet');
    return t('settings.availableDays', { count: uniqueDays.size });
  };

  return (
    <Pressable
      onPress={() => navigation.navigate('Availability' as never)}
      className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
            {t('settings.weeklySchedule')}
          </Text>
          <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
            {getAvailabilityText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.text.muted} />
      </View>
    </Pressable>
  );
}

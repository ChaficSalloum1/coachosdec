import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCoachStore } from '../../state/coachStore';
import { Coach } from '../../types/coach';
import { useNavigation } from '@react-navigation/native';

interface AvailabilityCardProps {
  coach: Coach;
}

export function AvailabilityCard({ coach: _coach }: AvailabilityCardProps) {
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

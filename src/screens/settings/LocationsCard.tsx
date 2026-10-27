import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCoachStore } from '../../state/coachStore';
import { useNavigation } from '@react-navigation/native';

export function LocationsCard() {
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

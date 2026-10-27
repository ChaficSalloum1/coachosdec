import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../../state/coachStore';
import { useNavigation } from '@react-navigation/native';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

export function LocationsCard() {
  const navigation = useNavigation();
  const { areas, facilities, courts } = useCoachStore();

  const getLocationsText = () => {
    const counts = [];
    if (areas.length > 0) counts.push(t('settings.areas', { count: areas.length }));
    if (facilities.length > 0) counts.push(t('settings.facilities', { count: facilities.length }));
    if (courts.length > 0) counts.push(t('settings.courts', { count: courts.length }));

    if (counts.length === 0) return t('settings.noLocationsSetUp');
    return counts.join(', ');
  };

  return (
    <Pressable
      onPress={() => navigation.navigate('Locations' as never)}
      className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
            {t('settings.manageLocations')}
          </Text>
          <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
            {getLocationsText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.text.muted} />
      </View>
    </Pressable>
  );
}

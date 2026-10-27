import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPORT_OPTIONS, sportLabel } from '../../constants/sports';
import { t } from '../../i18n';
import { DesignTokens } from '../../utils/designTokens';

interface SportsTileSelectorProps {
  selectedSports: string[];
  onChange: (sports: string[]) => void;
  otherSport: string;
  onOtherSportChange: (sport: string) => void;
  compact?: boolean;
}

export function SportsTileSelector({
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
          const selected = selectedSports.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleSport(option.value)}
              style={{
                width: compact ? '31%' : '48%',
                minHeight: compact ? 86 : 104,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.brand.outline,
                backgroundColor: selected ? DesignTokens.colors.brand.tint : DesignTokens.colors.white,
                padding: compact ? 10 : 14,
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Ionicons
                  name={option.icon}
                  size={compact ? 22 : 26}
                  color={selected ? DesignTokens.colors.brand.default : DesignTokens.colors.text.muted}
                />
                {selected && <Ionicons name="checkmark-circle" size={18} color={DesignTokens.colors.brand.default} />}
              </View>
              <Text
                style={{
                  color: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong,
                  fontSize: compact ? 13 : 15,
                  fontWeight: '700',
                  marginTop: 10,
                }}
              >
                {sportLabel(option.value)}
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
          placeholder={t('settings.addYourSport')}
          autoCapitalize="words"
        />
      )}
    </View>
  );
}

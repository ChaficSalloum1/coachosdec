import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setLanguage, type Language } from '../../i18n';
import { saveLanguage } from '../../i18n/persistence';
import { useLanguage } from '../../i18n/useLanguage';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

export function LanguageSelector() {
  const currentLanguage = useLanguage();

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
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
              style={{ color: currentLanguage === 'en' ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong }}
            >
              {t('settings.english')}
            </Text>
          </View>
          {currentLanguage === 'en' && (
            <Ionicons name="checkmark-circle" size={24} color={DesignTokens.colors.brand.default} />
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
              style={{ color: currentLanguage === 'el' ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong }}
            >
              {t('settings.greek')}
            </Text>
          </View>
          {currentLanguage === 'el' && (
            <Ionicons name="checkmark-circle" size={24} color={DesignTokens.colors.brand.default} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

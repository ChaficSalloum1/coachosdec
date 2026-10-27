import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../../i18n/config';

export function LanguageSelector() {
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

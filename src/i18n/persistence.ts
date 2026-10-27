/* Remembers the coach's language choice on the phone. */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LANGUAGES, setLanguage, type Language } from './index';

const LANGUAGE_KEY = '@app_language';

// Applies the saved language, if any. Call once at start-up.
export const restoreLanguage = async (): Promise<void> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (LANGUAGES as readonly string[]).includes(saved)) await setLanguage(saved as Language);
  } catch {
    // Not being able to read it just means English.
  }
};

export const saveLanguage = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

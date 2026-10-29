import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { View } from "react-native";
import { restoreLanguage } from "./src/i18n/persistence";
import { useLanguage } from "./src/i18n/useLanguage";
import { DesignTokens } from "./src/utils/designTokens";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { useMockData } from "./src/hooks/useMockData";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ToastHost } from "./src/components/ToastHost";
import { useCoachStore } from "./src/state/coachStore";
import { useSupabaseSync } from "./src/hooks/useSupabaseSync";
import { useOfflineQueueProcessor } from "./src/hooks/useOfflineQueueProcessor";
import { navigationRef } from "./src/navigation/navigationRef";
import { useNotificationTaps } from "./src/hooks/useNotificationTaps";
import { isSupabaseConfigured } from "./src/utils/supabaseConfig";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

void restoreLanguage();

function AppContent() {
  const language = useLanguage();
  useNotificationTaps();
  const isDemoMode = useCoachStore(s => s.isDemoMode);

  useMockData(!isSupabaseConfigured() && !isDemoMode);
  useSupabaseSync();
  useOfflineQueueProcessor();

  useEffect(() => {
    const store = useCoachStore.getState();

    if (store.availabilityRanges.length > 0) {
      store.normalizeAvailabilityRanges();
    }

    store.autoCompletePastLessons();
    store.recalculateStudentTotals();

    if (__DEV__) {
      const { studentIssues, lessonIssues } = store.checkDataIntegrity();
      if (studentIssues.length > 0 || lessonIssues.length > 0) {
        console.log('🔍 Data Integrity Issues Found:');
        if (studentIssues.length > 0) console.log('  Student Issues:', studentIssues);
        if (lessonIssues.length > 0) console.log('  Lesson Issues:', lessonIssues);
      } else {
        console.log('✅ Data integrity check passed - no issues found');
      }
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: DesignTokens.colors.white }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: DesignTokens.colors.white }}>
        <View style={{ flex: 1, backgroundColor: DesignTokens.colors.white }}>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" />
            {/* Remounted on a language change so every screen redraws in the new language; navigation state lives in the container and is kept. */}
            <RootNavigator key={language} />
          </NavigationContainer>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;

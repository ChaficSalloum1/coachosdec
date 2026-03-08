import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { PostHogProvider } from "posthog-react-native";
import "./src/i18n/config";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { useMockData } from "./src/hooks/useMockData";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { useCoachStore } from "./src/state/coachStore";
import { useSupabaseSync } from "./src/hooks/useSupabaseSync";
import { initSentry, withSentry } from "./src/services/sentryService";
import { POSTHOG_KEY, POSTHOG_HOST } from "./src/services/analyticsService";

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

// Initialise Sentry as early as possible (no-ops if DSN not set)
initSentry();

function AppContent() {
  useMockData();
  useSupabaseSync();

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
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function App() {
  if (POSTHOG_KEY) {
    return (
      <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: POSTHOG_HOST }}>
        <AppContent />
      </PostHogProvider>
    );
  }
  return <AppContent />;
}

export default withSentry(App);

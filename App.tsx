import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { View } from "react-native";
import "./src/i18n/config";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { useMockData } from "./src/hooks/useMockData";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { useCoachStore } from "./src/state/coachStore";
import { useSupabaseSync } from "./src/hooks/useSupabaseSync";

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

const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes("your_supabase") && !key.includes("your_supabase"));
};

function AppContent() {
  const isDemoMode = useCoachStore(s => s.isDemoMode);

  useMockData(!isSupabaseConfigured() && !isDemoMode);
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
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

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import "./src/i18n/config";

import { TabNavigator } from "./src/navigation/TabNavigator";
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

export default function App() {
  useMockData();
  useSupabaseSync(); // Automatically syncs data with Supabase

  // Test Supabase connection on app start (development only)
  useEffect(() => {
    if (__DEV__) {
      const testConnection = async () => {
        try {
          const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
          const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            console.log("⚠️ Supabase: Credentials not configured in .env file");
            return;
          }

          if (supabaseUrl.includes("your_supabase") || supabaseKey.includes("your_supabase")) {
            console.log("⚠️ Supabase: Credentials contain placeholders - replace with actual values");
            return;
          }

          const { getSupabaseClient } = await import("./src/api/supabase");
          const supabase = getSupabaseClient();
          
          // Test connection with a simple query
          const { error } = await supabase.from("coaches").select("id").limit(1);
          
          if (error) {
            if (error.code === "PGRST116") {
              console.log("⚠️ Supabase: Tables don't exist - run supabase-schema.sql in Supabase dashboard");
            } else {
              console.log(`⚠️ Supabase: Connection error - ${error.message}`);
            }
          } else {
            console.log("✅ Supabase: Connection successful and tables exist!");
          }
        } catch (error) {
          console.log(`⚠️ Supabase: Setup check failed - ${error}`);
        }
      };
      
      testConnection();
    }
  }, []);

  // Run one-time data normalization for availability ranges
  useEffect(() => {
    const store = useCoachStore.getState();
    
    // Normalize any existing availability ranges to clean up empty strings
    if (store.availabilityRanges.length > 0) {
      store.normalizeAvailabilityRanges();
    }
    
    // Auto-complete past lessons
    store.autoCompletePastLessons();
    
    // Recalculate student totals to fix any inconsistencies
    store.recalculateStudentTotals();
    
    // In development, check data integrity and log issues
    if (__DEV__) {
      const { studentIssues, lessonIssues } = store.checkDataIntegrity();
      if (studentIssues.length > 0 || lessonIssues.length > 0) {
        console.log('🔍 Data Integrity Issues Found:');
        if (studentIssues.length > 0) {
          console.log('  Student Issues:', studentIssues);
        }
        if (lessonIssues.length > 0) {
          console.log('  Lesson Issues:', lessonIssues);
        }
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
            <TabNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

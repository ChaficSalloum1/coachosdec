/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Supabase API. You may update this service, but you should not need to.

Environment variables required:
- EXPO_PUBLIC_VIBECODE_SUPABASE_URL: Your Supabase project URL
- EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
*/
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Custom storage adapter for React Native using AsyncStorage
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (__DEV__) {
      console.warn(
        "Supabase credentials not found in environment variables. Please add EXPO_PUBLIC_VIBECODE_SUPABASE_URL and EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY"
      );
    }
    throw new Error(
      "Supabase credentials are required. Please add them in the ENV tab."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'coachos-mobile'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10  // Rate limiting for realtime subscriptions
      }
    }
  });

  return supabaseClient;
};

// Helper to reset client (useful for testing or re-authentication)
export const resetSupabaseClient = () => {
  supabaseClient = null;
};


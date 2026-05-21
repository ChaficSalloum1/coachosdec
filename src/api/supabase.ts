/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Supabase API. You may update this service, but you should not need to.

Environment variables required:
- EXPO_PUBLIC_VIBECODE_SUPABASE_URL: Your Supabase project URL
- EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
*/
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// Store Supabase refresh/access tokens in the platform keychain/keystore.
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

const normalizeSupabaseUrl = (url: string) => {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
};

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

  supabaseClient = createClient(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
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

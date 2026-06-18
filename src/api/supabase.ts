/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Supabase API. You may update this service, but you should not need to.

Environment variables required:
- EXPO_PUBLIC_VIBECODE_SUPABASE_URL: Your Supabase project URL
- EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
*/
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isAuthTokenStorageKey = (key: string) => key.endsWith("-auth-token");

const isMalformedAuthSessionValue = (value: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return true;

  try {
    JSON.parse(trimmed);
    return false;
  } catch {
    return true;
  }
};

const secureStoreAvailable = async () => {
  if (Platform.OS === "web") return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

// Store Supabase refresh/access tokens in the platform keychain/keystore.
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const value = await (await secureStoreAvailable()
      ? SecureStore.getItemAsync(key)
      : AsyncStorage.getItem(key));

    if (isAuthTokenStorageKey(key) && isMalformedAuthSessionValue(value)) {
      await SecureStoreAdapter.removeItem(key);
      return null;
    }

    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (await secureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (await secureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key);
  },
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

const normalizeSupabaseUrl = (url: string) => {
  return url.trim().replace(/\/(rest|auth)\/v1\/?$/, "").replace(/\/$/, "");
};

const validateSupabaseConfig = (url: string, key: string) => {
  const normalizedUrl = normalizeSupabaseUrl(url);

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.protocol !== "https:") {
      throw new Error("Supabase URL must start with https://");
    }
    if (!parsed.hostname.includes("supabase.co")) {
      throw new Error("Supabase URL must be your project URL, for example https://project-ref.supabase.co");
    }
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Supabase URL is invalid. Use the project URL, not a REST or auth endpoint."
    );
  }

  if (!key.trim()) {
    throw new Error("Supabase anon/publishable key is missing.");
  }

  if (!key.startsWith("eyJ") && !key.startsWith("sb_publishable_")) {
    throw new Error("Supabase key format is invalid. Use the anon public key or publishable key from Supabase.");
  }

  return normalizedUrl;
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

  const normalizedUrl = validateSupabaseConfig(supabaseUrl, supabaseAnonKey);

  supabaseClient = createClient(normalizedUrl, supabaseAnonKey.trim(), {
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

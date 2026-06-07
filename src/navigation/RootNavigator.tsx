import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';

import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { getSession, onAuthStateChange } from '../services/authService';
import { useCoachStore } from '../state/coachStore';

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('your_supabase') && !key.includes('your_supabase'));
};

const initSubscriptions = async () => {
  try {
    const { initRevenueCat } = await import('../services/revenueCatService');
    initRevenueCat();
  } catch {
    // Subscription features should never block app startup.
  }
};

const identifySubscriptionUser = async (userId: string) => {
  try {
    const { identifyUser } = await import('../services/revenueCatService');
    await identifyUser(userId);
  } catch {
    // Ignore subscription identity failures during auth routing.
  }
};

const resetSubscriptionUser = async () => {
  try {
    const { resetUser } = await import('../services/revenueCatService');
    await resetUser();
  } catch {
    // Ignore subscription identity failures during auth routing.
  }
};

const registerPushToken = async () => {
  try {
    const { registerForPushNotifications } = await import('../services/pushNotificationsService');
    await registerForPushNotifications();
  } catch {
    // Push setup should not affect first paint or auth routing.
  }
};

export function RootNavigator() {
  // undefined = still checking, null = no session, Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const supabaseReady = isSupabaseConfigured();
  const isDemoMode = useCoachStore(s => s.isDemoMode);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;
    const startupTimeout = setTimeout(() => {
      if (mounted) {
        setSession(null);
      }
    }, 3000);

    initSubscriptions();

    if (isDemoMode) {
      setSession(null);
      resetSubscriptionUser();
      clearTimeout(startupTimeout);
      return () => {
        mounted = false;
        clearTimeout(startupTimeout);
      };
    }

    if (!supabaseReady) {
      // No Supabase — skip auth, go straight to the app
      setSession(null);
      clearTimeout(startupTimeout);
      return () => {
        mounted = false;
        clearTimeout(startupTimeout);
      };
    }

    getSession()
      .then(nextSession => {
        if (mounted) {
          setSession(nextSession);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
        }
      })
      .finally(() => {
        clearTimeout(startupTimeout);
      });

    try {
      const authSubscription = onAuthStateChange((_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user) {
          registerPushToken();
          identifySubscriptionUser(newSession.user.id);
        } else {
          resetSubscriptionUser();
        }
      });
      subscription = authSubscription.data.subscription;
    } catch {
      setSession(null);
    }

    return () => {
      mounted = false;
      clearTimeout(startupTimeout);
      subscription?.unsubscribe();
    };
  }, [isDemoMode, supabaseReady]);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color="#1E88E5" size="large" />
      </View>
    );
  }

  // When Supabase is not configured, always show the app (local-only mode)
  const isAuthenticated = isDemoMode || !supabaseReady || session !== null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';

import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { getSession, onAuthStateChange } from '../services/authService';
import { registerForPushNotifications } from '../services/pushNotificationsService';
import { setSentryUser, clearSentryUser } from '../services/sentryService';

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

export function RootNavigator() {
  // undefined = still checking, null = no session, Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      // No Supabase — skip auth, go straight to the app
      setSession(null);
      return;
    }

    getSession().then(setSession);

    const { data: { subscription } } = onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        setSentryUser(newSession.user.id, newSession.user.email ?? undefined);
        registerForPushNotifications().catch(() => {});
      } else {
        clearSentryUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseReady]);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color="#1E88E5" size="large" />
      </View>
    );
  }

  // When Supabase is not configured, always show the app (local-only mode)
  const isAuthenticated = !supabaseReady || session !== null;

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

/**
 * Push notifications service for CoachOS
 *
 * Uses expo-notifications (already installed) to:
 *  - Register the device and get an Expo push token
 *  - Store the token in Supabase so the backend can send notifications
 *  - Handle foreground and background notification events
 *
 * Setup:
 *  1. Add notification permissions to app.json:
 *       "ios": { "infoPlist": { "UIBackgroundModes": ["remote-notification"] } }
 *       "android": { "googleServicesFile": "./google-services.json" }
 *  2. Set your Expo project ID in .env:
 *       EXPO_PUBLIC_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *     (Find it in expo.dev → project settings)
 *  3. On Android, create a Firebase project, download google-services.json,
 *     and set android.googleServicesFile in app.json.
 *
 * Notification categories sent by the backend:
 *  - booking_request  → new booking request from a student
 *  - lesson_reminder  → upcoming lesson in 1 hour
 *  - payment_received → student paid a lesson (future, when Stripe/Revolut active)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSupabaseClient } from '../api/supabase';

const PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ??
  process.env.EXPO_PUBLIC_PROJECT_ID ??
  '';

// Show notifications as banners even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and register for push notifications.
 * Stores the Expo push token against the authenticated coach's profile.
 *
 * Call this once after the coach has signed in.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CoachOS Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PushNotifications] Permission not granted');
    return null;
  }

  if (!PROJECT_ID) {
    console.warn('[PushNotifications] EXPO_PUBLIC_PROJECT_ID not set');
    return null;
  }

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    ).data;

    await saveTokenToSupabase(token);
    return token;
  } catch (e) {
    console.error('[PushNotifications] Failed to get push token', e);
    return null;
  }
}

async function saveTokenToSupabase(token: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('coach_push_tokens')
    .upsert({ user_id: user.id, token, platform: Platform.OS });

  if (error) {
    console.error('[PushNotifications] Failed to save token', error);
  }
}

/**
 * Subscribe to notification events. Returns an object with unsubscribe methods.
 * Call in App.tsx useEffect; call unsubscribe on cleanup.
 *
 * Usage:
 *   const subs = subscribeToNotifications({
 *     onReceived: (n) => console.log('received', n),
 *     onResponse: (r) => router.navigate(r.notification.request.content.data.screen),
 *   });
 *   return () => subs.unsubscribe();
 */
export function subscribeToNotifications(handlers: {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponse?: (response: Notifications.NotificationResponse) => void;
}): { unsubscribe: () => void } {
  const receivedSub = handlers.onReceived
    ? Notifications.addNotificationReceivedListener(handlers.onReceived)
    : null;

  const responseSub = handlers.onResponse
    ? Notifications.addNotificationResponseReceivedListener(handlers.onResponse)
    : null;

  return {
    unsubscribe: () => {
      receivedSub?.remove();
      responseSub?.remove();
    },
  };
}

/** Clear the app badge count (iOS). */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

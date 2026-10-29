/*
Tapping a "New booking request" notification opens the Requests tab, whether
the app was already open or was started by the tap.
*/
import { useEffect } from 'react';

import { openRequestsTab } from '../navigation/navigationRef';

type TapResponse = { notification: { request: { content: { data?: Record<string, unknown> } } } };

const opensRequests = (response: TapResponse | null | undefined) =>
  response?.notification.request.content.data?.screen === 'Requests';

export function useNotificationTaps() {
  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | undefined;

    // Loaded on demand so push setup never slows down the first screen.
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        const launchTap = await Notifications.getLastNotificationResponseAsync();
        if (!cancelled && opensRequests(launchTap)) void openRequestsTab();

        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          if (opensRequests(response)) void openRequestsTab();
        });
        if (cancelled) subscription.remove();
        else remove = () => subscription.remove();
      } catch {
        // Notifications are optional; never block the app over them.
      }
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}

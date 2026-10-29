/*
A handle on the navigator for code that runs outside screens, such as a tap on
a push notification. Opens the Requests tab, waiting briefly if the app is
still starting up (a tap can launch the app cold).
*/
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

const RETRY_MS = 300;
const MAX_TRIES = 20;

// Returns true once the tab was opened, false if the app never became ready
// (for example the coach is signed out).
export function openRequestsTab(
  ref: Pick<typeof navigationRef, 'isReady' | 'navigate'> = navigationRef,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<boolean> {
  const attempt = async (triesLeft: number): Promise<boolean> => {
    if (ref.isReady()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ref.navigate as any)('App', { screen: 'Requests' });
        return true;
      } catch {
        return false;
      }
    }
    if (triesLeft <= 0) return false;
    await wait(RETRY_MS);
    return attempt(triesLeft - 1);
  };
  return attempt(MAX_TRIES);
}

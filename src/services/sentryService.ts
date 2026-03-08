/**
 * Sentry crash reporting service for CoachOS
 *
 * Setup:
 *  1. Create a project at https://sentry.io
 *  2. Add your DSN to .env:
 *       EXPO_PUBLIC_SENTRY_DSN=https://xxxx@oXXX.ingest.sentry.io/YYYY
 *  3. Add the Sentry plugin to app.config.js / app.json:
 *       {
 *         "plugins": [
 *           ["@sentry/react-native/expo", { "organization": "your-org", "project": "coachos" }]
 *         ]
 *       }
 *  4. For source maps on EAS Build, add SENTRY_AUTH_TOKEN to your EAS secrets.
 */

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry(): void {
  if (!DSN) {
    console.warn('[Sentry] DSN not set. Crash reporting disabled.');
    return;
  }

  Sentry.init({
    dsn: DSN,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Capture 20% of sessions for performance tracing in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Capture 10% of sessions for replays in production
    replaysSessionSampleRate: __DEV__ ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

/** Set the currently authenticated coach so errors are attributed. */
export function setSentryUser(userId: string, email?: string): void {
  Sentry.setUser({ id: userId, email });
}

/** Clear user on sign-out. */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/** Manually capture an error with optional context. */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Wrap a component tree with Sentry's error boundary.
 * Usage: export default Sentry.wrap(App)
 */
export const { wrap: withSentry } = Sentry;

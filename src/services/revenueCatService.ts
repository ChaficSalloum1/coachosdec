/**
 * RevenueCat subscription service for CoachOS
 *
 * Handles coach subscription purchases (monthly/annual plans).
 * RevenueCat is the single source of truth for entitlements.
 *
 * Setup:
 *  1. Create a RevenueCat project at https://app.revenuecat.com
 *  2. Add your API keys to .env:
 *       EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxx
 *       EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxx
 *  3. Configure products/entitlements in the RevenueCat dashboard
 *     matching App Store Connect / Google Play Console product IDs.
 *
 * Entitlements defined in RevenueCat dashboard:
 *   - "pro" → CoachOS Pro (full feature access)
 *
 * Product identifiers (set in App Store Connect / Google Play):
 *   - coachos_pro_monthly
 *   - coachos_pro_annual
 */

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const REVENUECAT_ENABLED = process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true';

const PRO_ENTITLEMENT = 'pro';
let isConfigured = false;
let identifiedUserId: string | null = null;

const logRevenueCatIssue = (message: string, error?: unknown) => {
  if (__DEV__) {
    console.warn(message, error ?? '');
  }
};

export function initRevenueCat(userId?: string): void {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

  if (!REVENUECAT_ENABLED) {
    isConfigured = false;
    identifiedUserId = null;
    if (__DEV__) {
      console.log('[RevenueCat] Subscription features disabled.');
    }
    return;
  }

  if (!apiKey) {
    logRevenueCatIssue('[RevenueCat] API key not set. Subscription features disabled.');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
  }

  Purchases.configure({ apiKey });
  isConfigured = true;

  if (userId) {
    Purchases.logIn(userId)
      .then(() => {
        identifiedUserId = userId;
      })
      .catch((e) =>
        logRevenueCatIssue('[RevenueCat] logIn error', e),
      );
  }
}

export function isRevenueCatEnabled(): boolean {
  return REVENUECAT_ENABLED;
}

/** Call after Supabase auth.signIn to link the coach's account. */
export async function identifyUser(userId: string): Promise<void> {
  if (!isConfigured) return;

  try {
    await Purchases.logIn(userId);
    identifiedUserId = userId;
  } catch (e) {
    logRevenueCatIssue('[RevenueCat] identifyUser error', e);
  }
}

/** Call on sign-out to reset to anonymous user. */
export async function resetUser(): Promise<void> {
  if (!isConfigured || !identifiedUserId) return;

  try {
    await Purchases.logOut();
    identifiedUserId = null;
  } catch (e) {
    logRevenueCatIssue('[RevenueCat] resetUser error', e);
  }
}

/** Returns true if the coach has an active Pro entitlement. */
export async function hasProAccess(): Promise<boolean> {
  if (!isConfigured) return false;

  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  } catch (e) {
    logRevenueCatIssue('[RevenueCat] hasProAccess error', e);
    return false;
  }
}

/** Fetch the current offering (packages available for purchase). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isConfigured) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    logRevenueCatIssue('[RevenueCat] getCurrentOffering error', e);
    return null;
  }
}

/**
 * Purchase a package from the current offering.
 * Returns updated CustomerInfo on success, or null on cancellation/error.
 */
export async function purchasePackage(
  pkg: import('react-native-purchases').PurchasesPackage,
): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    if (!err.userCancelled) {
      logRevenueCatIssue('[RevenueCat] purchasePackage error', e);
    }
    return null;
  }
}

/** Restore previously purchased subscriptions. */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;

  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    logRevenueCatIssue('[RevenueCat] restorePurchases error', e);
    return null;
  }
}

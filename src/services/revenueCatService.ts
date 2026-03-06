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

const PRO_ENTITLEMENT = 'pro';

export function initRevenueCat(userId?: string): void {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] API key not set. Subscription features disabled.');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });

  if (userId) {
    Purchases.logIn(userId).catch((e) =>
      console.error('[RevenueCat] logIn error', e),
    );
  }
}

/** Call after Supabase auth.signIn to link the coach's account. */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.error('[RevenueCat] identifyUser error', e);
  }
}

/** Call on sign-out to reset to anonymous user. */
export async function resetUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (e) {
    console.error('[RevenueCat] resetUser error', e);
  }
}

/** Returns true if the coach has an active Pro entitlement. */
export async function hasProAccess(): Promise<boolean> {
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  } catch (e) {
    console.error('[RevenueCat] hasProAccess error', e);
    return false;
  }
}

/** Fetch the current offering (packages available for purchase). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('[RevenueCat] getCurrentOffering error', e);
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
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    if (!err.userCancelled) {
      console.error('[RevenueCat] purchasePackage error', e);
    }
    return null;
  }
}

/** Restore previously purchased subscriptions. */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.error('[RevenueCat] restorePurchases error', e);
    return null;
  }
}

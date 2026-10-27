import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import {
  type PurchasesPackage,
  type PurchasesOffering,
  PACKAGE_TYPE,
} from 'react-native-purchases';

import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
} from '../services/revenueCatService';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

const NAVY = DesignTokens.colors.text.strong;
const GOLD = DesignTokens.colors.gold;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; labelKey: 'featureStudents' | 'featureCalendar' | 'featureLocations' | 'featureBookingLink' | 'featureExport' }[] = [
  { icon: 'people',           labelKey: 'featureStudents' },
  { icon: 'calendar',         labelKey: 'featureCalendar' },
  { icon: 'location',         labelKey: 'featureLocations' },
  { icon: 'link',             labelKey: 'featureBookingLink' },
  { icon: 'download-outline', labelKey: 'featureExport' },
];

interface TierConfig {
  pkg: PurchasesPackage;
  label: string;
  period: string;
  badge?: string;
  badgeColor: string;
  isRecommended: boolean;
}

function buildTiers(offering: PurchasesOffering): TierConfig[] {
  const tiers: TierConfig[] = [];

  const annualSavings =
    offering.monthly && offering.annual
      ? Math.round(
          (1 - offering.annual.product.price / (offering.monthly.product.price * 12)) * 100,
        )
      : null;

  if (offering.weekly) {
    tiers.push({
      pkg: offering.weekly,
      label: t('paywall.weekly'),
      period: t('paywall.perWeek'),
      badge: undefined,
      badgeColor: '',
      isRecommended: false,
    });
  }

  if (offering.monthly) {
    tiers.push({
      pkg: offering.monthly,
      label: t('paywall.monthly'),
      period: t('paywall.perMonth'),
      badge: t('paywall.mostPopular'),
      badgeColor: DesignTokens.colors.accent,
      isRecommended: true,
    });
  }

  if (offering.annual) {
    tiers.push({
      pkg: offering.annual,
      label: t('paywall.annual'),
      period: t('paywall.perYear'),
      badge: annualSavings !== null && annualSavings > 0 ? t('paywall.save', { percent: annualSavings }) : t('paywall.bestValue'),
      badgeColor: DesignTokens.colors.success,
      isRecommended: false,
    });
  }

  // Fallback: use availablePackages if none of the convenience properties matched
  if (tiers.length === 0) {
    offering.availablePackages.forEach((pkg) => {
      tiers.push({
        pkg,
        label: labelForPackageType(pkg.packageType),
        period: periodForPackageType(pkg.packageType),
        badge: undefined,
        badgeColor: '',
        isRecommended: false,
      });
    });
  }

  return tiers;
}

function labelForPackageType(type: PACKAGE_TYPE): string {
  switch (type) {
    case PACKAGE_TYPE.WEEKLY:   return t('paywall.weekly');
    case PACKAGE_TYPE.MONTHLY:  return t('paywall.monthly');
    case PACKAGE_TYPE.ANNUAL:   return t('paywall.annual');
    default:                    return t('paywall.subscription');
  }
}

function periodForPackageType(type: PACKAGE_TYPE): string {
  switch (type) {
    case PACKAGE_TYPE.WEEKLY:  return t('paywall.perWeek');
    case PACKAGE_TYPE.MONTHLY: return t('paywall.perMonth');
    case PACKAGE_TYPE.ANNUAL:  return t('paywall.perYear');
    default:                   return '';
  }
}

export function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    getCurrentOffering()
      .then((o) => {
        if (!o) return;
        setOffering(o);
        const built = buildTiers(o);
        setTiers(built);
        // Default to monthly if available, otherwise first tier
        const recommended = built.find((t) => t.isRecommended) ?? built[0];
        if (recommended) setSelectedPkg(recommended.pkg);
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!selectedPkg) return;
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await purchasePackage(selectedPkg);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('paywall.welcomeTitle'), t('paywall.welcomeBody'), [
          { text: t('paywall.letsGo'), onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert(t('paywall.purchaseFailed'), t('paywall.purchaseFailedBody'));
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPkg, navigation]);

  const handleRestore = useCallback(async () => {
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await restorePurchases();
      if (result && Object.keys(result.entitlements.active).length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('paywall.restoredTitle'), t('paywall.restoredBody'), [
          { text: t('paywall.continue'), onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('paywall.nothingToRestore'), t('paywall.nothingToRestoreBody'));
      }
    } catch {
      Alert.alert(t('paywall.restoreFailed'), t('paywall.restoreFailedBody'));
    } finally {
      setIsPurchasing(false);
    }
  }, [navigation]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={DesignTokens.colors.overlay.whiteSoft} />
          </Pressable>

          <Ionicons name="star" size={40} color={GOLD} style={styles.crownIcon} />

          <Text style={styles.headerTitle}>{t('paywall.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('paywall.subtitle')}
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map(({ icon, labelKey }) => (
              <FeatureRow key={labelKey} icon={icon} label={t(`paywall.${labelKey}`)} />
            ))}
          </View>
        </View>

        {/* ── Plan selection ── */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>{t('paywall.choosePlan')}</Text>

          {isFetching ? (
            <View style={styles.fetchingContainer}>
              <ActivityIndicator color={DesignTokens.colors.accent} size="large" />
              <Text style={styles.fetchingText}>{t('paywall.loadingPlans')}</Text>
            </View>
          ) : tiers.length === 0 ? (
            <View style={styles.fetchingContainer}>
              <Text style={styles.fetchingText}>{t('paywall.noPlans')}</Text>
            </View>
          ) : (
            <View style={styles.tierList}>
              {tiers.map((tier, index) => (
                <AnimatedTierCard
                  key={tier.pkg.identifier}
                  tier={tier}
                  index={index}
                  selected={selectedPkg?.identifier === tier.pkg.identifier}
                  onSelect={() => {
                    setSelectedPkg(tier.pkg);
                    Haptics.selectionAsync();
                  }}
                />
              ))}
            </View>
          )}

          {/* ── CTA ── */}
          <Pressable
            onPress={handlePurchase}
            disabled={!selectedPkg || isPurchasing || isFetching}
            style={({ pressed }) => [
              styles.ctaButton,
              (pressed || isPurchasing) && styles.ctaButtonPressed,
              (!selectedPkg || isFetching) && styles.ctaButtonDisabled,
            ]}
          >
            <Text style={styles.ctaText}>{t('paywall.start')}</Text>
          </Pressable>

          <Pressable
            onPress={handleRestore}
            disabled={isPurchasing}
            style={styles.restoreButton}
          >
            <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
          </Pressable>

          <Text style={styles.legal}>
            {t('paywall.autoRenew')}
          </Text>
        </View>
      </ScrollView>

      {/* ── Purchase loading overlay ── */}
      {isPurchasing && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator color={DesignTokens.colors.accent} size="large" />
            <Text style={styles.overlayText}>{t('paywall.processing')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={16} color={NAVY} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

// ── Animated tier card ────────────────────────────────────────────────────────

interface AnimatedTierCardProps {
  tier: TierConfig;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

function AnimatedTierCard({ tier, index, selected, onSelect }: AnimatedTierCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 280 }));
    translateY.value = withDelay(index * 80, withSpring(0, DesignTokens.animations.spring));
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, DesignTokens.animations.cardPress);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, DesignTokens.animations.cardPress);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const annualEquivalent =
    tier.pkg.packageType === PACKAGE_TYPE.ANNUAL && tier.pkg.product.pricePerMonthString
      ? `${tier.pkg.product.pricePerMonthString} / mo`
      : null;

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tierCard, selected && styles.tierCardSelected]}
      >
        {/* Badge */}
        {tier.badge && (
          <View style={[styles.tierBadge, { backgroundColor: tier.badgeColor }]}>
            <Text style={styles.tierBadgeText}>{tier.badge}</Text>
          </View>
        )}

        <View style={styles.tierCardInner}>
          {/* Selection ring */}
          <View style={[styles.tierRadio, selected && styles.tierRadioSelected]}>
            {selected && <View style={styles.tierRadioDot} />}
          </View>

          {/* Labels */}
          <View style={styles.tierInfo}>
            <Text style={[styles.tierLabel, selected && styles.tierLabelSelected]}>
              {tier.label}
            </Text>
            {annualEquivalent && (
              <Text style={styles.tierSubLabel}>{annualEquivalent}</Text>
            )}
          </View>

          {/* Price */}
          <View style={styles.tierPriceBlock}>
            <Text style={[styles.tierPrice, selected && styles.tierPriceSelected]}>
              {tier.pkg.product.priceString}
            </Text>
            <Text style={styles.tierPeriod}>{tier.period}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DesignTokens.colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.overlay.whiteFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DesignTokens.colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: DesignTokens.colors.overlay.whiteMid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: DesignTokens.colors.white,
    flex: 1,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignTokens.colors.grey,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  fetchingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  fetchingText: {
    fontSize: 15,
    color: DesignTokens.colors.grey,
  },
  tierList: {
    gap: 12,
    marginBottom: 28,
  },

  // Tier card
  tierCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DesignTokens.colors.line.hairline,
    backgroundColor: DesignTokens.colors.surface.paywall,
    overflow: 'hidden',
    ...DesignTokens.shadows.sm,
  },
  tierCardSelected: {
    borderColor: DesignTokens.colors.accent,
    backgroundColor: DesignTokens.colors.brand.tintPaywall,
    ...DesignTokens.shadows.default,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignTokens.colors.white,
    letterSpacing: 0.3,
  },
  tierCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  tierRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: DesignTokens.colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRadioSelected: {
    borderColor: DesignTokens.colors.accent,
  },
  tierRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DesignTokens.colors.accent,
  },
  tierInfo: {
    flex: 1,
    gap: 2,
  },
  tierLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: DesignTokens.colors.graphite,
  },
  tierLabelSelected: {
    color: DesignTokens.colors.accent,
  },
  tierSubLabel: {
    fontSize: 12,
    color: DesignTokens.colors.grey,
  },
  tierPriceBlock: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignTokens.colors.graphite,
  },
  tierPriceSelected: {
    color: DesignTokens.colors.accent,
  },
  tierPeriod: {
    fontSize: 12,
    color: DesignTokens.colors.grey,
    marginTop: 1,
  },

  // CTA
  ctaButton: {
    backgroundColor: DesignTokens.colors.accent,
    borderRadius: DesignTokens.radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 52,
    ...DesignTokens.shadows.md,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: DesignTokens.colors.white,
    letterSpacing: 0.2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 15,
    color: DesignTokens.colors.accent,
    fontWeight: '500',
  },
  legal: {
    fontSize: 12,
    color: DesignTokens.colors.grey,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Loading overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignTokens.colors.overlay.scrimInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
    ...DesignTokens.shadows.lg,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignTokens.colors.graphite,
  },
});

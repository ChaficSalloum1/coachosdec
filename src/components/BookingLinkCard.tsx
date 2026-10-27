import React from 'react';
import { View, Text, Pressable, Share, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Coach } from '../types/coach';
import { UI_TIMING } from '../config/appSettings';
import { buildBookingUrl } from '../utils/publicBooking';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

interface BookingLinkCardProps {
  coach: Coach;
}

export function BookingLinkCard({ coach }: BookingLinkCardProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const bookingUrl = buildBookingUrl(coach.bookingLink, process.env.EXPO_PUBLIC_BOOKING_BASE_URL);

  const shareBookingLink = async () => {
    if (!bookingUrl) return;
    try {
      await Share.share({
        message: t('booking.shareMessage', { name: coach.name, url: bookingUrl }),
        url: bookingUrl,
      });
    } catch {
      // User cancelled
    }
  };

  const copyBookingLink = async () => {
    if (!bookingUrl) return;
    await Clipboard.setStringAsync(bookingUrl);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), UI_TIMING.copiedFlashMs);
  };

  // The page is not hosted yet: say so rather than handing out a dead link.
  if (!bookingUrl) {
    return (
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
          {t('booking.notLive')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-sm mb-1" style={{ color: DesignTokens.colors.text.muted }}>
          {t('booking.shareThisLink')}
        </Text>
        <Text className="text-sm font-medium mb-4" numberOfLines={1} style={{ color: DesignTokens.colors.brand.default }}>
          {bookingUrl}
        </Text>

        {/* QR code (tap to expand) + action buttons */}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <Pressable
            onPress={() => setShowQR(true)}
            style={{
              width: 72,
              height: 72,
              backgroundColor: DesignTokens.colors.white,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: DesignTokens.colors.line.default,
            }}
          >
            <QRCode value={bookingUrl} size={60} />
          </Pressable>

          <View style={{ flex: 1, gap: 8 }}>
            <Pressable
              onPress={shareBookingLink}
              className="flex-row items-center justify-center rounded-lg py-3 active:opacity-80"
              style={{ backgroundColor: DesignTokens.colors.brand.default }}
            >
              <Ionicons name="share-outline" size={16} color="white" />
              <Text className="text-sm font-semibold text-white ml-2">{t('booking.shareLink')}</Text>
            </Pressable>

            <Pressable
              onPress={copyBookingLink}
              className="flex-row items-center justify-center rounded-lg py-3 active:bg-gray-200"
              style={{ backgroundColor: DesignTokens.colors.surface.muted }}
            >
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={16}
                color={copied ? DesignTokens.colors.green.strong : DesignTokens.colors.text.strong}
              />
              <Text className="text-sm font-medium ml-2" style={{ color: copied ? DesignTokens.colors.green.strong : DesignTokens.colors.text.strong }}>
                {copied ? t('booking.copied') : t('booking.copyLink')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Preview button */}
        <Pressable
          onPress={() => (navigation as any).navigate('PublicBooking')}
          className="mt-3 flex-row items-center justify-center rounded-lg py-3 active:bg-blue-100"
          style={{ backgroundColor: DesignTokens.colors.brand.tint }}
        >
          <Ionicons name="eye-outline" size={16} color={DesignTokens.colors.brand.default} />
          <Text className="text-sm font-medium ml-2" style={{ color: DesignTokens.colors.brand.default }}>
            {t('booking.previewPage')}
          </Text>
        </Pressable>
      </View>

      {/* Full-screen QR modal */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: DesignTokens.colors.overlay.scrimHeavy, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setShowQR(false)}
        >
          <View style={{
            backgroundColor: DesignTokens.colors.white,
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            marginHorizontal: 32,
            paddingBottom: Math.max(insets.bottom + 32, 32),
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: DesignTokens.colors.text.strong, marginBottom: 4 }}>
              {coach.name}
            </Text>
            <Text style={{ fontSize: 13, color: DesignTokens.colors.text.muted, marginBottom: 24, textAlign: 'center' }}>
              {t('booking.scanToBook')}
            </Text>
            <QRCode value={bookingUrl} size={220} />
            <Text style={{ fontSize: 12, color: DesignTokens.colors.text.faint, marginTop: 20, textAlign: 'center' }}>
              {t('booking.tapToClose')}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

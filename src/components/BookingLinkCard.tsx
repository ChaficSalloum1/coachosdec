import React from 'react';
import { View, Text, Pressable, Share, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Coach } from '../types/coach';

interface BookingLinkCardProps {
  coach: Coach;
}

export function BookingLinkCard({ coach }: BookingLinkCardProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const bookingUrl = `https://coachos.app/book/${coach.bookingLink}`;

  const shareBookingLink = async () => {
    try {
      await Share.share({
        message: `Book a lesson with ${coach.name}: ${bookingUrl}`,
        url: bookingUrl,
      });
    } catch {
      // User cancelled
    }
  };

  const copyBookingLink = async () => {
    await Clipboard.setStringAsync(bookingUrl);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-sm mb-1" style={{ color: '#42526E' }}>
          Share this link with students so they can book lessons with you:
        </Text>
        <Text className="text-sm font-medium mb-4" numberOfLines={1} style={{ color: '#1E88E5' }}>
          {bookingUrl}
        </Text>

        {/* QR code (tap to expand) + action buttons */}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <Pressable
            onPress={() => setShowQR(true)}
            style={{
              width: 72,
              height: 72,
              backgroundColor: '#FFFFFF',
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          >
            <QRCode value={bookingUrl} size={60} />
          </Pressable>

          <View style={{ flex: 1, gap: 8 }}>
            <Pressable
              onPress={shareBookingLink}
              className="flex-row items-center justify-center rounded-lg py-3 active:opacity-80"
              style={{ backgroundColor: '#1E88E5' }}
            >
              <Ionicons name="share-outline" size={16} color="white" />
              <Text className="text-sm font-semibold text-white ml-2">Share Link</Text>
            </Pressable>

            <Pressable
              onPress={copyBookingLink}
              className="flex-row items-center justify-center rounded-lg py-3 active:bg-gray-200"
              style={{ backgroundColor: '#F0F0F0' }}
            >
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={16}
                color={copied ? '#2E7D32' : '#0B1220'}
              />
              <Text className="text-sm font-medium ml-2" style={{ color: copied ? '#2E7D32' : '#0B1220' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Preview button */}
        <Pressable
          onPress={() => (navigation as any).navigate('PublicBooking')}
          className="mt-3 flex-row items-center justify-center rounded-lg py-3 active:bg-blue-100"
          style={{ backgroundColor: '#EBF3FF' }}
        >
          <Ionicons name="eye-outline" size={16} color="#1E88E5" />
          <Text className="text-sm font-medium ml-2" style={{ color: '#1E88E5' }}>
            Preview student booking page
          </Text>
        </Pressable>
      </View>

      {/* Full-screen QR modal */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setShowQR(false)}
        >
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            marginHorizontal: 32,
            paddingBottom: Math.max(insets.bottom + 32, 32),
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0B1220', marginBottom: 4 }}>
              {coach.name}
            </Text>
            <Text style={{ fontSize: 13, color: '#42526E', marginBottom: 24, textAlign: 'center' }}>
              Students scan this to book a lesson
            </Text>
            <QRCode value={bookingUrl} size={220} />
            <Text style={{ fontSize: 12, color: '#9BA3AF', marginTop: 20, textAlign: 'center' }}>
              Tap anywhere to close
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';

import { Coach } from '../types/coach';

interface BookingLinkCardProps {
  coach: Coach;
}

export function BookingLinkCard({ coach }: BookingLinkCardProps) {
  const navigation = useNavigation();

  const shareBookingLink = async () => {
    const bookingUrl = `https://coachos.app/book/${coach.bookingLink}`;
    try {
      await Share.share({
        message: `Book a lesson with me: ${bookingUrl}`,
        url: bookingUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyBookingLink = async () => {
    const bookingUrl = `https://coachos.app/book/${coach.bookingLink}`;
    await Clipboard.setStringAsync(bookingUrl);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const previewBookingLink = () => {
    (navigation as any).navigate('PublicBookingPreview', { slug: coach.bookingLink });
  };



  const url = `https://coachos.app/book/${coach.bookingLink}`;
  return (
    <View className="bg-gray-50 rounded-xl p-4">
      <Text className="text-sm mb-2" style={{ color: '#42526E' }}>
        Share this link with students to book lessons:
      </Text>
      <Text className="text-base font-medium mb-4" style={{ color: '#0B1220' }}>
        https://coachos.app/book/{coach.bookingLink}
      </Text>
      <View className="flex-row items-center space-x-3">
        <Pressable
          onPress={previewBookingLink}
          className="flex-1 rounded-lg py-3 px-4 active:opacity-80"
          style={{ backgroundColor: '#1E88E5' }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="eye-outline" size={16} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              Preview
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={copyBookingLink}
          className="flex-1 bg-gray-200 rounded-lg py-3 px-4 active:bg-gray-300"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="copy-outline" size={16} color="#0B1220" />
            <Text className="text-base font-medium ml-2" style={{ color: '#0B1220' }}>
              Copy
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={shareBookingLink}
          className="bg-gray-200 rounded-lg py-3 px-4 active:bg-gray-300"
        >
          <Ionicons name="share-outline" size={20} color="#0B1220" />
        </Pressable>
        <View style={{ width: 44, height: 44, backgroundColor: 'white', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <QRCode value={url} size={40} />
        </View>
      </View>
    </View>
  );
}
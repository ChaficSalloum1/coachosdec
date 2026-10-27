import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UI_TIMING } from '../config/appSettings';
import { ToastMessage, useToastStore } from '../state/toastStore';

// Matches the bottom tab bar height in TabNavigator (60 + safe area).
const TAB_BAR_HEIGHT = 60;

const BACKGROUND: Record<ToastMessage['type'], string> = {
  info: '#0B1220',
  success: '#1F7A3A',
  error: '#C62828',
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);
  const [shown, setShown] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setShown(null)
      );
      return;
    }

    setShown(toast);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => dismiss(toast.id), UI_TIMING.toastVisibleMs);
    return () => clearTimeout(timer);
  }, [toast, dismiss, opacity]);

  if (!shown) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: TAB_BAR_HEIGHT + insets.bottom + 12,
        alignItems: 'center',
      }}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          opacity,
          backgroundColor: BACKGROUND[shown.type],
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          maxWidth: 520,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
          {shown.message}
        </Text>
      </Animated.View>
    </View>
  );
}

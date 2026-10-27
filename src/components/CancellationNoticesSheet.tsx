import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonAvatar } from './LessonAvatar';
import type { CancellationNotice } from '../utils/cancellationMessage';
import { DesignTokens } from '../utils/designTokens';

interface CancellationNoticesSheetProps {
  notices: CancellationNotice[] | null; // null = closed
  onClose: () => void;
}

// After cancelling a whole day: one tap per student opens their messaging app
// with the message already written. Texts cannot be sent in bulk, so each
// student is a row that turns to "Sent" once tapped.
export function CancellationNoticesSheet({ notices, onClose }: CancellationNoticesSheetProps) {
  const insets = useSafeAreaInsets();
  const [sent, setSent] = useState<string[]>([]);

  useEffect(() => {
    setSent([]);
  }, [notices]);

  if (!notices) return null;

  const send = (notice: CancellationNotice) => {
    if (!notice.url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(notice.url).catch(() => {});
    setSent((prev) => (prev.includes(notice.studentId) ? prev : [...prev, notice.studentId]));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...DesignTokens.typography.title3, color: DesignTokens.colors.graphite }}>
              Lessons cancelled
            </Text>
            <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}>
              Tap a name to message them.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Done"
            style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text style={{ ...DesignTokens.typography.body, fontWeight: '600', color: DesignTokens.colors.accent }}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
          {notices.map((notice) => {
            const done = sent.includes(notice.studentId);
            return (
              <Pressable
                key={notice.studentId}
                onPress={() => send(notice)}
                disabled={!notice.url}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 64,
                  borderBottomWidth: 1,
                  borderBottomColor: DesignTokens.colors.superLightGrey,
                }}
              >
                <LessonAvatar name={notice.studentName} size={40} />
                <Text
                  style={{ flex: 1, marginLeft: 12, ...DesignTokens.typography.callout, fontWeight: '600', color: DesignTokens.colors.graphite }}
                  numberOfLines={1}
                >
                  {notice.studentName}
                </Text>
                {notice.url ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'chatbubble-ellipses-outline'}
                      size={20}
                      color={done ? DesignTokens.colors.success : DesignTokens.colors.accent}
                    />
                    <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: done ? DesignTokens.colors.success : DesignTokens.colors.accent }}>
                      {done ? 'Sent' : 'Message'}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey }}>No contact</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

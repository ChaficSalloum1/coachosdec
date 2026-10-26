import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonAvatar } from './LessonAvatar';
import { PaymentStatusBadge } from './payments/PaymentStatusBadge';
import { normalizePaymentStatus } from '../modules/payments';
import { useCoachStore } from '../state/coachStore';
import { showToast } from '../state/toastStore';
import { DesignTokens } from '../utils/designTokens';
import { summarizeGroup } from '../utils/groupLessons';
import { useCurrency } from '../hooks/useCurrency';

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

interface GroupLessonSheetProps {
  groupId: string | null;
  onClose: () => void;
}

export function GroupLessonSheet({ groupId, onClose }: GroupLessonSheetProps) {
  const insets = useSafeAreaInsets();
  const {
    lessons,
    students,
    formatLocationText,
    markLessonPaid,
    addToGroupLesson,
    removeFromGroupLesson,
    cancelGroupLesson,
  } = useCoachStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const { formatMoney } = useCurrency();

  const group = groupId ? summarizeGroup(lessons, groupId) : null;

  useEffect(() => {
    setShowAddPlayer(false);
  }, [groupId]);

  // Everyone cancelled (or the group vanished): nothing left to show.
  useEffect(() => {
    if (groupId && !group) onClose();
  }, [groupId, group, onClose]);

  if (!groupId || !group) return null;

  const inGroup = new Set(group.lessons.map((l) => l.studentId));
  const addable = students.filter((s) => !inGroup.has(s.id));
  const locationText = formatLocationText(group.areaId, group.facilityId, group.courtId);

  const handleAdd = (studentId: string) => {
    try {
      addToGroupLesson(group.groupId, studentId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddPlayer(false);
    } catch (e) {
      showToast(errorMessage(e), 'error');
    }
  };

  const confirmRemove = (studentId: string, name: string) => {
    Alert.alert('Remove player?', `Remove ${name} from this group? Their lesson is cancelled.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFromGroupLesson(group.groupId, studentId).catch((e) =>
            showToast(errorMessage(e), 'error')
          );
        },
      },
    ]);
  };

  const confirmCancelGroup = () => {
    Alert.alert(
      'Cancel whole group?',
      `This cancels the lessons of all ${group.lessons.length} players.`,
      [
        { text: 'Keep group', style: 'cancel' },
        {
          text: 'Cancel group',
          style: 'destructive',
          onPress: () => {
            cancelGroupLesson(group.groupId)
              .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
              .catch((e) => showToast(errorMessage(e), 'error'));
          },
        },
      ]
    );
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
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: DesignTokens.colors.superLightGrey,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...DesignTokens.typography.title3, color: DesignTokens.colors.graphite }}>
              Group lesson
            </Text>
            <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}>
              {group.date} • {formatTime(group.startTime)} – {formatTime(group.endTime)}
              {locationText ? ` • ${locationText}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={DesignTokens.colors.graphite} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
          <Text style={{ ...DesignTokens.typography.subhead, color: DesignTokens.colors.grey, marginBottom: 12 }}>
            {group.lessons.length}/{group.capacity} players • {formatMoney(group.pricePerPlayer)} each
          </Text>

          {group.lessons.map((lesson) => (
            <View
              key={lesson.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: DesignTokens.colors.superLightGrey,
              }}
            >
              <LessonAvatar name={lesson.studentName} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ ...DesignTokens.typography.callout, fontWeight: '600', color: DesignTokens.colors.graphite }}>
                  {lesson.studentName}
                </Text>
                <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                  <PaymentStatusBadge
                    status={normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid)}
                    isPaid={lesson.isPaid}
                  />
                </View>
              </View>
              {!lesson.isPaid && (
                <Pressable
                  onPress={() => {
                    markLessonPaid(lesson.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                  }}
                  accessibilityLabel={`Mark ${lesson.studentName} as paid`}
                >
                  <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.accent }}>
                    Mark paid
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => confirmRemove(lesson.studentId, lesson.studentName)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel={`Remove ${lesson.studentName}`}
              >
                <Ionicons name="person-remove-outline" size={20} color={DesignTokens.colors.grey} />
              </Pressable>
            </View>
          ))}

          {!group.isFull && (
            <View style={{ marginTop: 20 }}>
              <Pressable
                onPress={() => setShowAddPlayer((v) => !v)}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: DesignTokens.colors.superLightGrey,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={DesignTokens.colors.graphite} />
                <Text style={{ ...DesignTokens.typography.body, fontWeight: '600', color: DesignTokens.colors.graphite }}>
                  Add player ({group.spotsLeft} {group.spotsLeft === 1 ? 'spot' : 'spots'} left)
                </Text>
              </Pressable>

              {showAddPlayer && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {addable.length === 0 ? (
                    <Text style={{ ...DesignTokens.typography.subhead, color: DesignTokens.colors.grey }}>
                      All your students are already in this group.
                    </Text>
                  ) : (
                    addable.slice(0, 40).map((student) => (
                      <Pressable
                        key={student.id}
                        onPress={() => handleAdd(student.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          minHeight: 44,
                          justifyContent: 'center',
                          borderRadius: DesignTokens.radius.full,
                          backgroundColor: DesignTokens.colors.superLightGrey,
                        }}
                      >
                        <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '500', color: DesignTokens.colors.graphite }}>
                          {student.name}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

          <Pressable
            onPress={confirmCancelGroup}
            style={{ marginTop: 32, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ ...DesignTokens.typography.body, fontWeight: '600', color: DesignTokens.colors.danger }}>
              Cancel whole group
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonAvatar } from './LessonAvatar';
import { LessonPaymentSheet } from './payments/LessonPaymentSheet';
import { PaymentStatusBadge } from './payments/PaymentStatusBadge';
import { normalizePaymentStatus } from '../modules/payments';
import { useCoachStore } from '../state/coachStore';
import { showToast } from '../state/toastStore';
import { DesignTokens } from '../utils/designTokens';
import { summarizeGroup } from '../utils/groupLessons';
import { laterSeriesCount } from '../utils/lessonSeries';
import { useCurrency } from '../hooks/useCurrency';
import { formatClockTime } from '../utils/timeFormat';
import { t } from '../i18n';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : t('common.somethingWentWrong'));

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
    addToGroupLesson,
    removeFromGroupLesson,
    cancelGroupLesson,
    cancelSeriesFrom,
    markLessonPaid,
  } = useCoachStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [paymentLessonId, setPaymentLessonId] = useState<string | null>(null);
  const { formatMoney } = useCurrency();

  const group = groupId ? summarizeGroup(lessons, groupId) : null;

  useEffect(() => {
    setShowAddPlayer(false);
    setPaymentLessonId(null);
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
    Alert.alert(t('groupLesson.removePlayerTitle'), t('groupLesson.removePlayerBody', { name }), [
      { text: t('common.keep'), style: 'cancel' },
      {
        text: t('common.remove'),
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
    const later = laterSeriesCount(lessons, group.lessons[0]);
    const cancelThisSession = () => {
      cancelGroupLesson(group.groupId)
        .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
        .catch((e) => showToast(errorMessage(e), 'error'));
    };
    const cancelAllLater = () => {
      cancelSeriesFrom(group.lessons[0].id)
        .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
        .catch((e) => showToast(errorMessage(e), 'error'));
    };

    Alert.alert(
      t('groupLesson.cancelWholeTitle'),
      t('groupLesson.cancelWholeBody', { count: group.lessons.length }),
      [
        { text: t('groupLesson.keepGroup'), style: 'cancel' },
        ...(later > 0
          ? [{ text: t('today.cancelThisAndLater', { later }), style: 'destructive' as const, onPress: cancelAllLater }]
          : []),
        { text: later > 0 ? t('today.justThisOne') : t('groupLesson.cancelGroup'), style: 'destructive', onPress: cancelThisSession },
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
              {t('groupLesson.title')}
            </Text>
            <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}>
              {group.date} • {formatClockTime(group.startTime)} – {formatClockTime(group.endTime)}
              {locationText ? ` • ${locationText}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={24} color={DesignTokens.colors.graphite} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
          <Text style={{ ...DesignTokens.typography.subhead, color: DesignTokens.colors.grey, marginBottom: 12 }}>
            {t('groupLesson.playersEach', { count: group.lessons.length, capacity: group.capacity, price: formatMoney(group.pricePerPlayer) })}
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
                  accessibilityLabel={t('groupLesson.markPlayerPaid', { name: lesson.studentName })}
                >
                  <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.accent }}>
                    {t('groupLesson.markPaid')}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setPaymentLessonId(lesson.id)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel={t('groupLesson.paymentRequestFor', { name: lesson.studentName })}
              >
                <Ionicons name="card-outline" size={20} color={DesignTokens.colors.grey} />
              </Pressable>
              <Pressable
                onPress={() => confirmRemove(lesson.studentId, lesson.studentName)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel={t('groupLesson.removePlayer', { name: lesson.studentName })}
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
                  {t('groupLesson.addPlayer', { count: group.spotsLeft })}
                </Text>
              </Pressable>

              {showAddPlayer && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {addable.length === 0 ? (
                    <Text style={{ ...DesignTokens.typography.subhead, color: DesignTokens.colors.grey }}>
                      {t('groupLesson.allAlreadyIn')}
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
              {t('groupLesson.cancelWhole')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
      <LessonPaymentSheet lessonId={paymentLessonId} onClose={() => setPaymentLessonId(null)} />
    </Modal>
  );
}

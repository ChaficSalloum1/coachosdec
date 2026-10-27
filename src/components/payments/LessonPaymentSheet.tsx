import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PaymentRequestPanel } from './PaymentRequestPanel';
import {
  buildPaymentReminderMessage,
  buildPaymentRequestMessage,
  canSendPaymentReminder,
  createInstructionFromSettings,
  eurosToCents,
  generatePaymentReferenceCode,
  normalizePaymentSettings,
  normalizePaymentStatus,
} from '../../modules/payments';
import { useCoachStore } from '../../state/coachStore';
import { DesignTokens } from '../../utils/designTokens';
import { formatTime12Hour } from '../../utils/timeFormat';

interface LessonPaymentSheetProps {
  lessonId: string | null; // null = closed
  onClose: () => void;
}

// Payment request / reminder / mark-paid for one lesson. Used from a single
// lesson card and from each player of a group lesson.
export function LessonPaymentSheet({ lessonId, onClose }: LessonPaymentSheetProps) {
  const {
    coach,
    lessons,
    requestLessonPayment,
    sendLessonPaymentReminder,
    cancelLessonPayment,
    markLessonPaid,
  } = useCoachStore();

  const lesson = lessonId ? lessons.find((l) => l.id === lessonId) : undefined;
  if (!lesson) return null;

  const paymentSettings = normalizePaymentSettings(coach?.paymentSettings);
  const paymentStatus = normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid);
  const reference =
    lesson.paymentReferenceCode ?? (coach ? generatePaymentReferenceCode(coach.name, lesson.id) : lesson.id);
  const instruction = createInstructionFromSettings({
    settings: paymentSettings,
    method: lesson.paymentMethodRequested ?? paymentSettings.paymentPreference,
    amountCents: eurosToCents(lesson.price),
    reference,
  });
  const requestMessage = buildPaymentRequestMessage({
    coachName: coach?.name ?? 'your coach',
    clientName: lesson.studentName,
    sessionTitle: 'lesson',
    startsAt: `${lesson.date} at ${formatTime12Hour(lesson.startTime)}`,
    amountCents: eurosToCents(lesson.price),
    currency: paymentSettings.currency,
    paymentInstructions: instruction.displayText,
    cancellationPolicy: paymentSettings.cancellationPolicy,
  });
  const reminderMessage = buildPaymentReminderMessage({
    clientName: lesson.studentName,
    sessionTitle: 'lesson',
    amountCents: eurosToCents(lesson.price),
    currency: paymentSettings.currency,
    paymentInstructions: instruction.displayText,
  });

  const done = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: DesignTokens.colors.white }}>
        <View style={{ padding: 20, paddingTop: 24, gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ ...DesignTokens.typography.title2, color: DesignTokens.colors.graphite }}>Payment</Text>
              <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}>
                {lesson.studentName} • {formatTime12Hour(lesson.startTime)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={24} color={DesignTokens.colors.graphite} />
            </Pressable>
          </View>

          <PaymentRequestPanel
            instruction={instruction}
            message={paymentStatus === 'REMINDER_SENT' ? reminderMessage : requestMessage}
            canSendReminder={canSendPaymentReminder(paymentStatus)}
            onRequestPayment={() => {
              requestLessonPayment(lesson.id);
              done();
            }}
            onSendReminder={() => {
              sendLessonPaymentReminder(lesson.id);
              done();
            }}
            onMarkPaid={() => {
              markLessonPaid(lesson.id);
              onClose();
              done();
            }}
            onCancelPayment={() => {
              cancelLessonPayment(lesson.id);
              onClose();
              done();
            }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

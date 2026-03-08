import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useCoachStore } from '../state/coachStore';
import { Lesson } from '../types/coach';
import { DesignTokens } from '../utils/designTokens';

interface QuickNoteSheetProps {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export function QuickNoteSheet({ visible, lesson, onClose }: QuickNoteSheetProps) {
  const insets = useSafeAreaInsets();
  const addStudentNote = useCoachStore(s => s.addStudentNote);
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!lesson || !text.trim()) return;
    addStudentNote({
      studentId: lesson.studentId,
      coachId: lesson.coachId,
      content: text.trim(),
      lessonId: lesson.id,
      tags: [],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setText('');
    onClose();
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  if (!lesson) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'white' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
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
          <Pressable onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ ...DesignTokens.typography.body, color: DesignTokens.colors.grey }}>
              Cancel
            </Text>
          </Pressable>
          <Text style={{ ...DesignTokens.typography.headline, color: DesignTokens.colors.graphite }}>
            Note — {lesson.studentName}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!text.trim()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                ...DesignTokens.typography.body,
                fontWeight: '600',
                color: text.trim() ? DesignTokens.colors.accent : DesignTokens.colors.grey,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        {/* Note input */}
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
            ...DesignTokens.typography.body,
            color: DesignTokens.colors.graphite,
            textAlignVertical: 'top',
          }}
          placeholder="What happened in this lesson?"
          placeholderTextColor={DesignTokens.colors.grey}
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
          returnKeyType="default"
        />

        {/* Save button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12 }}>
          <Pressable
            onPress={handleSave}
            disabled={!text.trim()}
            style={{
              backgroundColor: text.trim() ? DesignTokens.colors.accent : DesignTokens.colors.superLightGrey,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                ...DesignTokens.typography.headline,
                color: text.trim() ? 'white' : DesignTokens.colors.grey,
              }}
            >
              Save Note
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

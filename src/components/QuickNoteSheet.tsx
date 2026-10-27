import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useCoachStore } from '../state/coachStore';
import { Lesson } from '../types/coach';
import { DesignTokens } from '../utils/designTokens';

// One-tap topics so a note takes seconds between lessons; free text is optional.
const NOTE_TOPICS = [
  'Great session',
  'Forehand',
  'Backhand',
  'Serve',
  'Volley',
  'Footwork',
  'Positioning',
  'Tactics',
  'Fitness',
  'Needs rest',
];

interface QuickNoteSheetProps {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export function QuickNoteSheet({ visible, lesson, onClose }: QuickNoteSheetProps) {
  const insets = useSafeAreaInsets();
  const addStudentNote = useCoachStore(s => s.addStudentNote);
  const [text, setText] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const canSave = text.trim().length > 0 || topics.length > 0;

  const handleSave = () => {
    if (!lesson || !canSave) return;
    const typed = text.trim();
    const content = topics.length > 0 ? `${topics.join(', ')}${typed ? ` — ${typed}` : ''}` : typed;
    addStudentNote({
      studentId: lesson.studentId,
      coachId: lesson.coachId,
      content,
      lessonId: lesson.id,
      tags: topics,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  const reset = () => {
    setText('');
    setTopics([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleTopic = (topic: string) => {
    Haptics.selectionAsync();
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
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
            disabled={!canSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                ...DesignTokens.typography.body,
                fontWeight: '600',
                color: canSave ? DesignTokens.colors.accent : DesignTokens.colors.grey,
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
          placeholder="Anything to add? (optional)"
          placeholderTextColor={DesignTokens.colors.grey}
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
          returnKeyType="default"
        />

        {/* One-tap topics */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, gap: 8 }}
        >
          {NOTE_TOPICS.map((topic) => {
            const selected = topics.includes(topic);
            return (
              <Pressable
                key={topic}
                onPress={() => toggleTopic(topic)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  borderRadius: 22,
                  backgroundColor: selected ? DesignTokens.colors.accent : DesignTokens.colors.superLightGrey,
                }}
              >
                <Text
                  style={{
                    ...DesignTokens.typography.subhead,
                    fontWeight: '500',
                    color: selected ? 'white' : DesignTokens.colors.graphite,
                  }}
                >
                  {topic}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Save button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12 }}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              backgroundColor: canSave ? DesignTokens.colors.accent : DesignTokens.colors.superLightGrey,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                ...DesignTokens.typography.headline,
                color: canSave ? 'white' : DesignTokens.colors.grey,
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

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { showToast } from '../state/toastStore';

import { StudentNote } from '../types/coach';
import { formatDateRelative, getTimeAgo } from '../utils/dateFormat';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

interface StudentNotesScreenProps {
  studentId: string;
  studentName: string;
  notes: StudentNote[];
  onAddNote: (content: string, tags?: string[], lessonId?: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  onSearch: (query: string) => StudentNote[];
  onClose: () => void;
}

export function StudentNotesScreen({
  studentId,
  studentName,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSearch,
  onClose,
}: StudentNotesScreenProps) {
  const insets = useSafeAreaInsets();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const displayNotes = useMemo(() =>
    searchQuery.trim() ? onSearch(searchQuery) : notes,
    [searchQuery, notes, onSearch]
  );

  const handleAddNote = () => {
    if (!newNoteContent.trim()) {
      showToast(t('notes.enterContent'), 'error');
      return;
    }

    onAddNote(newNoteContent.trim());
    setNewNoteContent('');
    setShowAddNote(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !newNoteContent.trim()) return;

    onUpdateNote(editingNote.id, newNoteContent.trim());
    setNewNoteContent('');
    setEditingNote(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('notes.deleteTitle'),
      t('notes.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            onDeleteNote(noteId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const startEditNote = (note: StudentNote) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  // Group notes by date
  const groupedNotes: Record<string, StudentNote[]> = useMemo(() => {
    const grouped: Record<string, StudentNote[]> = {};
    displayNotes.forEach((note) => {
      const date = note.createdAt.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(note);
    });
    return grouped;
  }, [displayNotes]);

  const sortedDates = useMemo(() =>
    Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a)),
    [groupedNotes]
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View
          className="border-b border-gray-200"
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={onClose}
              className="w-11 h-11 items-center justify-center active:opacity-50"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={DesignTokens.colors.graphite} />
            </Pressable>

            <View className="flex-1 items-center px-4">
              <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
                {t('notes.titleFor', { studentName })}
              </Text>
              <Text className="text-sm mt-1" style={{ color: DesignTokens.colors.text.subtle }}>
                {t('notes.count', { count: notes.length })}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowAddNote(true)}
              className="w-11 h-11 items-center justify-center rounded-full active:bg-gray-100"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={32} color={DesignTokens.colors.brand.default} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="mt-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Ionicons name="search" size={20} color={DesignTokens.colors.text.subtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('notes.search')}
                placeholderTextColor={DesignTokens.colors.text.faint}
                className="flex-1 ml-2 text-base"
                style={{ color: DesignTokens.colors.graphite }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={DesignTokens.colors.text.subtle} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Timeline */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {displayNotes.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="document-text-outline" size={64} color={DesignTokens.colors.text.ghost} />
              <Text className="text-lg font-medium mt-4" style={{ color: DesignTokens.colors.text.subtle }}>
                {searchQuery ? t('notes.noneFound') : t('notes.noneYet')}
              </Text>
              <Text className="text-base mt-2 text-center px-8" style={{ color: DesignTokens.colors.text.faint }}>
                {searchQuery
                  ? t('notes.tryDifferentSearch')
                  : t('notes.addToTrack')}
              </Text>
            </View>
          ) : (
            <View className="px-4 pt-6">
              {sortedDates.map((date, dateIndex) => (
                <View key={date} className="mb-8">
                  {/* Date Header */}
                  <View className="flex-row items-center mb-4">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text
                      className="text-sm font-semibold mx-4"
                      style={{ color: DesignTokens.colors.text.subtle }}
                    >
                      {formatDateRelative(date)}
                    </Text>
                    <View className="flex-1 h-px bg-gray-200" />
                  </View>

                  {/* Notes for this date */}
                  {groupedNotes[date].map((note, noteIndex) => (
                    <View key={note.id} className="mb-3">
                      <View className="flex-row">
                        {/* Timeline dot */}
                        <View className="items-center mr-3">
                          <View
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: DesignTokens.colors.brand.default }}
                          />
                          {noteIndex < groupedNotes[date].length - 1 && (
                            <View
                              className="flex-1 w-px mt-1"
                              style={{ backgroundColor: DesignTokens.colors.line.soft, minHeight: 40 }}
                            />
                          )}
                        </View>

                        {/* Note Card */}
                        <View className="flex-1 mb-4">
                          <Pressable
                            onLongPress={() => startEditNote(note)}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-200 active:bg-gray-100"
                          >
                            <Text
                              className="text-base leading-6"
                              style={{ color: DesignTokens.colors.graphite }}
                            >
                              {note.content}
                            </Text>

                            {/* Tags */}
                            {note.tags && note.tags.length > 0 && (
                              <View className="flex-row flex-wrap gap-2 mt-3">
                                {note.tags.map((tag, i) => (
                                  <View
                                    key={i}
                                    className="px-3 py-1 rounded-full"
                                    style={{ backgroundColor: DesignTokens.colors.brand.tintMaterial }}
                                  >
                                    <Text
                                      className="text-xs font-medium"
                                      style={{ color: DesignTokens.colors.brand.link }}
                                    >
                                      {tag}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Footer */}
                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <Text className="text-xs" style={{ color: DesignTokens.colors.text.faint }}>
                                {getTimeAgo(note.createdAt)}
                                {note.updatedAt && t('notes.edited')}
                              </Text>

                              <View className="flex-row gap-2">
                                <Pressable
                                  onPress={() => startEditNote(note)}
                                  className="px-3 py-1 rounded-lg active:bg-gray-200"
                                >
                                  <Ionicons name="pencil" size={16} color={DesignTokens.colors.text.subtle} />
                                </Pressable>
                                <Pressable
                                  onPress={() => handleDeleteNote(note.id)}
                                  className="px-3 py-1 rounded-lg active:bg-gray-200"
                                >
                                  <Ionicons name="trash-outline" size={16} color={DesignTokens.colors.red.bright} />
                                </Pressable>
                              </View>
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Note Modal */}
        <Modal
          visible={showAddNote || editingNote !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowAddNote(false);
            setEditingNote(null);
            setNewNoteContent('');
          }}
        >
          <View className="flex-1 bg-white">
            <View
              className="flex-row items-center justify-between px-4 border-b border-gray-200"
              style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
            >
              <Pressable
                onPress={() => {
                  setShowAddNote(false);
                  setEditingNote(null);
                  setNewNoteContent('');
                }}
              >
                <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>
                  {t('common.cancel')}
                </Text>
              </Pressable>

              <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
                {editingNote ? t('notes.editNote') : t('notes.addNote')}
              </Text>

              <Pressable onPress={editingNote ? handleUpdateNote : handleAddNote}>
                <Text className="text-base font-semibold" style={{ color: DesignTokens.colors.brand.default }}>
                  {editingNote ? t('common.save') : t('common.add')}
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4">
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.subtle }}>
                {t('notes.noteContent')}
              </Text>
              <TextInput
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                placeholder={t('notes.contentPlaceholder')}
                placeholderTextColor={DesignTokens.colors.text.faint}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl p-4 text-base border border-gray-200"
                style={{
                  color: DesignTokens.colors.graphite,
                  minHeight: 200,
                }}
                autoFocus
              />

              <Text className="text-xs mt-3" style={{ color: DesignTokens.colors.text.faint }}>
                {t('notes.longPressHint')}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

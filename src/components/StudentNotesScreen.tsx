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

import { StudentNote } from '../types/coach';
import { formatDateRelative, getTimeAgo } from '../utils/dateFormat';

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
      Alert.alert('Empty Note', 'Please enter some content for the note.');
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
      'Delete Note',
      'Are you sure you want to delete this note? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
              className="w-10 h-10 items-center justify-center active:opacity-50"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </Pressable>

            <View className="flex-1 items-center px-4">
              <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
                {studentName}'s Notes
              </Text>
              <Text className="text-sm mt-1" style={{ color: '#6B7280' }}>
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowAddNote(true)}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={32} color="#1E88E5" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="mt-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notes..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-base"
                style={{ color: '#1C1C1E' }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Timeline */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {displayNotes.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-medium mt-4" style={{ color: '#6B7280' }}>
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </Text>
              <Text className="text-base mt-2 text-center px-8" style={{ color: '#9CA3AF' }}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add notes to track progress, observations, and goals'}
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
                      style={{ color: '#6B7280' }}
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
                            style={{ backgroundColor: '#1E88E5' }}
                          />
                          {noteIndex < groupedNotes[date].length - 1 && (
                            <View
                              className="flex-1 w-px mt-1"
                              style={{ backgroundColor: '#E5E7EB', minHeight: 40 }}
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
                              style={{ color: '#1C1C1E' }}
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
                                    style={{ backgroundColor: '#E3F2FD' }}
                                  >
                                    <Text
                                      className="text-xs font-medium"
                                      style={{ color: '#1976D2' }}
                                    >
                                      {tag}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Footer */}
                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <Text className="text-xs" style={{ color: '#9CA3AF' }}>
                                {getTimeAgo(note.createdAt)}
                                {note.updatedAt && ' • edited'}
                              </Text>

                              <View className="flex-row gap-2">
                                <Pressable
                                  onPress={() => startEditNote(note)}
                                  className="px-3 py-1 rounded-lg active:bg-gray-200"
                                >
                                  <Ionicons name="pencil" size={16} color="#6B7280" />
                                </Pressable>
                                <Pressable
                                  onPress={() => handleDeleteNote(note.id)}
                                  className="px-3 py-1 rounded-lg active:bg-gray-200"
                                >
                                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
                <Text className="text-base" style={{ color: '#1E88E5' }}>
                  Cancel
                </Text>
              </Pressable>

              <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </Text>

              <Pressable onPress={editingNote ? handleUpdateNote : handleAddNote}>
                <Text className="text-base font-semibold" style={{ color: '#1E88E5' }}>
                  {editingNote ? 'Save' : 'Add'}
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4">
              <Text className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>
                Note Content
              </Text>
              <TextInput
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                placeholder="Enter your observation, progress note, or goal..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl p-4 text-base border border-gray-200"
                style={{
                  color: '#1C1C1E',
                  minHeight: 200,
                }}
                autoFocus
              />

              <Text className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
                Long press any note in the timeline to edit it
              </Text>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

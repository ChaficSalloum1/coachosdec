import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCoachStore } from '../state/coachStore';
import { Student } from '../types/coach';
import { StudentNotesScreen } from '../components/StudentNotesScreen';

export function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const students = useCoachStore(s => s.students);
  const addStudentNote = useCoachStore(s => s.addStudentNote);
  const updateStudentNote = useCoachStore(s => s.updateStudentNote);
  const deleteStudentNote = useCoachStore(s => s.deleteStudentNote);
  const getStudentNotes = useCoachStore(s => s.getStudentNotes);
  const searchStudentNotes = useCoachStore(s => s.searchStudentNotes);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bottom search bar height: 56px input + 16px vertical padding
  const SEARCH_BAR_HEIGHT = 56;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header — title only, search moved to bottom */}
      <View
        className="px-4 border-b border-gray-200"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
          Students
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: SEARCH_BAR_HEIGHT + insets.bottom + 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-4">
          {filteredStudents.length === 0 ? (
            <EmptyState hasSearch={searchQuery.length > 0} />
          ) : (
            <View className="space-y-3">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onOpenNotes={() => setSelectedStudent(student)}
                  notesCount={getStudentNotes(student.id).length}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom-anchored search bar — in the thumb zone */}
      <View
        style={[
          styles.bottomSearchBar,
          { bottom: insets.bottom + 60 }, // 60 = tab bar height
        ]}
      >
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="#42526E" />
          <TextInput
            className="flex-1 ml-2 text-base text-ink-900"
            placeholder="Search students..."
            placeholderTextColor="#42526E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Student Notes Modal */}
      {selectedStudent && (
        <StudentNotesScreen
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          notes={getStudentNotes(selectedStudent.id)}
          onAddNote={(content, tags, lessonId) =>
            addStudentNote({
              studentId: selectedStudent.id,
              coachId: selectedStudent.coachId,
              content,
              tags,
              lessonId,
            })
          }
          onUpdateNote={updateStudentNote}
          onDeleteNote={deleteStudentNote}
          onSearch={(query) => searchStudentNotes(selectedStudent.id, query)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

interface EmptyStateProps {
  hasSearch: boolean;
}

function EmptyState({ hasSearch }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12">
      <Ionicons
        name={hasSearch ? "search-outline" : "people-outline"}
        size={64}
        color="#42526E"
      />
      <Text className="text-xl font-semibold mt-4 mb-2" style={{ color: '#0B1220' }}>
        {hasSearch ? 'No students found' : 'No students yet'}
      </Text>
      <Text className="text-base text-center" style={{ color: '#42526E' }}>
        {hasSearch
          ? 'Try adjusting your search terms'
          : "Students will appear here after their\nfirst approved booking."
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSearchBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

interface BalancePillProps {
  amount: number;
}

function BalancePill({ amount }: BalancePillProps) {
  return (
    <View style={{ backgroundColor: 'rgba(245, 124, 0, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#F57C00' }}>
        ${amount.toFixed(2)} due
      </Text>
    </View>
  );
}

interface PaymentSummaryProps {
  total: number;
  paid: number;
  due: number;
}

function PaymentSummary({ total, paid, due }: PaymentSummaryProps) {
  // If everything is paid, show simple total
  if (due === 0) {
    return (
      <Text className="text-small text-ink-600">
        ${total.toFixed(2)} total
      </Text>
    );
  }

  // If everything is unpaid, show total with "all due" indicator
  if (paid === 0) {
    return (
      <View className="items-end">
        <Text className="text-small text-ink-600">
          ${total.toFixed(2)} total
        </Text>
      </View>
    );
  }

  // Mixed payment state: show breakdown
  return (
    <View className="items-end">
      <Text className="text-xs text-ink-500">
        ${total.toFixed(2)} total
      </Text>
      <Text className="text-xs text-success">
        ${paid.toFixed(2)} paid
      </Text>
    </View>
  );
}

interface StudentCardProps {
  student: Student;
  onOpenNotes: () => void;
  notesCount: number;
}

function StudentCard({ student, onOpenNotes, notesCount }: StudentCardProps) {
  const { getStudentLessons, updateStudent, removeStudent } = useCoachStore();
  const studentLessons = getStudentLessons(student.id);

  // Calculate actual values from non-cancelled lessons
  const nonCancelledLessons = studentLessons.filter(l => l.status !== 'cancelled');
  const actualTotalLessons = nonCancelledLessons.length;
  const actualTotalSpent = nonCancelledLessons.reduce((sum, l) => sum + l.price, 0);
  const paidAmount = nonCancelledLessons.filter(l => l.isPaid).reduce((sum, l) => sum + l.price, 0);
  const unpaidAmount = nonCancelledLessons.filter(l => !l.isPaid).reduce((sum, l) => sum + l.price, 0);

  const showStudentDetails = () => {
    const scheduledLessons = studentLessons.filter(l => l.status === 'scheduled');
    const completedLessons = studentLessons.filter(l => l.status === 'completed');
    const cancelledLessons = studentLessons.filter(l => l.status === 'cancelled');
    const unpaidLessons = studentLessons.filter(l => !l.isPaid && l.status !== 'cancelled');

    const totalEarned = completedLessons.reduce((sum, l) => sum + l.price, 0);
    const upcomingRevenue = scheduledLessons.reduce((sum, l) => sum + l.price, 0);

    const detailsText = [
      `Contact: ${student.contact}`,
      '',
      '📊 Lesson Summary:',
      `Total Lessons: ${student.totalLessons}`,
      `  • Scheduled: ${scheduledLessons.length}`,
      `  • Completed: ${completedLessons.length}`,
      `  • Cancelled: ${cancelledLessons.length}`,
      '',
      '💰 Financial Summary:',
      `Total Spent: $${student.totalSpent.toFixed(2)}`,
      `  • Earned: $${totalEarned.toFixed(2)}`,
      `  • Upcoming: $${upcomingRevenue.toFixed(2)}`,
      `Balance Due: $${student.balance.toFixed(2)}`,
      unpaidLessons.length > 0 ? `  • ${unpaidLessons.length} unpaid lesson${unpaidLessons.length > 1 ? 's' : ''}` : '',
      student.notes ? `\nNotes: ${student.notes}` : ''
    ].filter(line => line !== '').join('\n');

    Alert.alert(
      student.name,
      detailsText,
      [
        {
          text: 'Remove Student',
          style: 'destructive',
          onPress: () => confirmRemoveStudent(student),
        },
        {
          text: 'Add Note',
          onPress: () => showAddNote(student),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  const confirmRemoveStudent = (student: Student) => {
    const scheduledLessons = studentLessons.filter(l => l.status === 'scheduled');
    
    const message = scheduledLessons.length > 0
      ? `This will remove ${student.name} and cancel ${scheduledLessons.length} scheduled lesson${scheduledLessons.length > 1 ? 's' : ''}. This action cannot be undone.`
      : `This will permanently remove ${student.name} from your student list. This action cannot be undone.`;

    Alert.alert(
      'Remove Student?',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeStudent(student.id),
        },
      ]
    );
  };

  const showAddNote = (student: Student) => {
    Alert.prompt(
      'Add Note',
      `Add a note for ${student.name}:`,
      (text) => {
        if (text !== null) {
          updateStudent(student.id, { notes: text.trim() || undefined });
        }
      },
      'plain-text',
      student.notes || ''
    );
  };

  const getLastLessonText = () => {
    if (!student.lastLessonDate) return 'No lessons yet';
    
    const lastLesson = new Date(student.lastLessonDate);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - lastLesson.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const handleContactPress = () => {
    if (!student.contact) return;
    const isPhone = /^[\d\s\+\-\(\)]{7,}$/.test(student.contact.trim());
    const url = isPhone
      ? `tel:${student.contact.replace(/\s/g, '')}`
      : `mailto:${student.contact}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable
      onPress={showStudentDetails}
      style={[
        {
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        unpaidAmount > 0 && {
          borderLeftWidth: 3,
          borderLeftColor: '#F57C00',
        },
      ]}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-section font-semibold text-ink-900 mb-1">
            {student.name}
          </Text>
          <Pressable
            onPress={(e) => { e.stopPropagation(); handleContactPress(); }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={{ fontSize: 13, color: '#1E88E5', marginBottom: 4 }}>
              {student.contact}
            </Text>
          </Pressable>
          <Text className="text-small text-ink-600">
            Last lesson: {getLastLessonText()}
          </Text>
          {student.notes && (
            <Text className="text-small text-ink-600 mt-2 italic">
              "{student.notes}"
            </Text>
          )}
        </View>

        <View className="ml-4 items-end">
          {unpaidAmount > 0 && (
            <BalancePill amount={unpaidAmount} />
          )}
          <Text className="text-small text-ink-600 mt-2">
            {actualTotalLessons} {actualTotalLessons === 1 ? 'lesson' : 'lessons'}
          </Text>
          {actualTotalSpent > 0 ? (
            <PaymentSummary
              total={actualTotalSpent}
              paid={paidAmount}
              due={unpaidAmount}
            />
          ) : (
            <Text className="text-small text-ink-600">
              $0 total
            </Text>
          )}

          {/* Notes Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onOpenNotes();
            }}
            className="flex-row items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-blue-50 active:bg-blue-100"
          >
            <Ionicons name="document-text" size={14} color="#1E88E5" />
            <Text className="text-xs font-medium" style={{ color: '#1E88E5' }}>
              {notesCount > 0 ? `${notesCount}` : 'Notes'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
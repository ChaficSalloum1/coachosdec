import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
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

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="px-4 py-3 border-b border-gray-200" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center bg-gray-100 rounded-default px-3 py-2">
          <Ionicons name="search" size={20} color="#42526E" />
          <TextInput
            className="flex-1 ml-2 text-body text-ink-900"
            placeholder="Search students..."
            placeholderTextColor="#42526E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-6">
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
    </View>
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

interface BalancePillProps {
  amount: number;
}

function BalancePill({ amount }: BalancePillProps) {
  return (
    <View className="bg-warning/10 px-2 py-1 rounded-full">
      <Text className="text-xs font-medium text-warning">
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

  return (
    <Pressable
      onPress={showStudentDetails}
      className="bg-white rounded-card border border-gray-200 p-4 shadow-sm active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-section font-semibold text-ink-900 mb-1">
            {student.name}
          </Text>
          <Text className="text-small text-ink-600 mb-2">
            {student.contact}
          </Text>
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
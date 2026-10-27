import React, { useMemo, useState } from 'react';
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
import { useCurrency } from '../hooks/useCurrency';
import { Student } from '../types/coach';
import { StudentNotesScreen } from '../components/StudentNotesScreen';
import { LessonPaymentSheet } from '../components/payments/LessonPaymentSheet';
import { summarizeUnpaid } from '../utils/unpaid';
import { todayISO } from '../utils/dayNav';
import { DesignTokens } from '../utils/designTokens';

export function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const students = useCoachStore(s => s.students);
  const addStudentNote = useCoachStore(s => s.addStudentNote);
  const updateStudentNote = useCoachStore(s => s.updateStudentNote);
  const deleteStudentNote = useCoachStore(s => s.deleteStudentNote);
  const getStudentNotes = useCoachStore(s => s.getStudentNotes);
  const searchStudentNotes = useCoachStore(s => s.searchStudentNotes);

  const lessons = useCoachStore(s => s.lessons);
  const { formatMoney } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [owingOnly, setOwingOnly] = useState(false);
  const [paymentLessonId, setPaymentLessonId] = useState<string | null>(null);

  const unpaid = useMemo(() => summarizeUnpaid(lessons, students, todayISO()), [lessons, students]);
  // Nothing owed any more: leave the filter so the list is never stuck empty.
  const showOwing = owingOnly && unpaid.students.length > 0;

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SEARCH_BAR_HEIGHT = 64;

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
        <Text className="text-xl font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
          Students
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        style={{ marginBottom: SEARCH_BAR_HEIGHT + insets.bottom }}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-4">
          {showOwing ? (
            <View>
              <Text className="text-sm mb-3" style={{ color: DesignTokens.colors.text.muted }}>
                {formatMoney(unpaid.total)} owed by {unpaid.students.length} {unpaid.students.length === 1 ? 'student' : 'students'}
              </Text>
              {unpaid.students.map((row) => (
                <View
                  key={row.student.id}
                  className="flex-row items-center border-b border-gray-100"
                  style={{ minHeight: 64 }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: DesignTokens.colors.text.strong }} numberOfLines={1}>
                      {row.student.name}
                    </Text>
                    <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                      {row.lessonCount} {row.lessonCount === 1 ? 'lesson' : 'lessons'} · since {row.oldestDate}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold mr-3" style={{ color: DesignTokens.colors.red['700'] }}>
                    {formatMoney(row.amount)}
                  </Text>
                  <Pressable
                    onPress={() => setPaymentLessonId(row.oldestLessonId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Request payment from ${row.student.name}`}
                    className="rounded-full px-4 justify-center"
                    style={{ minHeight: 44, backgroundColor: DesignTokens.colors.brand.default }}
                  >
                    <Text className="font-semibold" style={{ color: DesignTokens.colors.white }}>Request</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : filteredStudents.length === 0 ? (
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
          { bottom: insets.bottom },
        ]}
      >
        <View className="flex-row items-center" style={{ gap: 8 }}>
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color={DesignTokens.colors.text.muted} />
          <TextInput
            className="flex-1 ml-2 text-base text-ink-900"
            placeholder="Search students..."
            placeholderTextColor={DesignTokens.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        {unpaid.students.length > 0 && (
          <Pressable
            onPress={() => setOwingOnly((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ selected: showOwing }}
            className="rounded-xl px-3 justify-center"
            style={{ minHeight: 44, backgroundColor: showOwing ? DesignTokens.colors.red['700'] : DesignTokens.colors.red.tint }}
          >
            <Text className="font-semibold" style={{ color: showOwing ? DesignTokens.colors.white : DesignTokens.colors.red['700'] }}>
              Owing {formatMoney(unpaid.total)}
            </Text>
          </Pressable>
        )}
        </View>
      </View>

      <LessonPaymentSheet lessonId={paymentLessonId} onClose={() => setPaymentLessonId(null)} />

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
        color={DesignTokens.colors.text.muted}
      />
      <Text className="text-xl font-semibold mt-4 mb-2" style={{ color: DesignTokens.colors.text.strong }}>
        {hasSearch ? 'No students found' : 'No students yet'}
      </Text>
      <Text className="text-base text-center" style={{ color: DesignTokens.colors.text.muted }}>
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
    borderTopColor: DesignTokens.colors.line.default,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

interface BalancePillProps {
  amount: number;
}

function BalancePill({ amount }: BalancePillProps) {
  const { formatMoney } = useCurrency();
  return (
    <View style={{ backgroundColor: DesignTokens.colors.amber.glow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: DesignTokens.colors.amber.strong }}>
        {formatMoney(amount)} due
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
  const { formatMoney } = useCurrency();
  // If everything is paid, show simple total
  if (due === 0) {
    return (
      <Text className="text-small text-ink-600">
        {formatMoney(total)} total
      </Text>
    );
  }

  // If everything is unpaid, show total with "all due" indicator
  if (paid === 0) {
    return (
      <View className="items-end">
        <Text className="text-small text-ink-600">
          {formatMoney(total)} total
        </Text>
      </View>
    );
  }

  // Mixed payment state: show breakdown
  return (
    <View className="items-end">
      <Text className="text-xs text-ink-500">
        {formatMoney(total)} total
      </Text>
      <Text className="text-xs text-success">
        {formatMoney(paid)} paid
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
  const { formatMoney } = useCurrency();
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
      `Total Spent: ${formatMoney(student.totalSpent)}`,
      `  • Earned: ${formatMoney(totalEarned)}`,
      `  • Upcoming: ${formatMoney(upcomingRevenue)}`,
      `Balance Due: ${formatMoney(student.balance)}`,
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
          borderColor: DesignTokens.colors.line.default,
          padding: 16,
          shadowColor: DesignTokens.colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        unpaidAmount > 0 && {
          borderLeftWidth: 3,
          borderLeftColor: DesignTokens.colors.amber.strong,
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
            <Text style={{ fontSize: 13, color: DesignTokens.colors.brand.default, marginBottom: 4 }}>
              {student.contact}
            </Text>
          </Pressable>
          <Text className="text-small text-ink-600">
            Last lesson: {getLastLessonText()}
          </Text>
          {student.notes && (
            <Text className="text-small text-ink-600 mt-2 italic">
              {`"${student.notes}"`}
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
            <Ionicons name="document-text" size={14} color={DesignTokens.colors.brand.default} />
            <Text className="text-xs font-medium" style={{ color: DesignTokens.colors.brand.default }}>
              {notesCount > 0 ? `${notesCount}` : 'Notes'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

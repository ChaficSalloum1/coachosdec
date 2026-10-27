/*
Housekeeping the app runs at start-up: mark lessons that have finished as
completed, and keep each student's running totals in step with their lessons.
Pure so each rule is tested.
*/
import { normalizeClockTime } from './timeFormat';
import type { Lesson, Student } from '../types/coach';

interface LessonsAndStudents {
  lessons: Lesson[];
  students: Student[];
}

// Scheduled lessons whose end time has passed become completed, and their
// student's last-lesson date moves forward. null when nothing changed.
export function completePastLessons(state: LessonsAndStudents, now: Date): LessonsAndStudents | null {
  const finished = state.lessons.filter((l) => {
    if (l.status !== 'scheduled') return false;
    const end = new Date(`${l.date}T${normalizeClockTime(l.endTime)}:00`);
    return end.getTime() < now.getTime();
  });
  if (finished.length === 0) return null;

  const finishedIds = new Set(finished.map((l) => l.id));
  const lessons = state.lessons.map((l) => (finishedIds.has(l.id) ? { ...l, status: 'completed' as const } : l));

  const latestByStudent = new Map<string, string>();
  for (const l of finished) {
    const current = latestByStudent.get(l.studentId);
    if (!current || l.date > current) latestByStudent.set(l.studentId, l.date);
  }
  const students = state.students.map((s) => {
    const latest = latestByStudent.get(s.id);
    return latest && (!s.lastLessonDate || latest > s.lastLessonDate) ? { ...s, lastLessonDate: latest } : s;
  });

  return { lessons, students };
}

const activeLessonsOf = (lessons: Lesson[], studentId: string) =>
  lessons.filter((l) => l.studentId === studentId && l.status !== 'cancelled');

// Totals recomputed from the student's non-cancelled lessons.
export function recalculateStudentTotals(lessons: Lesson[], students: Student[]): Student[] {
  return students.map((student) => {
    const own = activeLessonsOf(lessons, student.id);
    const lastCompleted = own
      .filter((l) => l.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return {
      ...student,
      totalLessons: own.length,
      totalSpent: own.reduce((sum, l) => sum + l.price, 0),
      balance: own.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.price, 0),
      lastLessonDate: lastCompleted ? lastCompleted.date : student.lastLessonDate,
    };
  });
}

export interface IntegrityReport {
  studentIssues: { studentId: string; issue: string }[];
  lessonIssues: { lessonId: string; issue: string }[];
}

// Development aid: where the stored totals disagree with the lessons.
export function checkDataIntegrity(lessons: Lesson[], students: Student[], now: Date = new Date()): IntegrityReport {
  const studentIssues: IntegrityReport['studentIssues'] = [];
  const lessonIssues: IntegrityReport['lessonIssues'] = [];

  for (const student of students) {
    const own = activeLessonsOf(lessons, student.id);
    const actualLessons = own.length;
    const actualSpent = own.reduce((sum, l) => sum + l.price, 0);
    const actualBalance = own.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.price, 0);

    if (student.totalLessons !== actualLessons) {
      studentIssues.push({ studentId: student.id, issue: `totalLessons mismatch: stored=${student.totalLessons}, actual=${actualLessons}` });
    }
    if (Math.abs(student.totalSpent - actualSpent) > 0.01) {
      studentIssues.push({ studentId: student.id, issue: `totalSpent mismatch: stored=${student.totalSpent}, actual=${actualSpent}` });
    }
    if (Math.abs(student.balance - actualBalance) > 0.01) {
      studentIssues.push({ studentId: student.id, issue: `balance mismatch: stored=${student.balance}, actual=${actualBalance}` });
    }
    if (student.totalSpent > 0 && student.totalLessons === 0) {
      studentIssues.push({ studentId: student.id, issue: 'Has totalSpent > 0 but totalLessons = 0' });
    }
  }

  for (const lesson of lessons) {
    if (!students.some((s) => s.id === lesson.studentId)) {
      lessonIssues.push({ lessonId: lesson.id, issue: `Student with id ${lesson.studentId} not found in students array` });
    }
    const end = new Date(`${lesson.date}T${normalizeClockTime(lesson.endTime)}:00`);
    if (lesson.status === 'scheduled' && end < now) {
      lessonIssues.push({ lessonId: lesson.id, issue: 'Lesson ended in the past but still marked as scheduled' });
    }
  }

  return { studentIssues, lessonIssues };
}

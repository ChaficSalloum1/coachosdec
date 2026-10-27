/*
What cancelling a lesson changes: the lesson is marked cancelled and its
student's running totals go down. Pure so the rules are tested; the store
slice adds the calendar and persistence around it.
*/
import type { Lesson, Student } from '../types/coach';

interface LessonsAndStudents {
  lessons: Lesson[];
  students: Student[];
}

// null when there is nothing to cancel (unknown lesson, or already cancelled).
export function applyLessonCancellation(state: LessonsAndStudents, lessonId: string): LessonsAndStudents | null {
  const lesson = state.lessons.find((l) => l.id === lessonId);
  if (!lesson || lesson.status === 'cancelled') return null;

  const lessons = state.lessons.map((l) => (l.id === lessonId ? { ...l, status: 'cancelled' as const } : l));

  if (!state.students.some((s) => s.id === lesson.studentId)) {
    return { lessons, students: state.students };
  }

  // The student's last lesson is now their most recent completed one, if any.
  const lastCompleted = lessons
    .filter((l) => l.studentId === lesson.studentId && l.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return {
    lessons,
    students: state.students.map((s) =>
      s.id === lesson.studentId
        ? {
            ...s,
            totalLessons: Math.max(0, s.totalLessons - 1),
            totalSpent: Math.max(0, s.totalSpent - lesson.price),
            // A paid lesson was never part of what they owe.
            balance: lesson.isPaid ? s.balance : Math.max(0, s.balance - lesson.price),
            lastLessonDate: lastCompleted?.date,
          }
        : s
    ),
  };
}

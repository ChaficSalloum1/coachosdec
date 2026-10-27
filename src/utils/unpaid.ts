/*
"Who owes me": unpaid lessons that are already due (today or earlier),
totalled per student, biggest debt first. Pure so it can be tested.
*/
import type { Lesson, Student } from '../types/coach';

export interface OwingStudent {
  student: Student;
  amount: number;
  lessonCount: number;
  oldestDate: string; // yyyy-MM-dd
  oldestLessonId: string; // the lesson to open the payment request for
}

export function summarizeUnpaid(
  lessons: Lesson[],
  students: Student[],
  today: string // yyyy-MM-dd
): { total: number; students: OwingStudent[] } {
  const due = lessons.filter((l) => l.status !== 'cancelled' && !l.isPaid && l.date <= today);

  const byStudent = new Map<string, Lesson[]>();
  for (const lesson of due) {
    byStudent.set(lesson.studentId, [...(byStudent.get(lesson.studentId) ?? []), lesson]);
  }

  const rows: OwingStudent[] = [];
  for (const [studentId, owed] of byStudent) {
    const student = students.find((s) => s.id === studentId);
    if (!student) continue;
    const oldest = [...owed].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
    rows.push({
      student,
      amount: owed.reduce((sum, l) => sum + l.price, 0),
      lessonCount: owed.length,
      oldestDate: oldest.date,
      oldestLessonId: oldest.id,
    });
  }

  rows.sort((a, b) => b.amount - a.amount || a.oldestDate.localeCompare(b.oldestDate));
  return { total: rows.reduce((sum, r) => sum + r.amount, 0), students: rows };
}

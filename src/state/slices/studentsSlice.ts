import type { Student } from '../../types/coach';
import { checkDataIntegrity, recalculateStudentTotals, type IntegrityReport } from '../../utils/lessonMaintenance';
import type { SliceCreator } from './types';

export interface StudentsSlice {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  // Removes the student and cancels their lessons.
  removeStudent: (studentId: string) => void;
  // Start-up housekeeping: rebuild every student's totals from their lessons.
  recalculateStudentTotals: () => void;
  // Development aid: where stored totals disagree with the lessons.
  checkDataIntegrity: () => IntegrityReport;
}

export const createStudentsSlice: SliceCreator<StudentsSlice> = (set, get) => ({
  students: [],

  addStudent: (student) => set((state) => ({ students: [student, ...state.students] })),

  updateStudent: (studentId, updates) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === studentId ? { ...s, ...updates } : s)),
    })),

  removeStudent: (studentId) =>
    set((state) => ({
      students: state.students.filter((s) => s.id !== studentId),
      lessons: state.lessons.map((lesson) =>
        lesson.studentId === studentId && lesson.status !== 'cancelled'
          ? { ...lesson, status: 'cancelled' as const }
          : lesson
      ),
    })),

  recalculateStudentTotals: () =>
    set((state) => ({ students: recalculateStudentTotals(state.lessons, state.students) })),

  checkDataIntegrity: () => checkDataIntegrity(get().lessons, get().students),
});

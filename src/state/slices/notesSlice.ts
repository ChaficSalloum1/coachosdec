import { v4 as uuidv4 } from 'uuid';

import type { StudentNote } from '../../types/coach';
import type { SliceCreator } from './types';

export interface NotesSlice {
  studentNotes: StudentNote[];
  addStudentNote: (note: Omit<StudentNote, 'id' | 'createdAt'>) => void;
  updateStudentNote: (noteId: string, content: string) => void;
  deleteStudentNote: (noteId: string) => void;
  getStudentNotes: (studentId: string) => StudentNote[];
  searchStudentNotes: (studentId: string, query: string) => StudentNote[];
}

const newestFirst = (a: StudentNote, b: StudentNote) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const createNotesSlice: SliceCreator<NotesSlice> = (set, get) => ({
  studentNotes: [],

  addStudentNote: (note) =>
    set((state) => ({
      studentNotes: [{ ...note, id: uuidv4(), createdAt: new Date().toISOString() }, ...state.studentNotes],
    })),

  updateStudentNote: (noteId, content) =>
    set((state) => ({
      studentNotes: state.studentNotes.map((note) =>
        note.id === noteId ? { ...note, content, updatedAt: new Date().toISOString() } : note
      ),
    })),

  deleteStudentNote: (noteId) =>
    set((state) => ({ studentNotes: state.studentNotes.filter((note) => note.id !== noteId) })),

  getStudentNotes: (studentId) =>
    get()
      .studentNotes.filter((note) => note.studentId === studentId)
      .sort(newestFirst),

  searchStudentNotes: (studentId, query) => {
    const lowerQuery = query.toLowerCase();
    return get()
      .studentNotes.filter(
        (note) =>
          note.studentId === studentId &&
          (note.content.toLowerCase().includes(lowerQuery) ||
            note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
      )
      .sort(newestFirst);
  },
});

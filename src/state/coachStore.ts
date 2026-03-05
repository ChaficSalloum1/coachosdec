import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format } from 'date-fns';
import { Coach, BookingRequest, Lesson, Student, StudentNote, Area, Facility, Court, AvailabilityRange, BlackoutDate } from '../types/coach';

// Helper function to safely import CalendarService
const getCalendarService = async () => {
  try {
    const { CalendarService } = await import('../utils/calendarService');
    return CalendarService;
  } catch (error) {
    if (__DEV__) {
      console.warn('📅 CalendarService not available (native module not loaded)');
    }
    return null;
  }
};

interface CoachState {
  // Current coach profile
  coach: Coach | null;
  
  // Booking requests
  bookingRequests: BookingRequest[];
  
  // Lessons
  lessons: Lesson[];
  
  // Students
  students: Student[];

  // Student Notes (Timeline)
  studentNotes: StudentNote[];

  // Locations
  areas: Area[];
  facilities: Facility[];
  courts: Court[];
  
  // New Availability System
  availabilityRanges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];
  
  // Actions
  setCoach: (coach: Coach) => void;
  updateCoach: (updates: Partial<Coach>) => void;
  
  // Booking request actions
  addBookingRequest: (request: BookingRequest) => void;
  approveBookingRequest: (requestId: string) => Promise<void>;
  declineBookingRequest: (requestId: string) => void;
  
  // Lesson actions
  createLesson: (params: {
    studentId: string;
    studentName: string;
    date: string;
    startTime: string;
    duration: number;
    price: number;
    areaId?: string;
    facilityId?: string;
    courtId?: string;
  }) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  markLessonPaid: (lessonId: string) => void;
  cancelLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  autoCompletePastLessons: () => void;
  
  // Student actions
  addStudent: (student: Student) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  removeStudent: (studentId: string) => void;
  getStudentByContact: (contact: string) => Student | undefined;

  // Student Notes actions
  addStudentNote: (note: Omit<StudentNote, 'id' | 'createdAt'>) => void;
  updateStudentNote: (noteId: string, content: string) => void;
  deleteStudentNote: (noteId: string) => void;
  getStudentNotes: (studentId: string) => StudentNote[];
  getStudentNotesGroupedByDate: (studentId: string) => Record<string, StudentNote[]>;
  searchStudentNotes: (studentId: string, query: string) => StudentNote[];

  // Location actions
  addArea: (area: Area) => void;
  updateArea: (areaId: string, updates: Partial<Area>) => void;
  deleteArea: (areaId: string) => void;
  
  addFacility: (facility: Facility) => void;
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  deleteFacility: (facilityId: string) => void;
  
  addCourt: (court: Court) => void;
  updateCourt: (courtId: string, updates: Partial<Court>) => void;
  deleteCourt: (courtId: string) => void;
  
  // Availability actions
  addAvailabilityRange: (range: AvailabilityRange) => void;
  updateAvailabilityRange: (rangeId: string, updates: Partial<AvailabilityRange>) => void;
  deleteAvailabilityRange: (rangeId: string) => void;
  
  // Blackout date actions
  addBlackoutDate: (blackout: BlackoutDate) => void;
  removeBlackoutDate: (blackoutId: string) => void;
  
  // Utility functions
  getTodaysLessons: () => Lesson[];
  getUpcomingLessons: () => Lesson[];
  getPendingRequests: () => BookingRequest[];
  getStudentLessons: (studentId: string) => Lesson[];
  recalculateStudentTotals: () => void;
  checkDataIntegrity: () => { studentIssues: Array<{studentId: string, issue: string}>, lessonIssues: Array<{lessonId: string, issue: string}> };
  
  // Location utility functions
  getAreaById: (areaId: string) => Area | undefined;
  getFacilityById: (facilityId: string) => Facility | undefined;
  getCourtById: (courtId: string) => Court | undefined;
  getFacilitiesByArea: (areaId: string) => Facility[];
  getCourtsByFacility: (facilityId: string) => Court[];
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
  
  // Availability utility functions
  getAvailabilityRangesForDay: (dayOfWeek: number) => AvailabilityRange[];
  generateSlotsForNext14Days: () => Array<{date: string, time: string, range: AvailabilityRange}>;
  validateRangeOverlap: (range: Omit<AvailabilityRange, 'id' | 'coachId'>, excludeId?: string) => boolean;
  
  // Data migration
  migrateExistingData: () => void;
  forceUpdateLessonsWithLocations: () => void;
  normalizeAvailabilityRanges: () => void;
  clearAllData: () => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      coach: null,
      bookingRequests: [],
      lessons: [],
      students: [],
      studentNotes: [],
      areas: [],
      facilities: [],
      courts: [],
      availabilityRanges: [],
      blackoutDates: [],

      setCoach: (coach) => set({ coach }),

      updateCoach: (updates) => set((state) => ({
        coach: state.coach ? { ...state.coach, ...updates } : null
      })),
      
      addBookingRequest: (request) => set((state) => {
        // Validate required fields
        if (!request.coachId || !request.studentName || !request.studentContact || !request.requestedDate || !request.requestedTime) {
          throw new Error('Missing required booking information');
        }
        
        // Ensure the request has a proper ID
        if (!request.id) {
          throw new Error('Booking request must have an ID');
        }
        
        return {
          bookingRequests: [request, ...state.bookingRequests]
        };
      }),
      
      approveBookingRequest: async (requestId) => {
        const state = get();
        const request = state.bookingRequests.find(r => r.id === requestId);
        if (!request) {
          throw new Error('Booking request not found');
        }
        if (!state.coach) {
          throw new Error('Coach profile not available');
        }
        if (request.status !== 'pending') {
          throw new Error('Request has already been processed');
        }
        
        // Debug logging for development
        if (__DEV__) {
          console.log('🎾 Approving booking request:', {
            student: request.studentName,
            date: request.requestedDate,
            time: request.requestedTime,
            court: request.courtId || 'No specific court',
            area: request.areaId,
            facility: request.facilityId
          });
        }
        
        // Validate date and time format before creating Date objects
        const dateTimeString = `${request.requestedDate} ${request.requestedTime}`;
        const requestStartTime = new Date(dateTimeString);

        // Check if date is valid
        if (isNaN(requestStartTime.getTime())) {
          throw new Error(`Invalid date or time format: ${dateTimeString}`);
        }

        const requestEndTime = new Date(requestStartTime.getTime() + request.duration * 60000);

        // Check if coach already has a lesson at this time (can only be in one place)
        
        const conflictingLesson = state.lessons.find(lesson => {
          // Only check lessons that are not cancelled and on the same date
          if (lesson.status === 'cancelled' || lesson.date !== request.requestedDate) {
            return false;
          }

          const lessonStartTime = new Date(`${lesson.date} ${lesson.startTime}`);
          const lessonEndTime = new Date(`${lesson.date} ${lesson.endTime}`);

          // Validate lesson dates
          if (isNaN(lessonStartTime.getTime()) || isNaN(lessonEndTime.getTime())) {
            if (__DEV__) {
              console.warn('Invalid lesson date detected:', lesson);
            }
            return false;
          }

          // Check for time overlap including midnight crossing
          // A lesson crosses midnight if end time is on the next day
          const lessonCrossesMidnight = lessonEndTime < lessonStartTime;
          const requestCrossesMidnight = requestEndTime < requestStartTime;

          let hasTimeOverlap = false;

          if (lessonCrossesMidnight || requestCrossesMidnight) {
            // Complex midnight crossing logic - overlap if any part of the ranges intersect
            hasTimeOverlap = !(requestEndTime <= lessonStartTime || requestStartTime >= lessonEndTime);
          } else {
            // Standard overlap check
            hasTimeOverlap = (requestStartTime < lessonEndTime && requestEndTime > lessonStartTime);
          }

          if (__DEV__ && hasTimeOverlap) {
            console.log('🔍 Time conflict detected:', {
              requestTime: `${request.requestedTime}-${addMinutesToTime(request.requestedTime, request.duration)}`,
              requestDate: request.requestedDate,
              lessonTime: `${lesson.startTime}-${lesson.endTime}`,
              lessonDate: lesson.date,
              lessonStudent: lesson.studentName
            });
          }

          return hasTimeOverlap;
        });

        // Also check for pending requests at the same time to prevent race conditions
        const conflictingPendingRequest = state.bookingRequests.find(r =>
          r.id !== requestId &&
          r.status === 'pending' &&
          r.requestedDate === request.requestedDate &&
          r.requestedTime === request.requestedTime
        );

        if (conflictingPendingRequest) {
          throw new Error(`Another booking request exists for this time slot. Please refresh and try again.`);
        }
        
        if (conflictingLesson) {
          throw new Error(`Time conflict: You already have a lesson with ${conflictingLesson.studentName} scheduled at this time.`);
        }
        
        // Get or create student FIRST (before creating lesson so we have proper ID)
        let student = state.students.find(s => s.contact === request.studentContact);
        const isNewStudent = !student;
        
        if (!student) {
          student = {
            id: `student_${Date.now()}`,
            coachId: request.coachId,
            name: request.studentName,
            contact: request.studentContact,
            totalLessons: 0, // Will increment below
            totalSpent: 0,
            balance: 0,
            createdAt: new Date().toISOString(),
            lastLessonDate: request.requestedDate
          };
        }
        
        // Create lesson from approved request with proper student ID
        const lesson: Lesson = {
          id: `lesson_${Date.now()}`,
          coachId: request.coachId,
          studentId: student.id, // Use proper student ID
          studentName: request.studentName,
          date: request.requestedDate,
          startTime: request.requestedTime,
          endTime: addMinutesToTime(request.requestedTime, request.duration),
          duration: request.duration,
          price: (request.duration / 60) * state.coach.pricePerHour,
          isPaid: false,
          status: 'scheduled',
          notes: request.note,
          createdAt: new Date().toISOString(),
          areaId: request.areaId,
          facilityId: request.facilityId,
          courtId: request.courtId
        };
        
        // Sync to device calendar if enabled
        if (state.coach.calendarSyncEnabled) {
          try {
            const CalendarService = await getCalendarService();
            if (CalendarService) {
              const calendarEventId = await CalendarService.createLessonEvent(lesson);
              if (calendarEventId) {
                lesson.calendarEventId = calendarEventId;
                if (__DEV__) {
                  console.log('📅 Synced lesson to calendar:', calendarEventId);
                }
              }
            } else {
              if (__DEV__) {
                console.warn('📅 Calendar sync enabled but CalendarService not available');
              }
            }
          } catch (error) {
            // Don't fail the booking if calendar sync fails, just log it
            if (__DEV__) {
              console.warn('📅 Failed to sync lesson to calendar:', error);
            }
          }
        }
        
        // Update student totals and lastLessonDate
        student = {
          ...student,
          totalLessons: student.totalLessons + 1,
          totalSpent: student.totalSpent + lesson.price,
          balance: student.balance + lesson.price,
          lastLessonDate: request.requestedDate // Always update to most recent booking
        };
        
        set({
          bookingRequests: state.bookingRequests.map(r => 
            r.id === requestId ? { ...r, status: 'approved' as const } : r
          ),
          lessons: [lesson, ...state.lessons],
          students: isNewStudent 
            ? [student, ...state.students]
            : state.students.map(s => s.id === student!.id ? student! : s)
        });
      },
      
      declineBookingRequest: (requestId) => set((state) => ({
        bookingRequests: state.bookingRequests.map(r => 
          r.id === requestId ? { ...r, status: 'declined' as const } : r
        )
      })),
      
      createLesson: (params) => set((state) => {
        if (!state.coach) return state;
        const lesson: Lesson = {
          id: `lesson_${Date.now()}`,
          coachId: state.coach.id,
          studentId: params.studentId,
          studentName: params.studentName,
          date: params.date,
          startTime: params.startTime,
          endTime: addMinutesToTime(params.startTime, params.duration),
          duration: params.duration,
          price: params.price,
          isPaid: false,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          areaId: params.areaId,
          facilityId: params.facilityId,
          courtId: params.courtId,
        };
        const updatedStudents = state.students.map(s => {
          if (s.id !== params.studentId) return s;
          return {
            ...s,
            totalLessons: s.totalLessons + 1,
            totalSpent: s.totalSpent + params.price,
            balance: s.balance + params.price,
            lastLessonDate: params.date,
          };
        });
        return {
          lessons: [lesson, ...state.lessons],
          students: updatedStudents,
        };
      }),

      addLesson: (lesson) => set((state) => ({
        lessons: [lesson, ...state.lessons]
      })),
      
      updateLesson: (lessonId, updates) => set((state) => ({
        lessons: state.lessons.map(l => 
          l.id === lessonId ? { ...l, ...updates } : l
        )
      })),
      
      markLessonPaid: (lessonId) => set((state) => {
        const lesson = state.lessons.find(l => l.id === lessonId);
        if (!lesson) return state;
        
        return {
          lessons: state.lessons.map(l => 
            l.id === lessonId ? { ...l, isPaid: true } : l
          ),
          students: state.students.map(s => 
            s.id === lesson.studentId 
              ? { ...s, balance: Math.max(0, s.balance - lesson.price) }
              : s
          )
        };
      }),
      
      cancelLesson: async (lessonId) => {
        const state = get();
        const lesson = state.lessons.find(l => l.id === lessonId);
        if (!lesson || lesson.status === 'cancelled') return;

        // Delete calendar event if synced
        if (lesson.calendarEventId && state.coach?.calendarSyncEnabled) {
          try {
            const CalendarService = await getCalendarService();
            if (CalendarService) {
              await CalendarService.deleteLessonEvent(lesson.calendarEventId);
              if (__DEV__) {
                console.log('📅 Deleted calendar event:', lesson.calendarEventId);
              }
            }
          } catch (error) {
            // Don't fail cancellation if calendar deletion fails
            if (__DEV__) {
              console.warn('📅 Failed to delete calendar event:', error);
            }
          }
        }

        // Find the student
        const student = state.students.find(s => s.id === lesson.studentId);
        if (!student) {
          // Just mark cancelled if student not found
          set({
            lessons: state.lessons.map(l =>
              l.id === lessonId ? { ...l, status: 'cancelled' as const } : l
            )
          });
          return;
        }

        // Update the lessons list first
        const updatedLessons = state.lessons.map(l =>
          l.id === lessonId ? { ...l, status: 'cancelled' as const } : l
        );

        // Find remaining non-cancelled lessons for this student
        const remainingLessons = updatedLessons.filter(
          l => l.studentId === lesson.studentId && l.status !== 'cancelled'
        );

        // Calculate new lastLessonDate from remaining lessons
        const completedLessons = remainingLessons.filter(l => l.status === 'completed');
        const newLastLessonDate = completedLessons.length > 0
          ? completedLessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : undefined;

        set({
          lessons: updatedLessons,
          students: state.students.map(s => {
            if (s.id === lesson.studentId) {
              return {
                ...s,
                totalLessons: Math.max(0, s.totalLessons - 1),
                totalSpent: Math.max(0, s.totalSpent - lesson.price),
                balance: lesson.isPaid ? s.balance : Math.max(0, s.balance - lesson.price),
                lastLessonDate: newLastLessonDate
              };
            }
            return s;
          })
        });
      },

      // Complete a scheduled lesson
      completeLesson: (lessonId) => set((state) => {
        const lesson = state.lessons.find(l => l.id === lessonId);
        if (!lesson || lesson.status !== 'scheduled') return state;
        
        return {
          lessons: state.lessons.map(l => 
            l.id === lessonId ? { ...l, status: 'completed' as const } : l
          ),
          students: state.students.map(s => {
            if (s.id === lesson.studentId) {
              // Update lastLessonDate to this lesson's date if it's more recent
              const currentLast = s.lastLessonDate ? new Date(s.lastLessonDate) : new Date(0);
              const thisLessonDate = new Date(lesson.date);
              return {
                ...s,
                lastLessonDate: thisLessonDate > currentLast ? lesson.date : s.lastLessonDate
              };
            }
            return s;
          })
        };
      }),
      
      autoCompletePastLessons: () => set((state) => {
        const now = new Date();
        const nowTime = now.getTime();
        
        let updatedLessons = [...state.lessons];
        let updatedStudents = [...state.students];
        let changesMade = false;
        
        state.lessons.forEach(lesson => {
          if (lesson.status === 'scheduled') {
            // Parse lesson end time
            const lessonDateTime = new Date(`${lesson.date}T${lesson.endTime}:00`);
            const lessonEndTime = lessonDateTime.getTime();
            
            // If lesson ended in the past, mark as completed
            if (lessonEndTime < nowTime) {
              changesMade = true;
              updatedLessons = updatedLessons.map(l =>
                l.id === lesson.id ? { ...l, status: 'completed' as const } : l
              );
              
              // Update student's lastLessonDate
              updatedStudents = updatedStudents.map(s => {
                if (s.id === lesson.studentId) {
                  const currentLast = s.lastLessonDate ? new Date(s.lastLessonDate) : new Date(0);
                  const thisLessonDate = new Date(lesson.date);
                  if (thisLessonDate > currentLast) {
                    return { ...s, lastLessonDate: lesson.date };
                  }
                }
                return s;
              });
            }
          }
        });
        
        if (changesMade) {
          return { lessons: updatedLessons, students: updatedStudents };
        }
        return state;
      }),
      
      addStudent: (student) => set((state) => ({
        students: [student, ...state.students]
      })),
      
      updateStudent: (studentId, updates) => set((state) => ({
        students: state.students.map(s => 
          s.id === studentId ? { ...s, ...updates } : s
        )
      })),
      
      removeStudent: (studentId) => set((state) => {
        // Also cancel all lessons for this student
        const updatedLessons = state.lessons.map(lesson => 
          lesson.studentId === studentId && lesson.status !== 'cancelled'
            ? { ...lesson, status: 'cancelled' as const }
            : lesson
        );
        
        return {
          students: state.students.filter(s => s.id !== studentId),
          lessons: updatedLessons
        };
      }),
      
      getStudentByContact: (contact) => {
        return get().students.find(s => s.contact === contact);
      },

      // Student Notes actions
      addStudentNote: (note) => set((state) => {
        const newNote: StudentNote = {
          ...note,
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };

        return {
          studentNotes: [newNote, ...state.studentNotes],
        };
      }),

      updateStudentNote: (noteId, content) => set((state) => ({
        studentNotes: state.studentNotes.map((note) =>
          note.id === noteId
            ? { ...note, content, updatedAt: new Date().toISOString() }
            : note
        ),
      })),

      deleteStudentNote: (noteId) => set((state) => ({
        studentNotes: state.studentNotes.filter((note) => note.id !== noteId),
      })),

      getStudentNotes: (studentId) => {
        const state = get();
        return state.studentNotes
          .filter((note) => note.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getStudentNotesGroupedByDate: (studentId) => {
        const state = get();
        const notes = state.studentNotes
          .filter((note) => note.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const grouped: Record<string, StudentNote[]> = {};

        notes.forEach((note) => {
          const date = note.createdAt.split('T')[0]; // Get YYYY-MM-DD
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(note);
        });

        return grouped;
      },

      searchStudentNotes: (studentId, query) => {
        const state = get();
        const lowerQuery = query.toLowerCase();

        return state.studentNotes
          .filter((note) =>
            note.studentId === studentId &&
            (note.content.toLowerCase().includes(lowerQuery) ||
              note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      // Location actions
      addArea: (area) => set((state) => ({
        areas: [...state.areas, area]
      })),
      
      updateArea: (areaId, updates) => set((state) => ({
        areas: state.areas.map(a => a.id === areaId ? { ...a, ...updates } : a)
      })),
      
      deleteArea: (areaId) => set((state) => ({
        areas: state.areas.filter(a => a.id !== areaId),
        facilities: state.facilities.filter(f => f.areaId !== areaId),
        courts: state.courts.filter(c => state.facilities.find(f => f.id === c.facilityId)?.areaId !== areaId)
      })),
      
      addFacility: (facility) => set((state) => ({
        facilities: [...state.facilities, facility]
      })),
      
      updateFacility: (facilityId, updates) => set((state) => ({
        facilities: state.facilities.map(f => f.id === facilityId ? { ...f, ...updates } : f)
      })),
      
      deleteFacility: (facilityId) => set((state) => ({
        facilities: state.facilities.filter(f => f.id !== facilityId),
        courts: state.courts.filter(c => c.facilityId !== facilityId)
      })),
      
      addCourt: (court) => set((state) => ({
        courts: [...state.courts, court]
      })),
      
      updateCourt: (courtId, updates) => set((state) => ({
        courts: state.courts.map(c => c.id === courtId ? { ...c, ...updates } : c)
      })),
      
      deleteCourt: (courtId) => set((state) => ({
        courts: state.courts.filter(c => c.id !== courtId)
      })),
      
      // Availability actions
      addAvailabilityRange: (range) => set((state) => ({
        availabilityRanges: [...state.availabilityRanges, range]
      })),
      
      updateAvailabilityRange: (rangeId, updates) => set((state) => ({
        availabilityRanges: state.availabilityRanges.map(r => 
          r.id === rangeId ? { ...r, ...updates } : r
        )
      })),
      
      deleteAvailabilityRange: (rangeId) => set((state) => ({
        availabilityRanges: state.availabilityRanges.filter(r => r.id !== rangeId)
      })),
      
      // Blackout date actions
      addBlackoutDate: (blackout) => set((state) => ({
        blackoutDates: [...state.blackoutDates, blackout]
      })),
      
      removeBlackoutDate: (blackoutId) => set((state) => ({
        blackoutDates: state.blackoutDates.filter(b => b.id !== blackoutId)
      })),
      
      getTodaysLessons: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().lessons
          .filter(l => l.date === today && l.status !== 'cancelled')
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },
      
      getUpcomingLessons: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().lessons
          .filter(l => l.date >= today && l.status !== 'cancelled')
          .sort((a, b) => {
            if (a.date === b.date) {
              return a.startTime.localeCompare(b.startTime);
            }
            return a.date.localeCompare(b.date);
          });
      },
      
      getPendingRequests: () => {
        return get().bookingRequests
          .filter(r => r.status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getStudentLessons: (studentId) => {
        return get().lessons
          .filter(l => l.studentId === studentId)
          .sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime());
      },
      
      recalculateStudentTotals: () => set((state) => {
        // Recalculate all student totals from scratch based on non-cancelled lessons
        const updatedStudents = state.students.map(student => {
          const studentLessons = state.lessons.filter(
            l => l.studentId === student.id && l.status !== 'cancelled'
          );
          
          const totalLessons = studentLessons.length;
          const totalSpent = studentLessons.reduce((sum, l) => sum + l.price, 0);
          const unpaidAmount = studentLessons
            .filter(l => !l.isPaid)
            .reduce((sum, l) => sum + l.price, 0);
          
          // Find the most recent lesson date
          const completedLessons = studentLessons.filter(l => l.status === 'completed');
          const lastLessonDate = completedLessons.length > 0
            ? completedLessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : student.lastLessonDate;
          
          return {
            ...student,
            totalLessons,
            totalSpent,
            balance: unpaidAmount,
            lastLessonDate
          };
        });
        
        return { students: updatedStudents };
      }),
      
      checkDataIntegrity: () => {
        const state = get();
        const studentIssues: Array<{studentId: string, issue: string}> = [];
        const lessonIssues: Array<{lessonId: string, issue: string}> = [];
        
        // Check each student
        state.students.forEach(student => {
          const studentLessons = state.lessons.filter(
            l => l.studentId === student.id && l.status !== 'cancelled'
          );
          
          const actualTotalLessons = studentLessons.length;
          const actualTotalSpent = studentLessons.reduce((sum, l) => sum + l.price, 0);
          const actualBalance = studentLessons
            .filter(l => !l.isPaid)
            .reduce((sum, l) => sum + l.price, 0);
          
          if (student.totalLessons !== actualTotalLessons) {
            studentIssues.push({
              studentId: student.id,
              issue: `totalLessons mismatch: stored=${student.totalLessons}, actual=${actualTotalLessons}`
            });
          }
          
          if (Math.abs(student.totalSpent - actualTotalSpent) > 0.01) {
            studentIssues.push({
              studentId: student.id,
              issue: `totalSpent mismatch: stored=${student.totalSpent}, actual=${actualTotalSpent}`
            });
          }
          
          if (Math.abs(student.balance - actualBalance) > 0.01) {
            studentIssues.push({
              studentId: student.id,
              issue: `balance mismatch: stored=${student.balance}, actual=${actualBalance}`
            });
          }
          
          if (student.totalSpent > 0 && student.totalLessons === 0) {
            studentIssues.push({
              studentId: student.id,
              issue: 'Has totalSpent > 0 but totalLessons = 0'
            });
          }
        });
        
        // Check each lesson
        state.lessons.forEach(lesson => {
          const student = state.students.find(s => s.id === lesson.studentId);
          
          if (!student) {
            lessonIssues.push({
              lessonId: lesson.id,
              issue: `Student with id ${lesson.studentId} not found in students array`
            });
          }
          
          // Check if lesson is in the past but still marked as scheduled
          const now = new Date();
          const lessonEndTime = new Date(`${lesson.date}T${lesson.endTime}:00`);
          if (lesson.status === 'scheduled' && lessonEndTime < now) {
            lessonIssues.push({
              lessonId: lesson.id,
              issue: 'Lesson ended in the past but still marked as scheduled'
            });
          }
        });
        
        return { studentIssues, lessonIssues };
      },
      
      // Location utility functions
      getAreaById: (areaId) => {
        return get().areas.find(a => a.id === areaId);
      },
      
      getFacilityById: (facilityId) => {
        return get().facilities.find(f => f.id === facilityId);
      },
      
      getCourtById: (courtId) => {
        return get().courts.find(c => c.id === courtId);
      },
      
      getFacilitiesByArea: (areaId) => {
        return get().facilities.filter(f => f.areaId === areaId);
      },
      
      getCourtsByFacility: (facilityId) => {
        return get().courts.filter(c => c.facilityId === facilityId);
      },
      
      formatLocationText: (areaId, facilityId, courtId) => {
        const state = get();
        const area = areaId ? state.areas.find(a => a.id === areaId) : null;
        const facility = facilityId ? state.facilities.find(f => f.id === facilityId) : null;
        const court = courtId ? state.courts.find(c => c.id === courtId) : null;
        
        if (!area) return '';
        
        const parts = [];
        if (facility) parts.push(facility.name);
        if (court) parts.push(court.label);
        
        const mainText = parts.length > 0 ? parts.join(' • ') : area.name;
        const areaText = parts.length > 0 ? `(${area.name})` : '';
        
        return parts.length > 0 ? `${mainText} ${areaText}` : area.name;
      },
      
      // Availability utility functions
      getAvailabilityRangesForDay: (dayOfWeek) => {
        return get().availabilityRanges.filter(r => r.dayOfWeek === dayOfWeek);
      },
      
      generateSlotsForNext14Days: () => {
        const state = get();
        const slots: Array<{date: string, time: string, range: AvailabilityRange}> = [];
        const today = new Date();
        
        for (let i = 0; i < 14; i++) {
          // Use date-fns addDays for DST-safe date calculation
          const date = addDays(today, i);
          const dayOfWeek = date.getDay();
          const dateString = format(date, 'yyyy-MM-dd');
          
          // Skip if this date is blacked out
          const isBlackedOut = state.blackoutDates.some(b => b.date === dateString);
          if (isBlackedOut) continue;
          
          // Get availability ranges for this day
          const ranges = state.availabilityRanges.filter(r => r.dayOfWeek === dayOfWeek);
          
          ranges.forEach(range => {
            // Generate hourly slots from range
            const startHour = parseInt(range.startTime.split(':')[0]);
            const endHour = parseInt(range.endTime.split(':')[0]);
            
            for (let hour = startHour; hour < endHour; hour++) {
              const time = `${hour.toString().padStart(2, '0')}:00`;
              slots.push({
                date: dateString,
                time,
                range
              });
            }
          });
        }
        
        return slots;
      },
      
      validateRangeOverlap: (newRange, excludeId) => {
        const state = get();
        
        // Find ranges on the same day of week (excluding the one being edited)
        // Coach can only be in one place at a time, so any time overlap = conflict
        const sameDayRanges = state.availabilityRanges.filter(r => 
          r.id !== excludeId && r.dayOfWeek === newRange.dayOfWeek
        );
        
        // Parse new range times
        const newStart = new Date(`1970-01-01T${newRange.startTime}:00`);
        const newEnd = new Date(`1970-01-01T${newRange.endTime}:00`);
        
        // Check for time overlap with ANY range on same day
        // Since coach can only be in one place at a time, any overlap is a conflict
        return sameDayRanges.some(range => {
          const existingStart = new Date(`1970-01-01T${range.startTime}:00`);
          const existingEnd = new Date(`1970-01-01T${range.endTime}:00`);
          
          // Check time overlap: ranges conflict if they overlap in time
          const hasTimeOverlap = (newStart < existingEnd && newEnd > existingStart);
          
          return hasTimeOverlap;
        });
      },
      
      migrateExistingData: async () => {
        const state = get();

        // IMPORTANT: UUID Migration - Clear old data with non-UUID IDs
        // If the coach ID is not a valid UUID (like "coach_1"), clear all data and reload
        if (state.coach && state.coach.id && !state.coach.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log('🔄 Migrating to UUID format - clearing old data...');

          // Clear AsyncStorage to remove persisted old data
          try {
            await AsyncStorage.clear();
            console.log('✅ AsyncStorage cleared');
          } catch (error) {
            console.warn('⚠️ Could not clear AsyncStorage:', error);
          }

          set({
            coach: null,
            students: [],
            lessons: [],
            bookingRequests: [],
            studentNotes: [],
            areas: [],
            facilities: [],
            courts: [],
            availabilityRanges: [],
            blackoutDates: [],
          });
          return; // Exit early, useMockData will reload fresh data
        }

        // Create default "General" area if no areas exist
        if (state.areas.length === 0 && state.coach) {
          const generalArea: Area = {
            id: '550e8400-e29b-41d4-a716-446655440009',
            coachId: state.coach.id,
            name: 'General'
          };

          set(currentState => ({
            areas: [generalArea, ...currentState.areas]
          }));
        }

        // Backfill existing availability and bookings with default area
        const generalAreaId = '550e8400-e29b-41d4-a716-446655440009';

        // Update coach availability
        if (state.coach && state.coach.availability) {
          const updatedAvailability = { ...state.coach.availability };
          Object.keys(updatedAvailability).forEach(day => {
            updatedAvailability[day] = updatedAvailability[day].map(slot => ({
              ...slot,
              areaId: slot.areaId || generalAreaId
            }));
          });

          set(currentState => ({
            coach: currentState.coach ? {
              ...currentState.coach,
              availability: updatedAvailability
            } : null
          }));
        }

        // Update existing lessons
        set(currentState => ({
          lessons: currentState.lessons.map(lesson => ({
            ...lesson,
            areaId: lesson.areaId || generalAreaId
          }))
        }));
        
        // Update existing booking requests
        set(currentState => ({
          bookingRequests: currentState.bookingRequests.map(request => ({
            ...request,
            areaId: request.areaId || generalAreaId
          }))
        }));
      },
      
      forceUpdateLessonsWithLocations: () => {
        const todayStr = new Date().toISOString().split('T')[0];

        set(currentState => ({
          lessons: currentState.lessons.map((lesson, index) => {
            // Update today's lessons with specific locations
            if (lesson.date === todayStr) {
              switch (index) {
                case 0:
                  return {
                    ...lesson,
                    areaId: '550e8400-e29b-41d4-a716-446655440010',
                    facilityId: '550e8400-e29b-41d4-a716-446655440020',
                    courtId: '550e8400-e29b-41d4-a716-446655440030'
                  };
                case 1:
                  return {
                    ...lesson,
                    areaId: '550e8400-e29b-41d4-a716-446655440011',
                    facilityId: '550e8400-e29b-41d4-a716-446655440021',
                    courtId: '550e8400-e29b-41d4-a716-446655440033'
                  };
                case 2:
                  return {
                    ...lesson,
                    areaId: '550e8400-e29b-41d4-a716-446655440010',
                    facilityId: '550e8400-e29b-41d4-a716-446655440022',
                    courtId: '550e8400-e29b-41d4-a716-446655440032'
                  };
                default:
                  return {
                    ...lesson,
                    areaId: lesson.areaId || '550e8400-e29b-41d4-a716-446655440009'
                  };
              }
            }
            return {
              ...lesson,
              areaId: lesson.areaId || '550e8400-e29b-41d4-a716-446655440009'
            };
          })
        }));
      },
      
      normalizeAvailabilityRanges: () => {
        set((state) => ({
          availabilityRanges: state.availabilityRanges.map(range => ({
            ...range,
            facilityId: (range.facilityId && range.facilityId.trim() !== '') 
              ? range.facilityId 
              : undefined,
            courtId: (range.courtId && range.courtId.trim() !== '') 
              ? range.courtId 
              : undefined,
          }))
        }));
      },
      
      clearAllData: () => set(() => ({
        coach: null,
        bookingRequests: [],
        lessons: [],
        students: [],
        studentNotes: [],
        areas: [],
        facilities: [],
        courts: [],
        availabilityRanges: [],
        blackoutDates: []
      }))
    }),
    {
      name: 'coach-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        coach: state.coach,
        bookingRequests: state.bookingRequests,
        lessons: state.lessons,
        students: state.students,
        studentNotes: state.studentNotes,
        areas: state.areas,
        facilities: state.facilities,
        courts: state.courts,
        availabilityRanges: state.availabilityRanges,
        blackoutDates: state.blackoutDates
      })
    }
  )
);

// Utility function
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}
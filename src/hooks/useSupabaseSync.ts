/*
Hook to automatically sync Zustand store with Supabase
This runs in the background and keeps your data synced
*/
import { useEffect, useRef } from "react";
import { useCoachStore } from "../state/coachStore";
import { loadCoachDataFromSupabase } from "../services/supabaseSync";
import { getSupabaseClient } from "../api/supabase";
import {
  saveCoachToSupabase,
  saveStudentToSupabase,
  saveLessonToSupabase,
  saveBookingRequestToSupabase,
  saveStudentNoteToSupabase,
  saveAreaToSupabase,
  saveFacilityToSupabase,
  saveCourtToSupabase,
  saveAvailabilityRangeToSupabase,
  saveBlackoutDateToSupabase,
  deleteFromSupabase,
} from "../services/supabaseSync";
import type {
  Student,
  Lesson,
  BookingRequest,
  StudentNote,
  Area,
  Facility,
  Court,
  AvailabilityRange,
  BlackoutDate,
} from "../types/coach";

let isInitialized = false;

// Define the state type for the subscription
interface SyncState {
  students: Student[];
  lessons: Lesson[];
  bookingRequests: BookingRequest[];
  studentNotes: StudentNote[];
  areas: Area[];
  facilities: Facility[];
  courts: Court[];
  availabilityRanges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];
}

/**
 * Hook to sync Zustand store with Supabase
 * Call this once in your App component
 */
export const useSupabaseSync = () => {
  const coach = useCoachStore((state) => state.coach);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from Supabase on mount (if coach exists)
  useEffect(() => {
    if (!coach?.id || isInitialized) return;

    // Validate that coach ID is a proper UUID before syncing
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coach.id);
    if (!isValidUUID) {
      if (__DEV__) {
        console.warn("⚠️ Skipping Supabase sync - coach ID is not a valid UUID:", coach.id);
      }
      isInitialized = true; // Mark as initialized to prevent retries
      return;
    }

    const loadData = async () => {
      try {
        // Check if Supabase is configured
        const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
        const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          if (__DEV__) {
            console.log("ℹ️ Supabase not configured - app will work with local storage only");
          }
          return;
        }

        console.log("🔄 Loading data from Supabase...");
        const data = await loadCoachDataFromSupabase(coach.id);

        // Update store with loaded data
        useCoachStore.setState({
          students: data.students,
          lessons: data.lessons,
          bookingRequests: data.bookingRequests,
          studentNotes: data.studentNotes,
          areas: data.areas,
          facilities: data.facilities,
          courts: data.courts,
          availabilityRanges: data.availabilityRanges,
          blackoutDates: data.blackoutDates,
        });

        // Update coach if it exists in database
        if (data.coach) {
          useCoachStore.setState({ coach: data.coach });
        } else {
          // Save current coach to database if it doesn't exist
          await saveCoachToSupabase(coach);
        }

        console.log("✅ Data loaded from Supabase");
        isInitialized = true;
      } catch (error) {
        // Don't break the app if Supabase fails - just log and continue
        if (__DEV__) {
          console.warn("⚠️ Could not load data from Supabase (app will continue with local data):", error);
        }
        isInitialized = true; // Mark as initialized so we don't keep retrying
      }
    };

    loadData();
  }, [coach?.id]);

  // Auto-save coach when it changes
  useEffect(() => {
    if (!coach?.id) return;

    // Validate that coach ID is a proper UUID before saving
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coach.id);
    if (!isValidUUID) {
      if (__DEV__) {
        console.warn("⚠️ Skipping save - coach ID is not a valid UUID:", coach.id);
      }
      return;
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    // Debounce saves to avoid too many API calls
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await saveCoachToSupabase(coach, coach.version);
        if (result.conflict) {
          // Version conflict - reload data from server to get latest version
          if (__DEV__) {
            console.warn("Version conflict detected, reloading coach data from server");
          }
          const data = await loadCoachDataFromSupabase(coach.id);
          if (data.coach) {
            useCoachStore.setState({ coach: data.coach });
          }
        } else if (!result.success && result.error) {
          if (__DEV__) {
            console.warn("Could not save coach to Supabase:", result.error);
          }
        }
      } catch (error) {
        // Silently fail - don't break the app
        if (__DEV__) {
          console.warn("Could not save coach to Supabase:", error);
        }
      }
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [coach]);

  // Subscribe to store changes and sync to Supabase
  useEffect(() => {
    if (!coach?.id) return;

    // Check if Supabase is configured
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    // Keep track of previous state for comparison
    let prevState: SyncState = {
      students: [],
      lessons: [],
      bookingRequests: [],
      studentNotes: [],
      areas: [],
      facilities: [],
      courts: [],
      availabilityRanges: [],
      blackoutDates: [],
    };

    const unsubscribe = useCoachStore.subscribe(
      (state) => {
        const newState: SyncState = {
          students: state.students,
          lessons: state.lessons,
          bookingRequests: state.bookingRequests,
          studentNotes: state.studentNotes,
          areas: state.areas,
          facilities: state.facilities,
          courts: state.courts,
          availabilityRanges: state.availabilityRanges,
          blackoutDates: state.blackoutDates,
        };

        // Debounce sync operations
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(async () => {
          try {
            // Sync students
            if (newState.students !== prevState.students) {
              const newStudents = newState.students.filter(
                (s) => !prevState.students.find((p: Student) => p.id === s.id)
              );
              const updatedStudents = newState.students.filter((s) => {
                const prev = prevState.students.find((p: Student) => p.id === s.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(s);
              });

              for (const student of [...newStudents, ...updatedStudents]) {
                const result = await saveStudentToSupabase(student, student.version);
                if (result.conflict && __DEV__) {
                  console.warn("Version conflict saving student:", student.id);
                }
              }
            }

            // Sync lessons
            if (newState.lessons !== prevState.lessons) {
              const newLessons = newState.lessons.filter(
                (l) => !prevState.lessons.find((p: Lesson) => p.id === l.id)
              );
              const updatedLessons = newState.lessons.filter((l) => {
                const prev = prevState.lessons.find((p: Lesson) => p.id === l.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(l);
              });

              for (const lesson of [...newLessons, ...updatedLessons]) {
                const result = await saveLessonToSupabase(lesson, lesson.version);
                if (result.conflict && __DEV__) {
                  console.warn("Version conflict saving lesson:", lesson.id);
                }
              }
            }

            // Sync booking requests
            if (newState.bookingRequests !== prevState.bookingRequests) {
              const newRequests = newState.bookingRequests.filter(
                (r) => !prevState.bookingRequests.find((p: BookingRequest) => p.id === r.id)
              );
              const updatedRequests = newState.bookingRequests.filter((r) => {
                const prev = prevState.bookingRequests.find((p: BookingRequest) => p.id === r.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(r);
              });

              for (const request of [...newRequests, ...updatedRequests]) {
                const result = await saveBookingRequestToSupabase(request, request.version);
                if (result.conflict && __DEV__) {
                  console.warn("Version conflict saving booking request:", request.id);
                }
              }
            }

            // Sync student notes
            if (newState.studentNotes !== prevState.studentNotes) {
              const newNotes = newState.studentNotes.filter(
                (n) => !prevState.studentNotes.find((p: StudentNote) => p.id === n.id)
              );
              const updatedNotes = newState.studentNotes.filter((n) => {
                const prev = prevState.studentNotes.find((p: StudentNote) => p.id === n.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(n);
              });

              for (const note of [...newNotes, ...updatedNotes]) {
                const result = await saveStudentNoteToSupabase(note, note.version);
                if (result.conflict && __DEV__) {
                  console.warn("Version conflict saving student note:", note.id);
                }
              }
            }

            // Sync areas
            if (newState.areas !== prevState.areas) {
              // Find new and updated areas
              const newAreas = newState.areas.filter(
                (a) => !prevState.areas.find((p: Area) => p.id === a.id)
              );
              const updatedAreas = newState.areas.filter((a) => {
                const prev = prevState.areas.find((p: Area) => p.id === a.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(a);
              });

              // Save new and updated areas
              for (const area of [...newAreas, ...updatedAreas]) {
                await saveAreaToSupabase(area);
              }

              // Find and delete removed areas
              const deletedAreas = prevState.areas.filter(
                (p) => !newState.areas.find((a: Area) => a.id === p.id)
              );
              for (const area of deletedAreas) {
                await deleteFromSupabase("areas", area.id);
              }
            }

            // Sync facilities
            if (newState.facilities !== prevState.facilities) {
              // Find new and updated facilities
              const newFacilities = newState.facilities.filter(
                (f) => !prevState.facilities.find((p: Facility) => p.id === f.id)
              );
              const updatedFacilities = newState.facilities.filter((f) => {
                const prev = prevState.facilities.find((p: Facility) => p.id === f.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(f);
              });

              // Save new and updated facilities
              for (const facility of [...newFacilities, ...updatedFacilities]) {
                await saveFacilityToSupabase(facility);
              }

              // Find and delete removed facilities
              const deletedFacilities = prevState.facilities.filter(
                (p) => !newState.facilities.find((f: Facility) => f.id === p.id)
              );
              for (const facility of deletedFacilities) {
                await deleteFromSupabase("facilities", facility.id);
              }
            }

            // Sync courts
            if (newState.courts !== prevState.courts) {
              // Find new and updated courts
              const newCourts = newState.courts.filter(
                (c) => !prevState.courts.find((p: Court) => p.id === c.id)
              );
              const updatedCourts = newState.courts.filter((c) => {
                const prev = prevState.courts.find((p: Court) => p.id === c.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(c);
              });

              // Save new and updated courts
              for (const court of [...newCourts, ...updatedCourts]) {
                await saveCourtToSupabase(court);
              }

              // Find and delete removed courts
              const deletedCourts = prevState.courts.filter(
                (p) => !newState.courts.find((c: Court) => c.id === p.id)
              );
              for (const court of deletedCourts) {
                await deleteFromSupabase("courts", court.id);
              }
            }

            // Sync availability ranges
            if (newState.availabilityRanges !== prevState.availabilityRanges) {
              // Find new and updated ranges
              const newRanges = newState.availabilityRanges.filter(
                (r) => !prevState.availabilityRanges.find((p: AvailabilityRange) => p.id === r.id)
              );
              const updatedRanges = newState.availabilityRanges.filter((r) => {
                const prev = prevState.availabilityRanges.find((p: AvailabilityRange) => p.id === r.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(r);
              });

              // Save new and updated ranges
              for (const range of [...newRanges, ...updatedRanges]) {
                await saveAvailabilityRangeToSupabase(range);
              }

              // Find and delete removed ranges
              const deletedRanges = prevState.availabilityRanges.filter(
                (p) => !newState.availabilityRanges.find((r: AvailabilityRange) => r.id === p.id)
              );
              for (const range of deletedRanges) {
                await deleteFromSupabase("availability_ranges", range.id);
              }
            }

            // Sync blackout dates
            if (newState.blackoutDates !== prevState.blackoutDates) {
              // Find new and updated blackout dates
              const newBlackouts = newState.blackoutDates.filter(
                (b) => !prevState.blackoutDates.find((p: BlackoutDate) => p.id === b.id)
              );
              const updatedBlackouts = newState.blackoutDates.filter((b) => {
                const prev = prevState.blackoutDates.find((p: BlackoutDate) => p.id === b.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(b);
              });

              // Save new and updated blackout dates
              for (const blackout of [...newBlackouts, ...updatedBlackouts]) {
                await saveBlackoutDateToSupabase(blackout);
              }

              // Find and delete removed blackout dates
              const deletedBlackouts = prevState.blackoutDates.filter(
                (p) => !newState.blackoutDates.find((b: BlackoutDate) => b.id === p.id)
              );
              for (const blackout of deletedBlackouts) {
                await deleteFromSupabase("blackout_dates", blackout.id);
              }
            }

            // Update prevState for next comparison
            prevState = newState;
          } catch (error) {
            console.error("Error syncing to Supabase:", error);
          }
        }, 2000); // Wait 2 seconds before syncing to batch changes
      }
    );

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [coach?.id]);

  // Real-time subscription: new booking requests arrive instantly
  useEffect(() => {
    if (!coach?.id) return;
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`booking_requests:${coach.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_requests',
          filter: `coach_id=eq.${coach.id}`,
        },
        (payload) => {
          const row = payload.new as BookingRequest & { coach_id?: string; student_name?: string; student_contact?: string; requested_date?: string; requested_time?: string; created_at?: string };
          // Normalise snake_case → camelCase
          const request: BookingRequest = {
            id: row.id,
            coachId: row.coachId ?? row.coach_id ?? coach.id,
            studentName: row.studentName ?? row.student_name ?? '',
            studentContact: row.studentContact ?? row.student_contact ?? '',
            requestedDate: row.requestedDate ?? row.requested_date ?? '',
            requestedTime: row.requestedTime ?? row.requested_time ?? '',
            duration: row.duration ?? 60,
            note: row.note,
            status: row.status ?? 'pending',
            createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
            areaId: row.areaId,
            facilityId: row.facilityId,
            courtId: row.courtId,
          };
          const existing = useCoachStore.getState().bookingRequests;
          if (!existing.find(r => r.id === request.id)) {
            useCoachStore.setState({ bookingRequests: [request, ...existing] });
            if (__DEV__) {
              console.log('📬 New booking request received via realtime:', request.studentName);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coach?.id]);
};



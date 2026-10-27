/*
Hook to automatically sync Zustand store with Supabase
This runs in the background and keeps your data synced
*/
import { useEffect, useRef, useState } from "react";
import { useCoachStore } from "../state/coachStore";
import { overlayPendingMutations } from "../state/offlineQueueLogic";
import { useOfflineQueueStore, type MutationKind } from "../state/offlineQueueStore";
import { isSupabaseConfigured } from "../utils/supabaseConfig";
import { getSupabaseClient } from "../api/supabase";
import {
  loadCoachDataFromSupabase,
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

type SaveResult = { success: boolean; error?: string; conflict?: boolean };

const EMPTY_SYNC_STATE: SyncState = {
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

const snapshotSyncState = (state: SyncState): SyncState => ({
  students: state.students,
  lessons: state.lessons,
  bookingRequests: state.bookingRequests,
  studentNotes: state.studentNotes,
  areas: state.areas,
  facilities: state.facilities,
  courts: state.courts,
  availabilityRanges: state.availabilityRanges,
  blackoutDates: state.blackoutDates,
});

// Saves a single entity live; on failure (network down, request error, or a
// thrown exception) it queues the write in the offline outbox instead of
// dropping it, so useOfflineQueueProcessor can retry it later. A version
// conflict is not queued - the row already moved on server-side, so
// replaying this stale write would never succeed.
async function syncUpsert<T extends { id: string }>(
  kind: MutationKind,
  entity: T,
  expectedVersion: number | undefined,
  saveFn: (entity: T, expectedVersion?: number) => Promise<SaveResult>
): Promise<void> {
  try {
    const result = await saveFn(entity, expectedVersion);
    if (result.conflict) {
      if (__DEV__) {
        console.warn(`Version conflict saving ${kind}:`, entity.id);
      }
      return;
    }
    if (result.success) {
      // This write is newer than anything queued earlier for the same row;
      // replaying the queued one later would overwrite it with stale data.
      useOfflineQueueStore.getState().removeForEntity(kind, entity.id, "upsert");
    } else {
      useOfflineQueueStore.getState().enqueue({
        kind,
        operation: "upsert",
        entityId: entity.id,
        payload: entity,
        expectedVersion,
      });
    }
  } catch {
    useOfflineQueueStore.getState().enqueue({
      kind,
      operation: "upsert",
      entityId: entity.id,
      payload: entity,
      expectedVersion,
    });
  }
}

async function syncDelete(kind: MutationKind, table: string, id: string): Promise<void> {
  try {
    const result = await deleteFromSupabase(table, id);
    if (result.success) {
      useOfflineQueueStore.getState().removeForEntity(kind, id, "delete");
    } else if (!result.conflict) {
      useOfflineQueueStore.getState().enqueue({ kind, operation: "delete", entityId: id });
    }
  } catch {
    useOfflineQueueStore.getState().enqueue({ kind, operation: "delete", entityId: id });
  }
}

/**
 * Hook to sync Zustand store with Supabase
 * Call this once in your App component
 */
export const useSupabaseSync = () => {
  const coach = useCoachStore((state) => state.coach);
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedCoachIdRef = useRef<string | null>(null);
  // What the server is known to hold. Change detection compares against this,
  // so data just loaded from the server is never mistaken for new local work
  // and re-uploaded.
  const syncedStateRef = useRef<SyncState | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    if (!supabaseReady) {
      if (__DEV__) {
        console.log("ℹ️ Supabase not configured - app will work with local storage only");
      }
      useCoachStore.setState({ isInitialSyncComplete: true });
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setAuthUserId(data.user?.id ?? null);
    }).catch(() => {
      setAuthUserId(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
      loadedCoachIdRef.current = null;
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode, supabaseReady]);

  // Load data from Supabase for the authenticated user. On a fresh install,
  // coach is null, so auth.uid() is the only reliable profile lookup key.
  useEffect(() => {
    if (isDemoMode || !supabaseReady) return;

    const coachId = coach?.id || authUserId;
    if (!coachId || loadedCoachIdRef.current === coachId) return;

    // Validate that coach ID is a proper UUID before syncing
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId);
    if (!isValidUUID) {
      if (__DEV__) {
        console.warn("⚠️ Skipping Supabase sync - coach ID is not a valid UUID:", coachId);
      }
      loadedCoachIdRef.current = coachId;
      useCoachStore.setState({ isInitialSyncComplete: true });
      return;
    }

    const loadData = async () => {
      try {
        console.log("🔄 Loading data from Supabase...");
        const data = await loadCoachDataFromSupabase(coachId);

        // Update store with loaded data, keeping changes still waiting in the
        // offline outbox (they upload on the next retry, so must stay visible).
        const pending = useOfflineQueueStore.getState().queue;
        useCoachStore.setState({
          students: overlayPendingMutations(data.students, pending, "student"),
          lessons: overlayPendingMutations(data.lessons, pending, "lesson"),
          bookingRequests: overlayPendingMutations(data.bookingRequests, pending, "bookingRequest"),
          studentNotes: overlayPendingMutations(data.studentNotes, pending, "studentNote"),
          areas: overlayPendingMutations(data.areas, pending, "area"),
          facilities: overlayPendingMutations(data.facilities, pending, "facility"),
          courts: overlayPendingMutations(data.courts, pending, "court"),
          availabilityRanges: overlayPendingMutations(data.availabilityRanges, pending, "availabilityRange"),
          blackoutDates: overlayPendingMutations(data.blackoutDates, pending, "blackoutDate"),
        });
        // From here on only changes made after this point are uploaded.
        syncedStateRef.current = snapshotSyncState(useCoachStore.getState());

        // Update coach if it exists in database
        if (data.coach) {
          useCoachStore.setState({ coach: data.coach });
        } else if (coach) {
          // Save current coach to database if it doesn't exist
          await saveCoachToSupabase(coach);
        }

        console.log("✅ Data loaded from Supabase");
        loadedCoachIdRef.current = coachId;
      } catch (error) {
        // Don't break the app if Supabase fails - just log and continue
        if (__DEV__) {
          console.warn("⚠️ Could not load data from Supabase (app will continue with local data):", error);
        }
        loadedCoachIdRef.current = coachId;
      } finally {
        useCoachStore.setState({ isInitialSyncComplete: true });
      }
    };

    loadData();
  }, [authUserId, coach, coach?.id, isDemoMode, supabaseReady]);

  // Auto-save coach when it changes
  useEffect(() => {
    if (isDemoMode || !coach?.id) return;

    // Validate that coach ID is a proper UUID before saving
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coach.id);
    if (!isValidUUID) {
      if (__DEV__) {
        console.warn("⚠️ Skipping save - coach ID is not a valid UUID:", coach.id);
      }
      return;
    }

    if (!isSupabaseConfigured()) return;

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
        } else if (result.success) {
          useOfflineQueueStore.getState().removeForEntity("coach", coach.id, "upsert");
        } else {
          if (__DEV__) {
            console.warn("Could not save coach to Supabase:", result.error);
          }
          useOfflineQueueStore.getState().enqueue({
            kind: "coach",
            operation: "upsert",
            entityId: coach.id,
            payload: coach,
            expectedVersion: coach.version,
          });
        }
      } catch (error) {
        // Don't break the app - queue it for retry instead
        if (__DEV__) {
          console.warn("Could not save coach to Supabase:", error);
        }
        useOfflineQueueStore.getState().enqueue({
          kind: "coach",
          operation: "upsert",
          entityId: coach.id,
          payload: coach,
          expectedVersion: coach.version,
        });
      }
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [coach, isDemoMode]);

  // Subscribe to store changes and sync to Supabase
  useEffect(() => {
    if (isDemoMode || !coach?.id) return;

    if (!isSupabaseConfigured()) return;

    // Compare against what the server is known to hold: whatever was last
    // loaded or uploaded. If nothing has been loaded yet the baseline is empty,
    // so everything local is uploaded (safe: writes are upserts). It must never
    // start from the current local state, or rows created locally before sync
    // starts (a new coach's default court, say) would never reach the server.
    let prevState: SyncState = syncedStateRef.current ?? EMPTY_SYNC_STATE;

    const unsubscribe = useCoachStore.subscribe(
      () => {
        // Debounce sync operations
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(async () => {
          // Read the live state when the timer fires (not when it was set) and
          // re-read the baseline, which a server load may have just replaced.
          const newState = snapshotSyncState(useCoachStore.getState());
          prevState = syncedStateRef.current ?? prevState;

          // Each entity type is synced independently - syncUpsert/syncDelete
          // never throw, so one entity type failing (e.g. offline) can't
          // block the rest of the batch, and the failure is queued for
          // retry instead of silently dropped.
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
                await syncUpsert("student", student, student.version, saveStudentToSupabase);
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
                await syncUpsert("lesson", lesson, lesson.version, saveLessonToSupabase);
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
                await syncUpsert("bookingRequest", request, request.version, saveBookingRequestToSupabase);
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
                await syncUpsert("studentNote", note, note.version, saveStudentNoteToSupabase);
              }
            }

            // Sync areas
            if (newState.areas !== prevState.areas) {
              const newAreas = newState.areas.filter(
                (a) => !prevState.areas.find((p: Area) => p.id === a.id)
              );
              const updatedAreas = newState.areas.filter((a) => {
                const prev = prevState.areas.find((p: Area) => p.id === a.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(a);
              });

              for (const area of [...newAreas, ...updatedAreas]) {
                await syncUpsert("area", area, undefined, saveAreaToSupabase);
              }

              const deletedAreas = prevState.areas.filter(
                (p) => !newState.areas.find((a: Area) => a.id === p.id)
              );
              for (const area of deletedAreas) {
                await syncDelete("area", "areas", area.id);
              }
            }

            // Sync facilities
            if (newState.facilities !== prevState.facilities) {
              const newFacilities = newState.facilities.filter(
                (f) => !prevState.facilities.find((p: Facility) => p.id === f.id)
              );
              const updatedFacilities = newState.facilities.filter((f) => {
                const prev = prevState.facilities.find((p: Facility) => p.id === f.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(f);
              });

              for (const facility of [...newFacilities, ...updatedFacilities]) {
                await syncUpsert("facility", facility, undefined, saveFacilityToSupabase);
              }

              const deletedFacilities = prevState.facilities.filter(
                (p) => !newState.facilities.find((f: Facility) => f.id === p.id)
              );
              for (const facility of deletedFacilities) {
                await syncDelete("facility", "facilities", facility.id);
              }
            }

            // Sync courts
            if (newState.courts !== prevState.courts) {
              const newCourts = newState.courts.filter(
                (c) => !prevState.courts.find((p: Court) => p.id === c.id)
              );
              const updatedCourts = newState.courts.filter((c) => {
                const prev = prevState.courts.find((p: Court) => p.id === c.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(c);
              });

              for (const court of [...newCourts, ...updatedCourts]) {
                await syncUpsert("court", court, undefined, saveCourtToSupabase);
              }

              const deletedCourts = prevState.courts.filter(
                (p) => !newState.courts.find((c: Court) => c.id === p.id)
              );
              for (const court of deletedCourts) {
                await syncDelete("court", "courts", court.id);
              }
            }

            // Sync availability ranges
            if (newState.availabilityRanges !== prevState.availabilityRanges) {
              const newRanges = newState.availabilityRanges.filter(
                (r) => !prevState.availabilityRanges.find((p: AvailabilityRange) => p.id === r.id)
              );
              const updatedRanges = newState.availabilityRanges.filter((r) => {
                const prev = prevState.availabilityRanges.find((p: AvailabilityRange) => p.id === r.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(r);
              });

              for (const range of [...newRanges, ...updatedRanges]) {
                await syncUpsert("availabilityRange", range, undefined, saveAvailabilityRangeToSupabase);
              }

              const deletedRanges = prevState.availabilityRanges.filter(
                (p) => !newState.availabilityRanges.find((r: AvailabilityRange) => r.id === p.id)
              );
              for (const range of deletedRanges) {
                await syncDelete("availabilityRange", "availability_ranges", range.id);
              }
            }

            // Sync blackout dates
            if (newState.blackoutDates !== prevState.blackoutDates) {
              const newBlackouts = newState.blackoutDates.filter(
                (b) => !prevState.blackoutDates.find((p: BlackoutDate) => p.id === b.id)
              );
              const updatedBlackouts = newState.blackoutDates.filter((b) => {
                const prev = prevState.blackoutDates.find((p: BlackoutDate) => p.id === b.id);
                return prev && JSON.stringify(prev) !== JSON.stringify(b);
              });

              for (const blackout of [...newBlackouts, ...updatedBlackouts]) {
                await syncUpsert("blackoutDate", blackout, undefined, saveBlackoutDateToSupabase);
              }

              const deletedBlackouts = prevState.blackoutDates.filter(
                (p) => !newState.blackoutDates.find((b: BlackoutDate) => b.id === p.id)
              );
              for (const blackout of deletedBlackouts) {
                await syncDelete("blackoutDate", "blackout_dates", blackout.id);
              }
            }

            // Update prevState for next comparison
            prevState = newState;
            syncedStateRef.current = newState;
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
      // A different coach (or demo mode) must not inherit this one's baseline.
      syncedStateRef.current = null;
    };
  }, [coach?.id, isDemoMode]);

  // Real-time subscription: new booking requests arrive instantly
  useEffect(() => {
    if (isDemoMode || !coach?.id) return;
    if (!isSupabaseConfigured()) return;

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
  }, [coach?.id, isDemoMode]);
};

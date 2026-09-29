/*
Drains the offline mutation queue (src/state/offlineQueueStore.ts) by
replaying each pending write through the existing save*ToSupabase /
deleteFromSupabase functions - the same ones used for live writes, so
encryption-free payloads, camelCase/snake_case conversion and ownership
checks all stay in one place.
*/
import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useCoachStore } from "../state/coachStore";
import { useOfflineQueueStore, type PendingMutation } from "../state/offlineQueueStore";
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

const TABLE_BY_KIND: Record<PendingMutation["kind"], string> = {
  coach: "coaches",
  student: "students",
  lesson: "lessons",
  bookingRequest: "booking_requests",
  studentNote: "student_notes",
  area: "areas",
  facility: "facilities",
  court: "courts",
  availabilityRange: "availability_ranges",
  blackoutDate: "blackout_dates",
};

type ReplayResult = { success: boolean; error?: string; conflict?: boolean };

async function replay(mutation: PendingMutation): Promise<ReplayResult> {
  if (mutation.operation === "delete") {
    return deleteFromSupabase(TABLE_BY_KIND[mutation.kind], mutation.entityId, mutation.expectedVersion);
  }

  switch (mutation.kind) {
    case "coach":
      return saveCoachToSupabase(mutation.payload, mutation.expectedVersion);
    case "student":
      return saveStudentToSupabase(mutation.payload, mutation.expectedVersion);
    case "lesson":
      return saveLessonToSupabase(mutation.payload, mutation.expectedVersion);
    case "bookingRequest":
      return saveBookingRequestToSupabase(mutation.payload, mutation.expectedVersion);
    case "studentNote":
      return saveStudentNoteToSupabase(mutation.payload, mutation.expectedVersion);
    case "area":
      return saveAreaToSupabase(mutation.payload);
    case "facility":
      return saveFacilityToSupabase(mutation.payload);
    case "court":
      return saveCourtToSupabase(mutation.payload);
    case "availabilityRange":
      return saveAvailabilityRangeToSupabase(mutation.payload);
    case "blackoutDate":
      return saveBlackoutDateToSupabase(mutation.payload);
  }
}

const RETRY_INTERVAL_MS = 30_000;

/**
 * Call once at the app root, alongside useSupabaseSync().
 */
export const useOfflineQueueProcessor = () => {
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const isProcessingRef = useRef(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseKey);

  useEffect(() => {
    if (isDemoMode || !supabaseReady) return;

    const processQueue = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const { queue, remove, recordAttemptFailure } = useOfflineQueueStore.getState();
        // Snapshot so an enqueue that happens mid-drain isn't processed twice.
        for (const mutation of queue) {
          try {
            const result = await replay(mutation);
            if (result.success || result.conflict) {
              // A conflict means the row moved on since this write was
              // queued; retrying a stale write forever isn't useful, so
              // drop it. The next live sync/load will reflect the real state.
              remove(mutation.id);
            } else {
              recordAttemptFailure(mutation.id, result.error ?? "Unknown error");
            }
          } catch (error) {
            recordAttemptFailure(
              mutation.id,
              error instanceof Error ? error.message : "Unknown error"
            );
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Drain whatever survived from a previous session, then keep retrying.
    processQueue();

    const intervalId = setInterval(processQueue, RETRY_INTERVAL_MS);
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        processQueue();
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribeNetInfo();
    };
  }, [isDemoMode, supabaseReady]);
};

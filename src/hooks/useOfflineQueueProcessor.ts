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
import { SYNC } from "../config/appSettings";
import { isSupabaseConfigured } from "../utils/supabaseConfig";
import { deleteFromSupabase } from "../services/supabaseSync";
import { entityForKind } from "../services/syncRegistry";
import type { SaveResult } from "../services/syncTypes";

async function replay(mutation: PendingMutation): Promise<SaveResult> {
  const entity = entityForKind(mutation.kind);
  if (mutation.operation === "delete") {
    return deleteFromSupabase(entity.table, mutation.entityId, mutation.expectedVersion);
  }
  return entity.save(mutation.payload, mutation.expectedVersion);
}

/**
 * Call once at the app root, alongside useSupabaseSync().
 */
export const useOfflineQueueProcessor = () => {
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const isProcessingRef = useRef(false);

  const supabaseReady = isSupabaseConfigured();

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

    const intervalId = setInterval(processQueue, SYNC.retryIntervalMs);
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

/*
Watches the store and uploads what changed. Edits are batched for a moment;
uploads never overlap (a change made mid-upload triggers one more pass), and
the baseline only moves forward once a pass has finished.
*/
import { useEffect, useRef, type MutableRefObject } from "react";
import { SYNC } from "../../config/appSettings";
import { deleteFromSupabase } from "../../services/supabaseSync";
import { EMPTY_SYNC_STATE, pickSyncState, uploadChanges } from "../../services/syncEngine";
import { SYNCED_ENTITIES } from "../../services/syncRegistry";
import type { SyncState } from "../../services/syncTypes";
import { useCoachStore } from "../../state/coachStore";
import { useOfflineQueueStore } from "../../state/offlineQueueStore";
import { isSupabaseConfigured } from "../../utils/supabaseConfig";

export function useDataUpload(syncedStateRef: MutableRefObject<SyncState | null>) {
  const coachId = useCoachStore((state) => state.coach?.id);
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDemoMode || !coachId || !isSupabaseConfigured()) return;

    let uploading = false;
    let changedDuringUpload = false;

    const uploadPass = async () => {
      if (uploading) {
        changedDuringUpload = true;
        return;
      }
      uploading = true;
      try {
        do {
          changedDuringUpload = false;
          // Read the live state now (not when the timer was set); the baseline
          // may also have just been replaced by a server load.
          const next = pickSyncState(useCoachStore.getState(), SYNCED_ENTITIES);
          const previous = syncedStateRef.current ?? EMPTY_SYNC_STATE;
          await uploadChanges(previous, next, SYNCED_ENTITIES, {
            queue: useOfflineQueueStore.getState(),
            deleteRow: (table, id) => deleteFromSupabase(table, id),
          });
          syncedStateRef.current = next;
        } while (changedDuringUpload);
      } catch (error) {
        console.error("Error syncing to Supabase:", error);
      } finally {
        uploading = false;
      }
    };

    const unsubscribe = useCoachStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(uploadPass, SYNC.debounceMs);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      // A different coach (or demo mode) must not inherit this one's baseline.
      syncedStateRef.current = null;
    };
  }, [coachId, isDemoMode, syncedStateRef]);
}

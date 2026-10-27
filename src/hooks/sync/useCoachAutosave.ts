/*
Saves the coach profile shortly after it changes. A version conflict reloads
the latest copy from the server; any other failure is queued for retry.
*/
import { useEffect, useRef } from "react";
import { SYNC } from "../../config/appSettings";
import { loadCoachDataFromSupabase, saveCoachToSupabase } from "../../services/supabaseSync";
import { useCoachStore } from "../../state/coachStore";
import { useOfflineQueueStore } from "../../state/offlineQueueStore";
import { isUuid } from "../../utils/ids";
import { isSupabaseConfigured } from "../../utils/supabaseConfig";

export function useCoachAutosave() {
  const coach = useCoachStore((state) => state.coach);
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDemoMode || !coach?.id) return;

    if (!isUuid(coach.id)) {
      if (__DEV__) {
        console.warn("⚠️ Skipping save - coach ID is not a valid UUID:", coach.id);
      }
      return;
    }
    if (!isSupabaseConfigured()) return;

    const queueForRetry = () =>
      useOfflineQueueStore.getState().enqueue({
        kind: "coach",
        operation: "upsert",
        entityId: coach.id,
        payload: coach,
        expectedVersion: coach.version,
      });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const result = await saveCoachToSupabase(coach, coach.version);
        if (result.conflict) {
          const data = await loadCoachDataFromSupabase(coach.id);
          if (data.coach) useCoachStore.setState({ coach: data.coach });
        } else if (result.success) {
          useOfflineQueueStore.getState().removeForEntity("coach", coach.id, "upsert");
        } else {
          if (__DEV__) console.warn("Could not save coach to Supabase:", result.error);
          queueForRetry();
        }
      } catch (error) {
        if (__DEV__) console.warn("Could not save coach to Supabase:", error);
        queueForRetry();
      }
    }, SYNC.coachSaveDebounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [coach, isDemoMode]);
}

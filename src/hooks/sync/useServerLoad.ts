/*
Loads the signed-in coach's data from the server once per login and makes it
the baseline for change detection.
*/
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { getSupabaseClient } from "../../api/supabase";
import { loadCoachDataFromSupabase, saveCoachToSupabase } from "../../services/supabaseSync";
import { pickSyncState } from "../../services/syncEngine";
import { SYNCED_ENTITIES } from "../../services/syncRegistry";
import type { SyncState } from "../../services/syncTypes";
import { overlayPendingMutations } from "../../state/offlineQueueLogic";
import { useOfflineQueueStore } from "../../state/offlineQueueStore";
import { useCoachStore } from "../../state/coachStore";
import { isUuid } from "../../utils/ids";
import { isSupabaseConfigured } from "../../utils/supabaseConfig";

export function useServerLoad(syncedStateRef: MutableRefObject<SyncState | null>) {
  const coach = useCoachStore((state) => state.coach);
  const isDemoMode = useCoachStore((state) => state.isDemoMode);
  const loadedCoachIdRef = useRef<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const supabaseReady = isSupabaseConfigured();

  // Who is signed in; a change of user means the data must be loaded again.
  useEffect(() => {
    if (isDemoMode) return;

    if (!supabaseReady) {
      if (__DEV__) {
        console.log("ℹ️ Supabase not configured - app will work with local storage only");
      }
      useCoachStore.setState({ isInitialSyncComplete: true });
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth
      .getUser()
      .then(({ data }) => setAuthUserId(data.user?.id ?? null))
      .catch(() => setAuthUserId(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
      loadedCoachIdRef.current = null;
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode, supabaseReady]);

  // On a fresh install the coach is null, so auth.uid() is the only reliable profile lookup key.
  useEffect(() => {
    if (isDemoMode || !supabaseReady) return;

    const coachId = coach?.id || authUserId;
    if (!coachId || loadedCoachIdRef.current === coachId) return;

    if (!isUuid(coachId)) {
      if (__DEV__) {
        console.warn("⚠️ Skipping Supabase sync - coach ID is not a valid UUID:", coachId);
      }
      loadedCoachIdRef.current = coachId;
      useCoachStore.setState({ isInitialSyncComplete: true });
      return;
    }

    const loadData = async () => {
      try {
        const data = await loadCoachDataFromSupabase(coachId);

        // Keep changes still waiting in the outbox: they upload on the next
        // retry, so they must stay visible meanwhile.
        const pending = useOfflineQueueStore.getState().queue;
        const lists: Record<string, unknown> = {};
        for (const entity of SYNCED_ENTITIES) {
          if (entity.storeKey) {
            lists[entity.storeKey] = overlayPendingMutations(data[entity.storeKey] as { id: string }[], pending, entity.kind);
          }
        }
        useCoachStore.setState(lists);
        // From here on only changes made after this point are uploaded.
        syncedStateRef.current = pickSyncState(useCoachStore.getState(), SYNCED_ENTITIES);

        if (data.coach) {
          useCoachStore.setState({ coach: data.coach });
        } else if (coach) {
          // First sign-in on this server: save the profile created on this phone.
          await saveCoachToSupabase(coach);
        }
        loadedCoachIdRef.current = coachId;
      } catch (error) {
        // Never break the app because the server is unreachable: carry on with local data.
        if (__DEV__) {
          console.warn("⚠️ Could not load data from Supabase (app will continue with local data):", error);
        }
        loadedCoachIdRef.current = coachId;
      } finally {
        useCoachStore.setState({ isInitialSyncComplete: true });
      }
    };

    loadData();
  }, [authUserId, coach, coach?.id, isDemoMode, supabaseReady, syncedStateRef]);
}

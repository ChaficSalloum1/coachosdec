/*
Keeps the store and Supabase in step. Call once at the app root.
Each concern is its own hook under ./sync:
  load      - fetch the coach's data after sign-in
  autosave  - save the coach profile when it changes
  upload    - send local changes to the server (queued if it fails)
  realtime  - show new booking requests as they arrive
*/
import { useRef } from "react";
import type { SyncState } from "../services/syncTypes";
import { useBookingRealtime } from "./sync/useBookingRealtime";
import { useCoachAutosave } from "./sync/useCoachAutosave";
import { useDataUpload } from "./sync/useDataUpload";
import { useServerLoad } from "./sync/useServerLoad";

export const useSupabaseSync = () => {
  // What the server is known to hold. Change detection compares against this,
  // so data just loaded from the server is never mistaken for new local work.
  const syncedStateRef = useRef<SyncState | null>(null);

  useServerLoad(syncedStateRef);
  useCoachAutosave();
  useDataUpload(syncedStateRef);
  useBookingRealtime();
};

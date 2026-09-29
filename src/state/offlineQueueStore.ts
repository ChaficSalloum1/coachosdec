/*
Persisted outbox for Supabase writes that failed or happened while offline.
useOfflineQueueProcessor drains this by replaying entries through the same
save*ToSupabase / deleteFromSupabase functions used for live writes.
*/
import { create } from 'zustand';
import type * as ZustandMiddleware from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { applyEnqueue, applyRecordAttemptFailure, applyRemove } from './offlineQueueLogic';
import type { NewMutation, PendingMutation } from './offlineQueueLogic';

export type { MutationKind, MutationOperation, NewMutation, PendingMutation } from './offlineQueueLogic';

const { persist, createJSONStorage } = require('zustand/middleware.js') as typeof ZustandMiddleware;

interface OfflineQueueState {
  queue: PendingMutation[];
  enqueue: (mutation: NewMutation) => void;
  remove: (id: string) => void;
  recordAttemptFailure: (id: string, error: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (mutation) =>
        set((state) => ({
          queue: applyEnqueue(state.queue, mutation, uuidv4(), new Date().toISOString()),
        })),
      remove: (id) => set((state) => ({ queue: applyRemove(state.queue, id) })),
      recordAttemptFailure: (id, error) =>
        set((state) => ({ queue: applyRecordAttemptFailure(state.queue, id, error) })),
    }),
    {
      name: 'offline-mutation-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

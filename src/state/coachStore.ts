/*
The app's single store: every domain lives in its own slice under ./slices,
and persistence rules live in ./persistence. This file only wires them together.
*/
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type * as ZustandMiddleware from 'zustand/middleware';

import { isSupabaseConfigured } from '../utils/supabaseConfig';
import { migratePersistedState, partializeState, PERSIST_NAME, PERSIST_VERSION } from './persistence';
import { createCoachState, type CoachState } from './slices';

const { persist, createJSONStorage } = require('zustand/middleware.js') as typeof ZustandMiddleware;

export const useCoachStore = create<CoachState>()(
  persist(createCoachState, {
    name: PERSIST_NAME,
    storage: createJSONStorage(() => AsyncStorage),
    version: PERSIST_VERSION,
    migrate: (persisted) => migratePersistedState(persisted, isSupabaseConfigured()),
    partialize: (state) => partializeState(state, isSupabaseConfigured()),
  })
);

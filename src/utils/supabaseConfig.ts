/*
Single definition of "is a real Supabase backend configured?". App root,
navigation, the store's persistence rules and the sync hooks all need to
agree - previously each had its own copy and only some rejected the
"your_supabase..." placeholder values.
*/

export const hasSupabaseCredentials = (url?: string, key?: string): boolean =>
  Boolean(url && key && !url.includes('your_supabase') && !key.includes('your_supabase'));

// process.env.EXPO_PUBLIC_* must be read with these literal names so Expo can inline them.
export const isSupabaseConfigured = (): boolean =>
  hasSupabaseCredentials(
    process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL,
    process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY
  );

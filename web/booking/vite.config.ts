import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Supabase URL and publishable key are public by design (they ship in the
// mobile app too). Set them in the host's build environment, or leave them
// unset to reuse the production values from eas.json.
function fromEas(name: string): string | undefined {
  try {
    const eas = JSON.parse(readFileSync(resolve(__dirname, '../../eas.json'), 'utf8'));
    return eas.build?.production?.env?.[name];
  } catch {
    return undefined;
  }
}

const url = process.env.BOOKING_SUPABASE_URL ?? fromEas('EXPO_PUBLIC_VIBECODE_SUPABASE_URL');
const key = process.env.BOOKING_SUPABASE_KEY ?? fromEas('EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY');

export default defineConfig(({ command }) => {
  if (command === 'build' && (!url || !key)) {
    throw new Error('Set BOOKING_SUPABASE_URL and BOOKING_SUPABASE_KEY for the booking page build.');
  }
  return {
    root: __dirname,
    base: '/',
    publicDir: resolve(__dirname, 'public'),
    build: { outDir: resolve(__dirname, 'dist'), emptyOutDir: true },
    define: {
      __SUPABASE_URL__: JSON.stringify(url ?? ''),
      __SUPABASE_KEY__: JSON.stringify(key ?? ''),
    },
    server: { fs: { allow: [resolve(__dirname, '../..')] } },
  };
});

/**
 * Utility script to clean up invalid coach data from Supabase
 * Run this to remove coaches with non-UUID IDs like "coach_1"
 */

import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cleanupInvalidCoaches() {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not found in environment variables');
      return;
    }

    // Create a direct Supabase client (without AsyncStorage)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log('🔍 Checking for coaches with invalid UUIDs...');

    // Get all coaches
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('id, name');

    if (error) {
      console.error('❌ Error fetching coaches:', error);
      return;
    }

    if (!coaches || coaches.length === 0) {
      console.log('✅ No coaches found in database');
      return;
    }

    // Find coaches with invalid UUIDs
    type CoachRecord = { id: string; name: string };
    const invalidCoaches = (coaches as CoachRecord[]).filter(coach => !UUID_REGEX.test(coach.id));

    if (invalidCoaches.length === 0) {
      console.log('✅ All coach IDs are valid UUIDs');
      return;
    }

    console.log(`⚠️  Found ${invalidCoaches.length} coach(es) with invalid UUIDs:`);
    invalidCoaches.forEach(coach => {
      console.log(`   - ID: "${coach.id}", Name: "${coach.name}"`);
    });

    // Delete invalid coaches and their related data
    for (const coach of invalidCoaches) {
      console.log(`\n🗑️  Deleting coach "${coach.id}" and related data...`);

      // Delete in order (respecting foreign key constraints)
      const tables = [
        'student_notes',
        'lessons',
        'booking_requests',
        'students',
        'courts',
        'facilities',
        'areas',
        'blackout_dates',
        'availability_ranges',
        'coaches'
      ];

      for (const table of tables) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('coach_id', coach.id);

        if (deleteError && deleteError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          console.log(`   ⚠️  Error deleting from ${table}:`, deleteError.message);
        }
      }

      // Delete the coach itself (in case it wasn't deleted above)
      const { error: deleteCoachError } = await supabase
        .from('coaches')
        .delete()
        .eq('id', coach.id);

      if (deleteCoachError && deleteCoachError.code !== 'PGRST116') {
        console.log(`   ⚠️  Error deleting coach:`, deleteCoachError.message);
      } else {
        console.log(`   ✅ Successfully deleted coach "${coach.id}"`);
      }
    }

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupInvalidCoaches();

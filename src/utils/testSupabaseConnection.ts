/*
Test utility to verify Supabase connection and setup
Run this to check if everything is configured correctly
*/
import { getSupabaseClient } from "../api/supabase";
import { getCurrentUser } from "../services/authService";

/**
 * Test Supabase connection and configuration
 * Call this function to verify everything is set up correctly
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  errors: string[];
  details: {
    credentialsConfigured: boolean;
    connectionWorking: boolean;
    tablesExist: boolean;
    tablesChecked: string[];
  };
}> => {
  const errors: string[] = [];
  const details = {
    credentialsConfigured: false,
    connectionWorking: false,
    tablesExist: false,
    tablesChecked: [] as string[],
  };

  try {
    // Check 1: Environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      errors.push("❌ Supabase credentials not found in environment variables");
      return { success: false, errors, details };
    }

    if (supabaseUrl.includes("your_supabase") || supabaseKey.includes("your_supabase")) {
      errors.push("❌ Supabase credentials contain placeholders - replace with actual values");
      return { success: false, errors, details };
    }

    details.credentialsConfigured = true;
    console.log("✅ Supabase credentials found");

    // Check 2: Connection
    try {
      const supabase = getSupabaseClient();
      details.connectionWorking = true;
      console.log("✅ Supabase client created successfully");
    } catch (error) {
      errors.push(`❌ Failed to create Supabase client: ${error}`);
      return { success: false, errors, details };
    }

    // Check 3: Test database connection by checking tables
    const supabase = getSupabaseClient();
    const tablesToCheck = [
      "coaches",
      "students",
      "lessons",
      "booking_requests",
      "student_notes",
      "areas",
      "facilities",
      "courts",
      "availability_ranges",
      "blackout_dates",
    ];

    const tableChecks = await Promise.allSettled(
      tablesToCheck.map(async (table) => {
        const { error } = await supabase.from(table).select("id").limit(1);
        if (error && error.code !== "PGRST116") {
          // PGRST116 means table doesn't exist
          throw new Error(`${table}: ${error.message}`);
        }
        return table;
      })
    );

    const existingTables: string[] = [];
    tableChecks.forEach((result, index) => {
      const tableName = tablesToCheck[index];
      if (result.status === "fulfilled") {
        existingTables.push(tableName);
        details.tablesChecked.push(`✅ ${tableName}`);
      } else {
        details.tablesChecked.push(`❌ ${tableName} - ${result.reason}`);
        errors.push(`Table ${tableName} check failed: ${result.reason}`);
      }
    });

    if (existingTables.length === tablesToCheck.length) {
      details.tablesExist = true;
      console.log(`✅ All ${tablesToCheck.length} tables exist`);
    } else {
      errors.push(
        `❌ Only ${existingTables.length}/${tablesToCheck.length} tables exist. Run supabase-schema.sql to create missing tables.`
      );
    }

    // Summary
    const success = errors.length === 0;

    if (success) {
      console.log("🎉 Supabase is properly configured!");
    } else {
      console.log("⚠️ Supabase setup has issues. Check errors above.");
    }

    return { success, errors, details };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return { success: false, errors, details };
  }
};

/**
 * Quick test - just check if credentials exist and connection works
 */
export const quickSupabaseTest = async (): Promise<boolean> => {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Supabase credentials not configured");
      return false;
    }

    const supabase = getSupabaseClient();
    // Try a simple query
    const { error } = await supabase.from("coaches").select("id").limit(1);

    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`);
      return false;
    }

    console.log("✅ Supabase connection working!");
    return true;
  } catch (error) {
    console.log(`❌ Supabase test failed: ${error}`);
    return false;
  }
};


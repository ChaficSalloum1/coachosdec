/*
Automatic sync service between Zustand store and Supabase
This service handles syncing data back and forth automatically
*/
import { getSupabaseClient } from "../api/supabase";
import { getCurrentUser } from "./authService";
import {
  encryptPaymentSettings,
  decryptPaymentSettings,
  encryptContact,
  decryptContact,
} from "../utils/encryption";
import type {
  Coach,
  Student,
  Lesson,
  BookingRequest,
  StudentNote,
  Area,
  Facility,
  Court,
  AvailabilityRange,
  BlackoutDate,
} from "../types/coach";

// Helper to convert database snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== "object") return obj;

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    converted[camelKey] = toCamelCase(value);
  }
  return converted;
};

// Helper to convert camelCase to database snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== "object") return obj;

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    converted[snakeKey] = toSnakeCase(value);
  }
  return converted;
};

/**
 * Load all data from Supabase for a coach
 */
export const loadCoachDataFromSupabase = async (
  coachId: string
): Promise<{
  coach: Coach | null;
  students: Student[];
  lessons: Lesson[];
  bookingRequests: BookingRequest[];
  studentNotes: StudentNote[];
  areas: Area[];
  facilities: Facility[];
  courts: Court[];
  availabilityRanges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];
}> => {
  try {
    const supabase = getSupabaseClient();

    // Load all data in parallel
    const [
      coachResult,
      studentsResult,
      lessonsResult,
      bookingRequestsResult,
      studentNotesResult,
      areasResult,
      facilitiesResult,
      courtsResult,
      availabilityRangesResult,
      blackoutDatesResult,
    ] = await Promise.all([
      supabase.from("coaches").select("*").eq("id", coachId).is("deleted_at", null).single(),
      supabase.from("students").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase.from("lessons").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase
        .from("booking_requests")
        .select("*")
        .eq("coach_id", coachId)
        .is("deleted_at", null),
      supabase.from("student_notes").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase.from("areas").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase.from("facilities").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase.from("courts").select("*").eq("coach_id", coachId).is("deleted_at", null),
      supabase
        .from("availability_ranges")
        .select("*")
        .eq("coach_id", coachId)
        .is("deleted_at", null),
      supabase.from("blackout_dates").select("*").eq("coach_id", coachId).is("deleted_at", null),
    ]);

    // Decrypt sensitive fields after loading
    const coachData = (coachResult as any).data
      ? toCamelCase((coachResult as any).data)
      : null;
    
    if (coachData && coachData.paymentSettings) {
      coachData.paymentSettings = await decryptPaymentSettings(
        coachData.paymentSettings
      );
    }

    const studentsData = await Promise.all(
      ((studentsResult as any).data || []).map(async (student: any) => {
        const decrypted = toCamelCase(student);
        if (decrypted.contact) {
          decrypted.contact = await decryptContact(decrypted.contact);
        }
        return decrypted;
      })
    );

    return {
      coach: coachData,
      students: studentsData,
      lessons: ((lessonsResult as any).data || []).map(toCamelCase),
      bookingRequests: ((bookingRequestsResult as any).data || []).map(toCamelCase),
      studentNotes: ((studentNotesResult as any).data || []).map(toCamelCase),
      areas: ((areasResult as any).data || []).map(toCamelCase),
      facilities: ((facilitiesResult as any).data || []).map(toCamelCase),
      courts: ((courtsResult as any).data || []).map(toCamelCase),
      availabilityRanges: ((availabilityRangesResult as any).data || []).map(
        toCamelCase
      ),
      blackoutDates: ((blackoutDatesResult as any).data || []).map(toCamelCase),
    };
  } catch (error) {
    console.error("Error loading data from Supabase:", error);
    // Return empty data on error
    return {
      coach: null,
      students: [],
      lessons: [],
      bookingRequests: [],
      studentNotes: [],
      areas: [],
      facilities: [],
      courts: [],
      availabilityRanges: [],
      blackoutDates: [],
    };
  }
};

/**
 * Save coach to Supabase
 * Validates that coach.id matches auth.uid() for RLS security
 */
export const saveCoachToSupabase = async (
  coach: Coach,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    // Validate coach.id matches authenticated user (required for RLS policies)
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save coach data",
      };
    }

    if (coach.id !== user.id) {
      return {
        success: false,
        error: `Coach ID (${coach.id}) must match authenticated user ID (${user.id}) for security`,
      };
    }

    const supabase = getSupabaseClient();

    // Encrypt sensitive fields before saving
    const coachToSave: Coach = { ...coach };
    if (coachToSave.paymentSettings) {
      coachToSave.paymentSettings = await encryptPaymentSettings(
        coachToSave.paymentSettings
      ) as Coach['paymentSettings'];
    }
    
    const data = toSnakeCase(coachToSave);

    let query = supabase.from("coaches").upsert(data, { onConflict: "id" });

    // Add version check if provided (optimistic locking)
    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select();

    if (error) {
      console.error("Error saving coach:", error);
      return { success: false, error: error.message };
    }

    // Check if update happened (version mismatch = conflict)
    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save student to Supabase
 * Validates coach ownership before saving
 */
export const saveStudentToSupabase = async (
  student: Student,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    // Validate that the current user owns this student's coach
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save student data",
      };
    }

    if (student.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save student: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();

    // Encrypt sensitive fields before saving
    const studentToSave = { ...student };
    if (studentToSave.contact) {
      studentToSave.contact = await encryptContact(studentToSave.contact);
    }

    const data = toSnakeCase(studentToSave);

    let query = supabase.from("students").upsert(data, { onConflict: "id" });

    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select();

    if (error) {
      console.error("Error saving student:", error);
      return { success: false, error: error.message };
    }

    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save lesson to Supabase
 * Validates coach ownership before saving
 */
export const saveLessonToSupabase = async (
  lesson: Lesson,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    // Validate that the current user owns this lesson
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save lesson data",
      };
    }

    if (lesson.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save lesson: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(lesson);

    let query = supabase.from("lessons").upsert(data, { onConflict: "id" });

    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select();

    if (error) {
      console.error("Error saving lesson:", error);
      return { success: false, error: error.message };
    }

    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save booking request to Supabase
 */
export const saveBookingRequestToSupabase = async (
  request: BookingRequest,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    const supabase = getSupabaseClient();
    const data = toSnakeCase(request);

    let query = supabase.from("booking_requests").upsert(data, { onConflict: "id" });

    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select();

    if (error) {
      console.error("Error saving booking request:", error);
      return { success: false, error: error.message };
    }

    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save student note to Supabase
 * Validates coach ownership before saving
 */
export const saveStudentNoteToSupabase = async (
  note: StudentNote,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    // Validate that the current user owns this note
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save student note",
      };
    }

    if (note.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save note: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(note);

    let query = supabase.from("student_notes").upsert(data, { onConflict: "id" });

    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select();

    if (error) {
      console.error("Error saving student note:", error);
      return { success: false, error: error.message };
    }

    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save area to Supabase
 * Validates coach ownership before saving
 */
export const saveAreaToSupabase = async (
  area: Area
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate that the current user owns this area
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save area",
      };
    }

    if (area.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save area: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(area);

    const { error } = await supabase
      .from("areas")
      .upsert(data, { onConflict: "id" });

    if (error) {
      console.error("Error saving area:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save facility to Supabase
 * Validates coach ownership before saving
 */
export const saveFacilityToSupabase = async (
  facility: Facility
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate that the current user owns this facility
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save facility",
      };
    }

    if (facility.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save facility: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(facility);

    const { error } = await supabase
      .from("facilities")
      .upsert(data, { onConflict: "id" });

    if (error) {
      console.error("Error saving facility:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save court to Supabase
 * Validates coach ownership before saving
 */
export const saveCourtToSupabase = async (
  court: Court
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate that the current user owns this court
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save court",
      };
    }

    if (court.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save court: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(court);

    const { error } = await supabase
      .from("courts")
      .upsert(data, { onConflict: "id" });

    if (error) {
      console.error("Error saving court:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save availability range to Supabase
 * Validates coach ownership before saving
 */
export const saveAvailabilityRangeToSupabase = async (
  range: AvailabilityRange
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate that the current user owns this range
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save availability range",
      };
    }

    if (range.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save availability range: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(range);

    const { error } = await supabase
      .from("availability_ranges")
      .upsert(data, { onConflict: "id" });

    if (error) {
      console.error("Error saving availability range:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save blackout date to Supabase
 * Validates coach ownership before saving
 */
export const saveBlackoutDateToSupabase = async (
  blackout: BlackoutDate
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate that the current user owns this blackout date
    const user = await getCurrentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "User must be authenticated to save blackout date",
      };
    }

    if (blackout.coachId !== user.id) {
      return {
        success: false,
        error: "Cannot save blackout date: coach ID does not match authenticated user",
      };
    }

    const supabase = getSupabaseClient();
    const data = toSnakeCase(blackout);

    const { error } = await supabase
      .from("blackout_dates")
      .upsert(data, { onConflict: "id" });

    if (error) {
      console.error("Error saving blackout date:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Delete item from Supabase
 */
/**
 * Soft delete item from Supabase (sets deleted_at timestamp instead of hard delete)
 * This prevents data loss and enables recovery if needed
 * Supports optimistic locking via expectedVersion parameter
 */
export const deleteFromSupabase = async (
  tableName: string,
  id: string,
  expectedVersion?: number // Added for optimistic locking on delete
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(tableName) as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    // Add version check if provided (optimistic locking)
    if (expectedVersion !== undefined) {
      query = query.eq("version", expectedVersion);
    }

    const { error, data: result } = await query.select(); // Select to check if update occurred

    if (error) {
      console.error(`Error soft deleting from ${tableName}:`, error);
      return { success: false, error: error.message };
    }

    // Check if update happened (version mismatch = conflict)
    if (expectedVersion !== undefined && (!result || result.length === 0)) {
      return { success: false, conflict: true, error: "Version conflict: data was modified by another client" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};


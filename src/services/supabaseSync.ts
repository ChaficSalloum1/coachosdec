/*
Automatic sync service between Zustand store and Supabase
This service handles syncing data back and forth automatically
*/
import { getSupabaseClient } from "../api/supabase";
import { getCurrentUser } from "./authService";
import { normalizeClockTime } from "../utils/timeFormat";
import { toCamelCase, toSnakeCase } from "./caseConversion";
import { makeRowSaver } from "./rowSaver";
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
import {
  generatePaymentReferenceCode,
  getDefaultPaymentMethod,
  normalizePaymentSettings,
  normalizePaymentStatus,
} from "../modules/payments";

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
      coachData.paymentSettings = normalizePaymentSettings(coachData.paymentSettings);
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
      lessons: ((lessonsResult as any).data || []).map((lesson: any) => {
        const converted = toCamelCase(lesson) as Lesson;
        return {
          ...converted,
          startTime: normalizeClockTime(converted.startTime),
          endTime: normalizeClockTime(converted.endTime),
          paymentStatus: normalizePaymentStatus(converted.paymentStatus, converted.isPaid),
          paymentReferenceCode: converted.paymentReferenceCode ?? (
            coachData ? generatePaymentReferenceCode(coachData.name, converted.id) : converted.paymentReferenceCode
          ),
          paymentMethodRequested: converted.paymentMethodRequested ?? (
            coachData
              ? getDefaultPaymentMethod(coachData.paymentSettings?.paymentPreference, coachData.paymentSettings)
              : converted.paymentMethodRequested
          ),
        };
      }),
      bookingRequests: ((bookingRequestsResult as any).data || []).map((row: any) => {
        const converted = toCamelCase(row);
        return { ...converted, requestedTime: normalizeClockTime(converted.requestedTime) };
      }),
      studentNotes: ((studentNotesResult as any).data || []).map(toCamelCase),
      areas: ((areasResult as any).data || []).map(toCamelCase),
      facilities: ((facilitiesResult as any).data || []).map(toCamelCase),
      courts: ((courtsResult as any).data || []).map(toCamelCase),
      availabilityRanges: ((availabilityRangesResult as any).data || []).map((row: any) => {
        const converted = toCamelCase(row);
        return {
          ...converted,
          startTime: normalizeClockTime(converted.startTime),
          endTime: normalizeClockTime(converted.endTime),
        };
      }),
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
    const coachToSave: Coach = {
      ...coach,
      paymentSettings: normalizePaymentSettings(coach.paymentSettings),
    };
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
 * Save booking request to Supabase
 */
export const saveBookingRequestToSupabase = async (
  request: BookingRequest,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; conflict?: boolean }> => {
  try {
    const supabase = getSupabaseClient();
    const data = toSnakeCase(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && expectedVersion === undefined) {
      const { error } = await (supabase as any).rpc("submit_public_booking_request", {
        p_request: data,
      });

      if (error) {
        console.error("Error submitting public booking request:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    }

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

/*
Everything except the coach profile and public booking requests is saved by one
generic saver (rowSaver.ts); only what differs is stated here.
*/
const rowDeps = {
  getUserId: async () => (await getCurrentUser())?.id,
  getClient: getSupabaseClient,
};

export const saveStudentToSupabase = makeRowSaver<Student>(
  {
    table: "students",
    label: "student",
    versioned: true,
    // Contact details are stored encrypted.
    prepare: async (student) => ({
      ...student,
      contact: student.contact ? await encryptContact(student.contact) : student.contact,
    }),
  },
  rowDeps
);
export const saveLessonToSupabase = makeRowSaver<Lesson>({ table: "lessons", label: "lesson", versioned: true }, rowDeps);
export const saveStudentNoteToSupabase = makeRowSaver<StudentNote>({ table: "student_notes", label: "student note", versioned: true }, rowDeps);
export const saveAreaToSupabase = makeRowSaver<Area>({ table: "areas", label: "area", versioned: false }, rowDeps);
export const saveFacilityToSupabase = makeRowSaver<Facility>({ table: "facilities", label: "facility", versioned: false }, rowDeps);
export const saveCourtToSupabase = makeRowSaver<Court>({ table: "courts", label: "court", versioned: false }, rowDeps);
export const saveAvailabilityRangeToSupabase = makeRowSaver<AvailabilityRange>(
  { table: "availability_ranges", label: "availability range", versioned: false },
  rowDeps
);
export const saveBlackoutDateToSupabase = makeRowSaver<BlackoutDate>(
  { table: "blackout_dates", label: "blackout date", versioned: false },
  rowDeps
);

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

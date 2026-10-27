/*
Turns a booking request row from the database (snake_case, times with seconds)
into the app's BookingRequest. Pure so the mapping is tested.
*/
import type { BookingRequest } from "../types/coach";
import { normalizeClockTime } from "../utils/timeFormat";

// A realtime row arrives in database (snake_case) form.
export type RequestRow = Partial<BookingRequest> & {
  coach_id?: string;
  student_name?: string;
  student_contact?: string;
  requested_date?: string;
  requested_time?: string;
  created_at?: string;
  area_id?: string;
  facility_id?: string;
  court_id?: string;
};

export function toBookingRequest(row: RequestRow, fallbackCoachId: string): BookingRequest {
  return {
    id: row.id as string,
    coachId: row.coachId ?? row.coach_id ?? fallbackCoachId,
    studentName: row.studentName ?? row.student_name ?? "",
    studentContact: row.studentContact ?? row.student_contact ?? "",
    requestedDate: row.requestedDate ?? row.requested_date ?? "",
    requestedTime: String(normalizeClockTime(row.requestedTime ?? row.requested_time ?? "")),
    duration: row.duration ?? 60,
    note: row.note ?? undefined,
    status: row.status ?? "pending",
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    areaId: row.areaId ?? row.area_id ?? undefined,
    facilityId: row.facilityId ?? row.facility_id ?? undefined,
    courtId: row.courtId ?? row.court_id ?? undefined,
  };
}

/*
Booking requests from the public page appear in the app the moment they are
sent, without waiting for the next load.
*/
import { useEffect } from "react";
import { getSupabaseClient } from "../../api/supabase";
import { useCoachStore } from "../../state/coachStore";
import { toBookingRequest, type RequestRow } from "../../services/bookingRequestRow";
import { isSupabaseConfigured } from "../../utils/supabaseConfig";

export function useBookingRealtime() {
  const coachId = useCoachStore((state) => state.coach?.id);
  const isDemoMode = useCoachStore((state) => state.isDemoMode);

  useEffect(() => {
    if (isDemoMode || !coachId || !isSupabaseConfigured()) return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`booking_requests:${coachId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "booking_requests", filter: `coach_id=eq.${coachId}` },
        (payload) => {
          const request = toBookingRequest(payload.new as RequestRow, coachId);
          const existing = useCoachStore.getState().bookingRequests;
          if (!existing.some((r) => r.id === request.id)) {
            useCoachStore.setState({ bookingRequests: [request, ...existing] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId, isDemoMode]);
}

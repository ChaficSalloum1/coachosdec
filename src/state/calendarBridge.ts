// The device calendar is a native module that may be missing (web, tests,
// simulators), so it is loaded on demand and its absence is not an error.
export const getCalendarService = async () => {
  try {
    const { CalendarService } = await import('../utils/calendarService');
    return CalendarService;
  } catch {
    if (__DEV__) {
      console.warn('📅 CalendarService not available (native module not loaded)');
    }
    return null;
  }
};

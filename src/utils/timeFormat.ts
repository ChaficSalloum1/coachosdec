/**
 * Centralized time formatting utilities
 * Replaces 8+ duplicate implementations across the codebase
 */

/**
 * Convert 24-hour time format (HH:mm) to 12-hour format with AM/PM
 * @param time - Time string in HH:mm format (e.g., "14:30")
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime12Hour = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Convert 24-hour time format to 12-hour format without AM/PM
 * @param time - Time string in HH:mm format
 * @returns Formatted time string (e.g., "2:30")
 */
export const formatTime12HourShort = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}`;
};

/**
 * Get AM/PM indicator for a time string
 * @param time - Time string in HH:mm format
 * @returns "AM" or "PM"
 */
export const getAmPm = (time: string): 'AM' | 'PM' => {
  const [hours] = time.split(':');
  const hour = parseInt(hours, 10);
  return hour >= 12 ? 'PM' : 'AM';
};

/**
 * Format a time range in 12-hour format
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Formatted range (e.g., "2:30 PM - 3:30 PM")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
};

/**
 * Validate time format (HH:mm)
 * @param time - Time string to validate
 * @returns true if valid format
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
};

/**
 * Parse time string to hours and minutes
 * @param time - Time string in HH:mm format
 * @returns Object with hours and minutes as numbers
 * @throws Error if invalid format
 */
export const parseTime = (time: string): { hours: number; minutes: number } => {
  if (!isValidTimeFormat(time)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:mm format.`);
  }

  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Add minutes to a time string
 * @param time - Start time in HH:mm format
 * @param minutesToAdd - Minutes to add
 * @returns New time in HH:mm format
 */
export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const { hours, minutes } = parseTime(time);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);

  const newHours = date.getHours().toString().padStart(2, '0');
  const newMinutes = date.getMinutes().toString().padStart(2, '0');

  return `${newHours}:${newMinutes}`;
};

/**
 * Compare two time strings
 * @param time1 - First time in HH:mm format
 * @param time2 - Second time in HH:mm format
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTime = (time1: string, time2: string): number => {
  return time1.localeCompare(time2);
};

/**
 * Check if a time falls within a time range
 * @param time - Time to check in HH:mm format
 * @param startTime - Range start in HH:mm format
 * @param endTime - Range end in HH:mm format
 * @returns true if time is within range
 */
export const isTimeInRange = (
  time: string,
  startTime: string,
  endTime: string
): boolean => {
  return compareTime(time, startTime) >= 0 && compareTime(time, endTime) <= 0;
};

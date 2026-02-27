/*
Client-side validation utilities for data integrity
These validations complement database constraints and provide immediate user feedback
*/

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate lesson times (end time must be after start time)
 */
export const validateLessonTimes = (
  startTime: string,
  endTime: string
): ValidationResult => {
  if (!startTime || !endTime) {
    return { isValid: false, error: "Start time and end time are required" };
  }

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  if (endTotal <= startTotal) {
    return {
      isValid: false,
      error: "End time must be after start time",
    };
  }

  return { isValid: true };
};

/**
 * Validate lesson duration (must be positive and reasonable)
 */
export const validateDuration = (duration: number): ValidationResult => {
  if (duration <= 0) {
    return { isValid: false, error: "Duration must be greater than 0" };
  }

  if (duration > 480) {
    return {
      isValid: false,
      error: "Duration cannot exceed 8 hours (480 minutes)",
    };
  }

  return { isValid: true };
};

/**
 * Validate price (must be non-negative)
 */
export const validatePrice = (price: number): ValidationResult => {
  if (price < 0) {
    return { isValid: false, error: "Price cannot be negative" };
  }

  return { isValid: true };
};

/**
 * Validate email format (basic validation)
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email regex
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};

/**
 * Validate phone number (basic validation - allows various formats)
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove common phone number characters for validation
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  const phoneRegex = /^\d{10,15}$/; // 10-15 digits

  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Phone number must contain 10-15 digits",
    };
  }

  return { isValid: true };
};

/**
 * Validate contact (email or phone)
 */
export const validateContact = (contact: string): ValidationResult => {
  if (!contact || !contact.trim()) {
    return { isValid: false, error: "Contact information is required" };
  }

  // Check if it's an email
  if (contact.includes("@")) {
    return validateEmail(contact);
  }

  // Otherwise treat as phone
  return validatePhone(contact);
};

/**
 * Validate availability range times
 */
export const validateAvailabilityTimes = (
  startTime: string,
  endTime: string
): ValidationResult => {
  return validateLessonTimes(startTime, endTime);
};

/**
 * Validate student balance (can be negative for prepayment)
 */
export const validateBalance = (balance: number): ValidationResult => {
  // Allow negative balances for prepayment scenarios
  // But warn if balance is extremely negative (potential data error)
  if (balance < -100000) {
    return {
      isValid: false,
      error: "Balance seems incorrect. Please verify.",
    };
  }

  return { isValid: true };
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid: string): ValidationResult => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { isValid: false, error: "Invalid UUID format" };
  }
  return { isValid: true };
};

/**
 * Validate lesson data (combines multiple validations)
 */
export const validateLesson = (lesson: {
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
}): ValidationResult => {
  // Validate times
  const timeValidation = validateLessonTimes(lesson.startTime, lesson.endTime);
  if (!timeValidation.isValid) {
    return timeValidation;
  }

  // Validate duration
  const durationValidation = validateDuration(lesson.duration);
  if (!durationValidation.isValid) {
    return durationValidation;
  }

  // Validate price
  const priceValidation = validatePrice(lesson.price);
  if (!priceValidation.isValid) {
    return priceValidation;
  }

  // Check duration matches time difference
  const [startHours, startMinutes] = lesson.startTime.split(":").map(Number);
  const [endHours, endMinutes] = lesson.endTime.split(":").map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  const calculatedDuration = endTotal - startTotal;

  if (Math.abs(calculatedDuration - lesson.duration) > 5) {
    // Allow 5 minute tolerance for rounding
    return {
      isValid: false,
      error: `Duration (${lesson.duration} min) doesn't match time difference (${calculatedDuration} min)`,
    };
  }

  return { isValid: true };
};

/**
 * Validate student data
 */
export const validateStudent = (student: {
  name: string;
  contact: string;
  balance?: number;
}): ValidationResult => {
  if (!student.name || !student.name.trim()) {
    return { isValid: false, error: "Student name is required" };
  }

  const contactValidation = validateContact(student.contact);
  if (!contactValidation.isValid) {
    return contactValidation;
  }

  if (student.balance !== undefined) {
    const balanceValidation = validateBalance(student.balance);
    if (!balanceValidation.isValid) {
      return balanceValidation;
    }
  }

  return { isValid: true };
};


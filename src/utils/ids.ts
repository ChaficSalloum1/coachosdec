const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The backend only accepts UUID ids; older local data used ids like "coach_1".
export const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

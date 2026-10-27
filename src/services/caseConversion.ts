/* snake_case <-> camelCase for rows moving between the database and the app. */

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toCamelCase = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toCamelCase);
  if (typeof value !== 'object') return value;

  const converted: Record<string, any> = {};
  for (const [key, inner] of Object.entries(value)) {
    converted[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = toCamelCase(inner);
  }
  return converted;
};

export const toSnakeCase = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toSnakeCase);
  if (typeof value !== 'object') return value;

  const converted: Record<string, any> = {};
  for (const [key, inner] of Object.entries(value)) {
    converted[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = toSnakeCase(inner);
  }
  return converted;
};

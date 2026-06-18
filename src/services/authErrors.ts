import type { AuthError } from '@supabase/supabase-js';

export const makeAuthError = (message: string): AuthError => {
  return {
    name: 'AuthError',
    message,
  } as AuthError;
};

export const normalizeAuthError = (error: unknown): AuthError => {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Authentication failed. Please try again.';

  const lowerMessage = rawMessage.toLowerCase();
  const message = lowerMessage.includes('json parse')
    || lowerMessage.includes('unexpected character')
    ? 'Authentication could not read the server response. Please restart the app and try again. If this continues, check that the Supabase URL is the project URL and the key is the anon/public key.'
    : rawMessage;

  return makeAuthError(message);
};

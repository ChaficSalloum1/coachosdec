import type { AuthError } from '@supabase/supabase-js';
import { t } from '../i18n';

export const makeAuthError = (message: string): AuthError => {
  return {
    name: 'AuthError',
    message,
  } as AuthError;
};

const isBlank = (message: string | undefined) => !message?.trim() || message.trim() === '{}';

// An error Supabase returned (not thrown): keep it as it is unless it has no readable text.
export const readableAuthError = (error: AuthError | null): AuthError | null =>
  error && isBlank(error.message) ? makeAuthError(t('auth.genericFailure')) : error;

export const normalizeAuthError = (error: unknown): AuthError => {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : t('auth.genericFailure');

  // Some failures (a proxy error page, an empty reply) arrive with no usable text.
  const lowerMessage = rawMessage.toLowerCase();
  if (isBlank(rawMessage)) return makeAuthError(t('auth.genericFailure'));
  const message = lowerMessage.includes('json parse')
    || lowerMessage.includes('unexpected character')
    ? t('auth.unreadableResponse')
    : rawMessage;

  return makeAuthError(message);
};

import type { AuthError } from '@supabase/supabase-js';
import { t } from '../i18n';

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
      : t('auth.genericFailure');

  const lowerMessage = rawMessage.toLowerCase();
  const message = lowerMessage.includes('json parse')
    || lowerMessage.includes('unexpected character')
    ? t('auth.unreadableResponse')
    : rawMessage;

  return makeAuthError(message);
};

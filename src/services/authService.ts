/*
Authentication service for Supabase
Handles user authentication, session management, and user profile operations
*/
import { useCoachStore } from '../state/coachStore';
import { getSupabaseClient } from "../api/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { makeAuthError, normalizeAuthError } from './authErrors';

const getPasswordResetRedirectUrl = () => {
  return __DEV__
    ? "exp://localhost:8081/--/reset-password"
    : "coachos://reset-password";
};

// ... your interfaces and rest of the code follow below
export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_TIMEOUT_MS = 15000;

const withAuthTimeout = async <T,>(promise: Promise<T>, action: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${action} timed out. Please check your internet connection and Supabase configuration, then try again.`));
    }, AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const validateEmailPassword = (email: string, password: string, isSignUp: boolean): AuthError | null => {
  if (!emailRegex.test(email.trim())) {
    return makeAuthError("Please enter a valid email address.");
  }

  if (!password) {
    return makeAuthError("Please enter your password.");
  }

  if (isSignUp && password.length < 6) {
    return makeAuthError("Password must be at least 6 characters.");
  }

  return null;
};

/**
 * Sign up a new user
 */
export const signUp = async (
  credentials: SignUpCredentials
): Promise<AuthResponse> => {
  try {
    const email = credentials.email.trim().toLowerCase();
    const validationError = validateEmailPassword(email, credentials.password, true);
    if (validationError) {
      return { user: null, session: null, error: validationError };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await withAuthTimeout(
      supabase.auth.signUp({
        email,
        password: credentials.password,
        options: {
          data: credentials.metadata || {},
        },
      }),
      "Sign up"
    );

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: normalizeAuthError(error),
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (
  credentials: SignInCredentials
): Promise<AuthResponse> => {
  try {
    const email = credentials.email.trim().toLowerCase();
    const validationError = validateEmailPassword(email, credentials.password, false);
    if (validationError) {
      return { user: null, session: null, error: validationError };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      }),
      "Sign in"
    );

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: normalizeAuthError(error),
    };
  }
};

/**
 * Sign out the current user, clear the remote session, 
 * and force-evict any local ghost sessions.
 */
export const signOut = async (): Promise<{ error: any | null }> => {
  try {
    const supabase = getSupabaseClient();
    // 1. Tell the Supabase backend to terminate the session token
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Supabase remote signout rejected request:", error.message);
    }
  } catch (error) {
    // 2. Catch network crashes or ghost-account failures silently
    console.warn("Network or session missing during signout, bypassing to local wipe:", error);
  } finally {
    // 3. THE BULLETPROOF LOCK-PICK:
    // Forcefully wipe the UI layout memory no matter what happened above.
    try {
      if (useCoachStore && useCoachStore.getState) {
        useCoachStore.getState().clearAllData();
      }
    } catch (storeError) {
      console.error("Critical: Failed to manually clear Zustand cache:", storeError);
    }
  }
  
  // Always return a clean exit status so the UI thread can finish safely
  return { error: null };
};
/**
 * Get the current session
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", normalizeAuthError(error).message);
    return null;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting user:", normalizeAuthError(error).message);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

/**
 * Reset password via email
 */
export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    return { error };
  } catch (error) {
    return { error: normalizeAuthError(error) };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (
  newPassword: string
): Promise<{ error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (error) {
    return { error: normalizeAuthError(error) };
  }
};

/**
 * Update user metadata
 */
export const updateUserMetadata = async (
  metadata: Record<string, any>
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    return { user: data.user, error };
  } catch (error) {
    return { user: null, error: normalizeAuthError(error) };
  }
};

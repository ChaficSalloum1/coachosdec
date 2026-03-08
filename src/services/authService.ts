/*
Authentication service for Supabase
Handles user authentication, session management, and user profile operations
*/
import { getSupabaseClient } from "../api/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

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

/**
 * Sign up a new user
 */
export const signUp = async (
  credentials: SignUpCredentials
): Promise<AuthResponse> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: credentials.metadata || {},
      },
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
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
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
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
    console.error("Error getting session:", error);
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
    console.error("Error getting user:", error);
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
      redirectTo: "exp://localhost:8081/--/reset-password",
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
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
    return { error: error as AuthError };
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
    return { user: null, error: error as AuthError };
  }
};


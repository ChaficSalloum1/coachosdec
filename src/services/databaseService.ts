/*
Database service for Supabase
Provides typed database operations and query helpers
*/
import { getSupabaseClient } from "../api/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

export interface DatabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Generic function to fetch data from a table
 */
export const fetchFromTable = async <T>(
  tableName: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<DatabaseResponse<T[]>> => {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from(tableName).select(options?.select || "*");

    // Apply filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    return { data: data as T[] | null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Generic function to fetch a single row by ID
 */
export const fetchById = async <T>(
  tableName: string,
  id: string | number,
  select?: string
): Promise<DatabaseResponse<T>> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tableName)
      .select(select || "*")
      .eq("id", id)
      .single();

    return { data: data as T | null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Generic function to insert data into a table
 */
export const insertIntoTable = async <T>(
  tableName: string,
  data: Partial<T> | Partial<T>[]
): Promise<DatabaseResponse<T[]>> => {
  try {
    const supabase = getSupabaseClient();
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(data as any)
      .select();

    return { data: insertedData as T[] | null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Generic function to update data in a table
 */
export const updateTable = async <T>(
  tableName: string,
  id: string | number,
  updates: Partial<T>
): Promise<DatabaseResponse<T>> => {
  try {
    const supabase = getSupabaseClient();
    const result = await (supabase
      .from(tableName) as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    const { data, error } = result;

    return { data: data as T | null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Generic function to delete data from a table
 */
export const deleteFromTable = async (
  tableName: string,
  id: string | number
): Promise<DatabaseResponse<void>> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    return { data: null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Generic function to perform a custom query
 */
export const customQuery = async <T>(
  queryBuilder: (supabase: ReturnType<typeof getSupabaseClient>) => any
): Promise<DatabaseResponse<T>> => {
  try {
    const supabase = getSupabaseClient();
    const result = await queryBuilder(supabase);
    const { data, error } = result;

    return { data: data as T | null, error };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
};

/**
 * Subscribe to real-time changes in a table
 */
export const subscribeToTable = <T>(
  tableName: string,
  callback: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: T | null;
    old: T | null;
  }) => void,
  filter?: string
) => {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: tableName,
        filter: filter,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          new: payload.new as T | null,
          old: payload.old as T | null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};


/**
 * src/services/supabase.ts
 *
 * Typed Supabase client singleton configured for Expo / React Native.
 * Import this — never call createClient() directly in components or hooks.
 *
 * Env vars are set in .env.local (see .env.example).
 * DO NOT put API keys for connectors here — they live in the connections table.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

/**
 * Returns true if real Supabase environment variables have been configured.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
);

/**
 * Typed Supabase client configured with AsyncStorage for session persistence,
 * auto token refreshing, and disabled browser URL session detection for React Native.
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

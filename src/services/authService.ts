import { supabase } from './supabase';
import type { Role } from '../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
// Profile logic is now handled by teacherService.ts

// ── Auth Functions ────────────────────────────────────────────────────────────

/** Register new account with email and password */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Login with email and password */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Login with Google OAuth */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'signspeakapp://auth/callback',
    },
  });
  if (error) throw error;
  return data;
}

/** Sign out the current user */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get the current authenticated session */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ── Listeners ─────────────────────────────────────────────────────────────────

/** Listen to auth state changes (login, logout, token refresh) */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

/** Silent ping to keep the free-tier Supabase database awake and prevent it from pausing */
export async function pingSupabase() {
  try {
    // Perform a minimal read on teachers table
    await supabase.from('teachers' as any).select('id').limit(1);
    console.log('[Supabase] Silent ping successful. Database project active.');
  } catch (err) {
    console.warn('[Supabase] Silent ping failed:', err);
  }
}


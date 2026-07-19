import { supabase } from './supabase';
import type { Role } from '../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileData {
  name: string;
  role: Role;
  photoUri?: string;
  school?: string;
  // Student-specific
  className?: string;
  // Teacher-specific
  subject?: string;
  teacherId?: string;   // NIP / ID Guru (opsional, tanpa validasi API)
  isVerified?: boolean;  // Pondasi untuk verifikasi guru di masa depan
}

export interface SupabaseProfile extends ProfileData {
  id: string;
  email: string;
  created_at?: string;
  // Snake-case aliases from Supabase DB columns
  photo_uri?: string;
  class_name?: string;
  teacher_id?: string;
  is_verified?: boolean;
}

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

// ── Profile Functions ─────────────────────────────────────────────────────────

/** Fetch user profile from the `profiles` table */
export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" — this is expected for new users
    throw error;
  }

  return data as SupabaseProfile | null;
}

/** Create or update a user's profile in the `profiles` table */
export async function upsertProfile(userId: string, email: string, profileData: ProfileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      name: profileData.name,
      role: profileData.role,
      photo_uri: profileData.photoUri || null,
      school: profileData.school || null,
      class_name: profileData.className || null,
      subject: profileData.subject || null,
      teacher_id: profileData.teacherId || null,
      is_verified: profileData.isVerified ?? false,
    }, { onConflict: 'id' });

  if (error) throw error;
  return data;
}

/** Listen to auth state changes (login, logout, token refresh) */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

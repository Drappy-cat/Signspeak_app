import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

export type Role = 'student' | 'teacher' | null;

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  photoUri?: string;
  school?: string;
  // Student-specific
  className?: string;
  joinedRoomCode?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isReady: boolean;
  hasOnboarded: boolean;
  login: (email: string, password?: string, roomCode?: string, targetRole?: Role, name?: string, className?: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  register: (name: string, email: string, password?: string, school?: string, className?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@lentera/user';
const ONBOARDING_STORAGE_KEY = '@lentera/onboarded';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // ── Load cached auth state on mount ───────────────────────────────────────
  const loadAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setRoleState(parsedUser.role);
      }

      if (onboarded === 'true') {
        setHasOnboarded(true);
      }

      // Try to sync with Supabase session if available
      try {
        const session = await getSession();
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          if (profile && profile.name) {
            const syncedUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.name,
              role: profile.role as Role,
              photoUri: profile.photo_uri || profile.photoUri,
              school: profile.school,
              className: profile.class_name || profile.className,
              subject: profile.subject,
              teacherId: profile.teacher_id || profile.teacherId,
              isVerified: profile.is_verified ?? profile.isVerified ?? false,
            };
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
            setUser(syncedUser);
            setRoleState(syncedUser.role);
            setNeedsProfileCompletion(false);
          } else if (!storedUser) {
            // User is authenticated but has no profile yet
            setNeedsProfileCompletion(true);
          }
        }
      } catch {
        // Supabase not reachable — use cached local data, which is fine
        console.log('Supabase session sync skipped (offline or not configured)');
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    loadAuthState();
    
    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        if (role === 'teacher') setRoleState(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string, roomCode?: string, targetRole?: Role, name?: string, className?: string) => {
    const activeRole = targetRole || role;
    if (targetRole) {
      setRoleState(targetRole);
    }
    
    if (activeRole === 'student') {
      // Students don't need Supabase Auth, they just need local state to join sessions
      const mockUser: User = {
        email: '',
        name: name || 'Siswa Tanpa Nama',
        role: 'student',
        className: className || 'Kelas Umum',
        joinedRoomCode: roomCode,
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }
    
    // Teacher: Use Supabase Auth
    if (!password) throw new Error('Password required for teacher login');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      throw new Error(authError.message);
    }
    
    // Fetch profile
    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) {
        console.warn('Failed to fetch profile:', profileError);
      }
      
      const teacherUser: User = {
        id: authData.user.id,
        email: authData.user.email || email,
        name: profile?.name || 'Guru LENTERA',
        role: 'teacher',
        school: profile?.school || '',
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(teacherUser));
      setUser(teacherUser);
    }
  };

  // ── Login with Google ─────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
      // The auth state change listener will handle the rest
      // (setting user, checking profile, etc.)
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (role === 'teacher') {
        await supabase.auth.signOut();
      }
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setRoleState(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setRoleState(null);
    setNeedsProfileCompletion(false);
  };

  // ── Set Role ──────────────────────────────────────────────────────────────
  const setRole = async (newRole: Role) => {
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  // ── Complete Onboarding ───────────────────────────────────────────────────
  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasOnboarded(true);
  };

  // ── Register with Email ───────────────────────────────────────────────────
  const register = async (name: string, email: string, password?: string, school?: string, className?: string) => {
    const activeRole = role;
    
    if (activeRole === 'student') {
      throw new Error('Student registration is not required.');
    }
    
    if (!password) throw new Error('Password required');

    // Register with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: activeRole,
          school,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }
    
    // NOTE: We assume the public.handle_new_user() trigger from supabase_setup_guide.md 
    // will automatically create the profile in public.profiles table.

    const newUser: User = {
      id: authData.user?.id,
      email,
      name,
      role: activeRole,
      school,
    };

    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = Linking.createURL('/update-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isReady, hasOnboarded, login, logout, setRole, completeOnboarding, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

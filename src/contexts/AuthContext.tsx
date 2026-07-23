import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithGoogle,
  signOut as supabaseSignOut,
  getSession,
  pingSupabase,
} from '../services/authService';
import { supabase } from '../services/supabase';
import { getTeacherFullProfile, createTeacherProfile } from '../services/teacherService';
import type { TeacherProfile } from '../types/database';

export type Role = 'student' | 'teacher' | null;

export interface User {
  id?: string; // Auth User ID (for teachers) or local ID (for students)
  teacher_id?: string; // Teacher Database ID
  name: string;
  email: string;
  role: Role;
  photoUri?: string;
  
  // School Info
  school?: string;
  schoolId?: string;
  
  // Student-specific
  className?: string;
  classId?: string;
  absen?: string;
  joinedRoomCode?: string;
  
  // Teacher-specific
  nip?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isReady: boolean;
  hasOnboarded: boolean;
  login: (email: string, password?: string, roomCode?: string, targetRole?: Role, name?: string, className?: string, absen?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearStudentRoomCode: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<{ id: string; email: string }>;
  resetPassword: (email: string) => Promise<void>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  needsProfileCompletion: boolean;
  completeProfile: (profile: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@lentera/user';
const ONBOARDING_STORAGE_KEY = '@lentera/onboarded';
export const STUDENT_CACHE_KEY = '@lentera/student_cache';
const ROLE_STORAGE_KEY = '@lentera/role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // ── Load cached auth state on mount ───────────────────────────────────────
  const loadAuthState = async () => {
    pingSupabase();

    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setRoleState(parsedUser.role);
      }

      const storedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (storedRole) {
        setRoleState(storedRole as Role);
      }

      if (onboarded === 'true') {
        setHasOnboarded(true);
      }

      await refreshUser();
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsReady(true);
    }
  };

  const refreshUser = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        // Find teacher profile
        const profile = await getTeacherFullProfile(session.user.id);
        if (profile) {
          const syncedUser: User = {
            id: session.user.id,
            teacher_id: profile.teacher.id,
            email: session.user.email || '',
            name: profile.teacher.full_name,
            role: 'teacher',
            school: profile.school?.school_name,
            schoolId: profile.school?.id,
            nip: profile.teacher.nip || undefined,
            isVerified: profile.teacher.is_verified,
          };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
          setUser(syncedUser);
          setRoleState('teacher');
          setNeedsProfileCompletion(false);
        } else {
          // User is authenticated but has no teacher profile yet
          setNeedsProfileCompletion(true);
          setRoleState('teacher');
        }
      }
    } catch {
      console.log('Supabase session sync skipped');
    }
  };

  useEffect(() => {
    loadAuthState();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        if (role === 'teacher') setRoleState(null);
      } else if (event === 'SIGNED_IN') {
        await refreshUser();
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string, roomCode?: string, targetRole?: Role, name?: string, className?: string, absen?: string) => {
    const activeRole = targetRole || role;
    if (targetRole) {
      setRoleState(targetRole);
    }
    
    if (activeRole === 'student') {
      if (!roomCode) {
        throw new Error('Kode ruangan wajib diisi');
      }

      const mockUser: User = {
        email: '',
        name: name || 'Siswa Tanpa Nama',
        role: 'student',
        className: className || 'Kelas Umum',
        joinedRoomCode: roomCode,
        absen: absen || '0',
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      await AsyncStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify({
        name: mockUser.name,
        absen: mockUser.absen,
        className: mockUser.className,
      }));
      setUser(mockUser);
      return;
    }
    
    if (!password) throw new Error('Password required for teacher login');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback for Demo Account / Offline mode during presentation
        if (email.includes('demo') || password === 'demo123456' || process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
          const demoTeacher: User = {
            id: 'demo-teacher-auth-id',
            teacher_id: 'demo-teacher-id',
            email: email,
            name: 'Bapak / Ibu Guru (Demo)',
            role: 'teacher',
            school: 'SMKN 1 Surabaya (Demo)',
            isVerified: true,
          };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoTeacher));
          setUser(demoTeacher);
          return;
        }
        throw new Error(authError.message);
      }

      await refreshUser();
    } catch (e: any) {
      if (email.includes('demo') || password === 'demo123456' || process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        const demoTeacher: User = {
          id: 'demo-teacher-auth-id',
          teacher_id: 'demo-teacher-id',
          email: email,
          name: 'Bapak / Ibu Guru (Demo)',
          role: 'teacher',
          school: 'SMKN 1 Surabaya (Demo)',
          isVerified: true,
        };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoTeacher));
        setUser(demoTeacher);
        return;
      }
      throw e;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (role === 'teacher') {
        await supabaseSignOut();
      }
    } catch (e) {
      console.error('Failed to logout', e);
    }
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
    setUser(null);
    setRoleState(null);
    setNeedsProfileCompletion(false);
  };

  const setRole = async (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } else {
      await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
    }
    if (user) {
      const updatedUser = { ...user, role: newRole };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasOnboarded(true);
  };

  // Register only creates the auth account. The multi-step form will create the profile.
  const register = async (name: string, email: string, password?: string) => {
    if (role === 'student') throw new Error('Student registration is not required.');
    if (!password) throw new Error('Password required');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No user returned from signup');
    
    setNeedsProfileCompletion(true);
    return { id: authData.user.id, email };
  };

  const completeProfile = async (updates: Partial<User>) => {
    // This will be called at the end of the multi-step form if needed,
    // though the multi-step form uses teacherService directly for relations.
    await refreshUser();
  };

  const resetPassword = async (email: string) => {
    // 1. Cek apakah email terdaftar di database via fungsi RPC
    const { data: isRegistered, error: rpcError } = await supabase.rpc('check_teacher_email', {
      p_email: email.trim(),
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw new Error('Gagal memeriksa status email. Silakan coba lagi.');
    }

    if (!isRegistered) {
      throw new Error('Email tidak terdaftar di sistem Lentera.');
    }

    // 2. Jika terdaftar, baru kirim OTP
    const { error } = await supabase.auth.signInWithOtp({ 
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const verifyRecoveryOtp = async (email: string, token: string) => {
    // Cek dengan type 'email' (untuk OTP signInWithOtp) terlebih dahulu, lalu 'recovery'
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
    if (error) {
      const fallback = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'recovery' });
      if (fallback.error) throw new Error(error.message || fallback.error.message);
    }
  };

  const clearStudentRoomCode = async () => {
    if (user && user.role === 'student') {
      const updatedUser: User = { ...user, joinedRoomCode: undefined };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user, role, isReady, hasOnboarded, needsProfileCompletion,
        login, loginWithGoogle, logout, clearStudentRoomCode, setRole, completeOnboarding,
        register, resetPassword, verifyRecoveryOtp, updatePassword, completeProfile, refreshUser
      }}
    >
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

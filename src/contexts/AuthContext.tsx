import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as supabaseSignOut,
  getProfile,
  upsertProfile,
  onAuthStateChange,
  getSession,
  pingSupabase,
  type ProfileData,
} from '../services/authService';

export type Role = 'student' | 'teacher' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  photoUri?: string;
  school?: string;
  // Student-specific
  className?: string;
  // Teacher-specific
  subject?: string;
  teacherId?: string;    // NIP / ID Guru (opsional)
  isVerified?: boolean;  // Pondasi verifikasi guru
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isReady: boolean;
  hasOnboarded: boolean;
  needsProfileCompletion: boolean;
  login: (email: string, password?: string, classCode?: string, targetRole?: Role) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  register: (name: string, email: string, password?: string, school?: string, className?: string) => Promise<void>;
  completeProfile: (profileData: ProfileData) => Promise<void>;
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
    // Keep Supabase active in the background
    pingSupabase();

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
  }, []);

  // ── Listen to Supabase auth state changes ─────────────────────────────────
  useEffect(() => {
    let subscription: any;
    try {
      subscription = onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRoleState(null);
          setNeedsProfileCompletion(false);
          await AsyncStorage.removeItem(USER_STORAGE_KEY);
        }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          try {
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
            } else {
              setNeedsProfileCompletion(true);
            }
          } catch {
            // Profile fetch failed — will be retried on next app open
          }
        }
      });
    } catch {
      // Supabase listener failed — app works offline with local cache
    }
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ── Login with Email/Password ─────────────────────────────────────────────
  const login = async (email: string, password?: string, _classCode?: string, targetRole?: Role) => {
    const activeRole = targetRole || role;
    if (targetRole) {
      setRoleState(targetRole);
    }

    try {
      // Try Supabase auth first
      const authData = await signInWithEmail(email, password || '');
      if (authData.user) {
        const profile = await getProfile(authData.user.id);
        if (profile && profile.name) {
          const loggedInUser: User = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: profile.name,
            role: (profile.role as Role) || activeRole,
            photoUri: profile.photo_uri || profile.photoUri,
            school: profile.school,
            className: profile.class_name || profile.className,
            subject: profile.subject,
            teacherId: profile.teacher_id || profile.teacherId,
            isVerified: profile.is_verified ?? profile.isVerified ?? false,
          };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
          setUser(loggedInUser);
          setRoleState(loggedInUser.role);
          setNeedsProfileCompletion(false);
        } else {
          // Authenticated but no profile — need to complete
          setNeedsProfileCompletion(true);
        }
      }
    } catch (supabaseError) {
      // Fallback: If Supabase is unreachable, use local mock for development
      console.warn('Supabase login failed, using local fallback:', supabaseError);
      const mockUser: User = {
        id: `local-${Date.now()}`,
        email,
        name: activeRole === 'student' ? 'Budi Santoso' : 'Bu Sari Dewi',
        role: activeRole,
        school: 'SMAN 1 Surabaya',
        className: activeRole === 'student' ? 'XII IPA 3' : undefined,
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
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
      await supabaseSignOut();
    } catch {
      // Supabase sign out failed — proceed with local cleanup anyway
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

    try {
      // Try Supabase registration
      const authData = await signUpWithEmail(email, password || '');
      if (authData.user) {
        const profileData: ProfileData = {
          name,
          role: activeRole,
          school,
          className: activeRole === 'student' ? className : undefined,
          isVerified: false,
        };
        await upsertProfile(authData.user.id, email, profileData);

        const newUser: User = {
          id: authData.user.id,
          email,
          name,
          role: activeRole,
          school,
          className: activeRole === 'student' ? className : undefined,
        };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        setNeedsProfileCompletion(false);
      }
    } catch (supabaseError) {
      // Fallback: local registration for development
      console.warn('Supabase registration failed, using local fallback:', supabaseError);
      const newUser: User = {
        id: `local-${Date.now()}`,
        email,
        name,
        role: activeRole,
        school,
        className: activeRole === 'student' ? className : undefined,
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  // ── Complete Profile (for Google sign-in users) ───────────────────────────
  const completeProfile = async (profileData: ProfileData) => {
    try {
      const session = await getSession();
      if (session?.user) {
        await upsertProfile(session.user.id, session.user.email || '', profileData);

        const completedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profileData.name,
          role: profileData.role,
          photoUri: profileData.photoUri,
          school: profileData.school,
          className: profileData.className,
          subject: profileData.subject,
          teacherId: profileData.teacherId,
          isVerified: profileData.isVerified ?? false,
        };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(completedUser));
        setUser(completedUser);
        setRoleState(profileData.role);
        setNeedsProfileCompletion(false);
      }
    } catch (error) {
      console.error('Failed to complete profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, role, isReady, hasOnboarded, needsProfileCompletion,
      login, loginWithGoogle, logout, setRole, completeOnboarding, register, completeProfile,
    }}>
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'student' | 'teacher' | null;

export interface User {
  name: string;
  email: string;
  role: Role;
  school?: string;
  className?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isReady: boolean;
  hasOnboarded: boolean;
  login: (email: string, password?: string, classCode?: string, targetRole?: Role) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  register: (name: string, email: string, password?: string, school?: string, className?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@lentera/user';
const ONBOARDING_STORAGE_KEY = '@lentera/onboarded';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const loadAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRoleState(parsedUser.role);
      }
      
      if (onboarded === 'true') {
        setHasOnboarded(true);
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAuthState();
  }, []);

  const login = async (email: string, password?: string, classCode?: string, targetRole?: Role) => {
    const activeRole = targetRole || role;
    if (targetRole) {
      setRoleState(targetRole);
    }
    // Mock login functionality
    const mockUser: User = {
      email,
      name: activeRole === 'student' ? 'Budi Santoso' : 'Bu Sari Dewi',
      role: activeRole,
      school: 'SMAN 1 Surabaya',
      className: activeRole === 'student' ? 'XII IPA 3' : undefined,
    };

    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (e) {
      console.error('Failed to save user', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setRoleState(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const setRole = async (newRole: Role) => {
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      try {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (e) {
        console.error('Failed to update role', e);
      }
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setHasOnboarded(true);
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    }
  };

  const register = async (name: string, email: string, password?: string, school?: string, className?: string) => {
    const activeRole = role;
    const newUser: User = {
      email,
      name,
      role: activeRole,
      school,
      className: activeRole === 'student' ? className : undefined,
    };

    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    } catch (e) {
      console.error('Failed to register user', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isReady, hasOnboarded, login, logout, setRole, completeOnboarding, register }}>
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updated: User) => void;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    const token = localStorage.getItem('asvilla_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(res => {
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('asvilla_token');
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('asvilla_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      if (res && res.success && res.token && res.user) {
        localStorage.setItem('asvilla_token', res.token);
        setUser(res.user);
        setAuthModalOpen(false);
        return { success: true, message: res.message || 'Login successful' };
      }
      return { success: false, message: res?.message || 'Login failed. Please check your credentials.' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message ? `Network or server error: ${err.message}` : 'Network or server error during sign in.',
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword?: string;
  }) => {
    try {
      const res = await api.register(data);
      if (res && res.success && res.token && res.user) {
        localStorage.setItem('asvilla_token', res.token);
        setUser(res.user);
        setAuthModalOpen(false);
        return { success: true, message: res.message || 'Registration successful' };
      }
      return {
        success: false,
        message: res?.message || 'Registration could not be completed. Please try again.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message ? `Network or server error: ${err.message}` : 'Network or server error during registration.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('asvilla_token');
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

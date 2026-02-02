import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { User, AuthState, LoginCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Store auth in localStorage
const AUTH_KEY = 'defy_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setState({ user, isAuthenticated: true, loading: false });
      } catch {
        localStorage.removeItem(AUTH_KEY);
        setState({ user: null, isAuthenticated: false, loading: false });
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { user } = response.data;

      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        setState({ user, isAuthenticated: true, loading: false });
        return { success: true };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'Invalid credentials' };
    } catch (error: unknown) {
      setState(prev => ({ ...prev, loading: false }));
      if (axios.isAxiosError(error)) {
        return { success: false, error: error.response?.data?.error || 'Login failed' };
      }
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setState({ user: null, isAuthenticated: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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

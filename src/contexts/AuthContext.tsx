import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '@/services/api';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  regNo?: string;
  role: 'admin' | 'college' | 'student';
  collegeId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string, identifierType?: 'email' | 'regNo') => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem('token'); localStorage.removeItem('user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password: string, identifierType: 'email' | 'regNo' = 'email') => {
    try {
      const payload = identifierType === 'regNo'
        ? { regNo: identifier, password }
        : { email: identifier, password };
      const res = await authAPI.login(payload);
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, message: 'Login successful' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Wrong email/reg no or password' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    authAPI.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setToken, removeToken, apiRequest } from './api';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'customer' | 'mechanic';
  fullName: string;
  phone?: string;
  customerId?: number;
  mechanicId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        removeToken();
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, newUser: User) => {
    setToken(token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);

    if (newUser.role === 'admin') router.push('/admin');
    else if (newUser.role === 'mechanic') router.push('/mechanic');
    else router.push('/customer');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest<User>('/api/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


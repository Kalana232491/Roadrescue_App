import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('token') ?? localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user') ?? localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        sessionStorage.setItem('token', savedToken);
        sessionStorage.setItem('user', savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return;
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    const serializedUser = JSON.stringify(newUser);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', serializedUser);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.replace('/');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

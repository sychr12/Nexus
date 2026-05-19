"use client";

import React, { createContext, useContext, useMemo } from 'react';

type User = { username?: string } | null;

const AuthContext = createContext<{ user: User }>({ user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;

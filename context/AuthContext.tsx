"use client";
import React, { createContext, useContext, type ReactNode } from 'react';
import { useAuthSession, type AuthSessionState } from '@/features/auth/hooks/useAuthSession';

const AuthContext = createContext<AuthSessionState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const session = useAuthSession();

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

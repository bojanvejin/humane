'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types'; // Import User type

type UserRole = User['role']; // Define UserRole type

interface AuthContextType {
  user: ReturnType<typeof useAuth>['user'];
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean; // Corrected type
  hasAnyRole: (roles: UserRole[]) => boolean; // Corrected type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
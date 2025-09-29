'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { User } from '@/types';
import { toast } from 'sonner'; // Using Sonner for notifications

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: User['role'][];
  fallbackUrl?: string; // Optional URL to redirect to if roles don't match
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallbackUrl = '/forbidden' }) => {
  const { user, loading, hasAnyRole } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        toast.error('You must be logged in to access this page.');
        router.push('/login');
      } else if (!hasAnyRole(allowedRoles)) {
        // User is authenticated but does not have an allowed role
        toast.error('You do not have permission to access this page.');
        router.push(fallbackUrl);
      }
    }
  }, [loading, user, allowedRoles, hasAnyRole, router, fallbackUrl]);

  if (loading || !user || !hasAnyRole(allowedRoles)) {
    // While loading, or if user is not authorized, render nothing or a loading spinner
    // The redirect will happen in useEffect
    return null; 
  }

  return <>{children}</>;
};

export default RoleGuard;
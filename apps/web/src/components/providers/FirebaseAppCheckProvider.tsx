'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { getToken } from 'firebase/app-check';
import { appCheck } from '@humane/lib/firebase'; // Import the exported appCheck instance

interface AppCheckContextType {
  appCheckToken: string | null;
  loading: boolean;
  refreshAppCheckToken: () => Promise<void>;
}

const AppCheckContext = createContext<AppCheckContextType | undefined>(undefined);

export const useAppCheckContext = () => {
  const context = useContext(AppCheckContext);
  if (context === undefined) {
    throw new Error('useAppCheckContext must be used within a FirebaseAppCheckProvider');
  }
  return context;
};

interface FirebaseAppCheckProviderProps {
  children: ReactNode;
}

export const FirebaseAppCheckProvider: React.FC<FirebaseAppCheckProviderProps> = ({ children }) => {
  const [appCheckToken, setAppCheckToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAppCheckToken = async () => {
    setLoading(true);
    try {
      if (appCheck) { // Use the exported appCheck instance
        const { token } = await getToken(appCheck, true);
        setAppCheckToken(token);
      } else {
        console.warn('App Check is not initialized. Cannot refresh token.');
        setAppCheckToken(null);
      }
    } catch (error) {
      console.error('Error refreshing App Check token:', error);
      setAppCheckToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && appCheck) { // Check if appCheck is available
      // Get the initial token
      getToken(appCheck, true) // Use the exported appCheck instance
        .then(({ token }) => {
          setAppCheckToken(token);
        })
        .catch((error) => {
          console.error('Error getting initial App Check token:', error);
          setAppCheckToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [appCheck]); // Add appCheck to dependency array

  return (
    <AppCheckContext.Provider value={{ appCheckToken, loading, refreshAppCheckToken }}>
      {children}
    </AppCheckContext.Provider>
  );
};
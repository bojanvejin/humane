'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { getToken } from '@firebase/app-check'; // Corrected: getToken is from @firebase/app-check
import { getAppCheck } from 'firebase/app-check'; // Import getAppCheck
import app from '@/lib/firebase'; // Corrected import for 'app'

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
      const appCheckInstance = getAppCheck(app); // Get the already initialized App Check instance
      const { token } = await getToken(appCheckInstance, true);
      setAppCheckToken(token);
    } catch (error) {
      console.error('Error refreshing App Check token:', error);
      setAppCheckToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      const appCheckInstance = getAppCheck(app); // Get the already initialized App Check instance
      
      // Get the initial token
      getToken(appCheckInstance, true)
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
  }, []);

  return (
    <AppCheckContext.Provider value={{ appCheckToken, loading, refreshAppCheckToken }}>
      {children}
    </AppCheckContext.Provider>
  );
};
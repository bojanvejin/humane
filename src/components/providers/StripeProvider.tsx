'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface StripeContextType {
  stripePromise: Promise<Stripe | null> | null;
  loading: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file.');
      setLoading(false);
      return;
    }

    const promise = loadStripe(publishableKey);
    setStripePromise(promise);
    setLoading(false);
  }, []);

  const options: StripeElementsOptions = {
    // You can add global Stripe Elements options here if needed
    // For example, to set a default locale: locale: 'en',
  };

  return (
    <StripeContext.Provider value={{ stripePromise, loading }}>
      {stripePromise && !loading ? (
        <Elements stripe={stripePromise} options={options}>
          {children}
        </Elements>
      ) : (
        // You might want to render a loading spinner or fallback UI here
        <div className="flex items-center justify-center min-h-screen">
          {loading ? 'Loading payment services...' : 'Payment services unavailable.'}
        </div>
      )}
    </StripeContext.Provider>
  );
};
import { useState, useEffect } from 'react';
import { account, databases } from '@humane/lib/appwrite'; // Import Appwrite account and databases
import { ID, Models } from 'appwrite'; // Import Appwrite ID and Models
import { User } from '@/types';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appwriteAccount, setAppwriteAccount] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const USERS_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentAccount = await account.get();
        setAppwriteAccount(currentAccount);

        // Fetch user document from Appwrite database
        const userDoc = await databases.getDocument(
          USERS_DATABASE_ID,
          USERS_COLLECTION_ID,
          currentAccount.$id
        );
        setUser(userDoc as unknown as User); // Cast to User type
      } catch (error: any) {
        if (error.code === 401) { // User not logged in
          setAppwriteAccount(null);
          setUser(null);
        } else {
          console.error('Error fetching Appwrite user:', error);
          toast.error('Failed to load user session.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // Appwrite doesn't have a direct onAuthStateChanged equivalent like Firebase.
    // We'll rely on explicit calls after login/logout or a periodic check if needed.
    // For now, a single fetch on mount is sufficient.
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await fetchCurrentUserAndProfile(); // Refresh user state after login
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('Appwrite email login error:', error);
      toast.error(error.message || 'Failed to log in with email.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const newAppwriteAccount = await account.create(ID.unique(), email, password, displayName);
      // After creating the account, create a session
      await account.createEmailPasswordSession(email, password);

      // Create user document in Appwrite database
      const newUser: User = {
        id: newAppwriteAccount.$id,
        email: newAppwriteAccount.email,
        displayName: displayName,
        photoURL: undefined, // Appwrite doesn't provide photoURL directly on account creation
        role: 'fan', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await databases.createDocument(
        USERS_DATABASE_ID,
        USERS_COLLECTION_ID,
        newAppwriteAccount.$id,
        newUser
      );

      await fetchCurrentUserAndProfile(); // Refresh user state after signup
      toast.success('Account created and logged in successfully!');
    } catch (error: any) {
      console.error('Appwrite email signup error:', error);
      toast.error(error.message || 'Failed to sign up with email.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // Appwrite's OAuth flow typically redirects.
      // For a client-side flow, you'd initiate the OAuth process.
      // This example assumes a redirect-based flow.
      await account.createOAuth2Session('google', 'http://localhost:3000', 'http://localhost:3000/login');
      // The page will reload after OAuth, and fetchUser will run again.
    } catch (error: any) {
      console.error('Appwrite Google login error:', error);
      toast.error(error.message || 'Failed to log in with Google.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await account.deleteSession('current');
      setAppwriteAccount(null);
      setUser(null);
      toast.info('Logged out successfully.');
    } catch (error: any) {
      console.error('Appwrite logout error:', error);
      toast.error(error.message || 'Failed to log out.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserAndProfile = async () => {
    try {
      const currentAccount = await account.get();
      setAppwriteAccount(currentAccount);
      const userDoc = await databases.getDocument(
        USERS_DATABASE_ID,
        USERS_COLLECTION_ID,
        currentAccount.$id
      );
      setUser(userDoc as unknown as User);
    } catch (error) {
      console.error('Error refreshing user and profile:', error);
      setAppwriteAccount(null);
      setUser(null);
    }
  };

  const hasRole = (requiredRole: User['role']) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles: User['role'][]) => {
    return user ? requiredRoles.includes(user.role) : false;
  };

  return {
    user,
    appwriteAccount, // Renamed from firebaseUser
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    hasRole,
    hasAnyRole,
  };
};
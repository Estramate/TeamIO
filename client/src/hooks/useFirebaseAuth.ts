/**
 * Firebase authentication hook - Google only
 * Simplified implementation without Facebook support
 */

import { useState, useEffect } from 'react';
import { 
  signInWithGoogle, 
  signOut, 
  onAuthStateChange, 
  getCurrentUser,
  authenticateWithBackend,
  type FirebaseUser 
} from '@/lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    console.log('Setting up Firebase auth state listener...');
    
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Firebase auth state changed:', { user: !!user, uid: user?.uid });
      
      if (user) {
        try {
          // Authenticate with backend when user signs in
          await authenticateWithBackend(user);
          setAuthState({ user, loading: false, error: null });
        } catch (error) {
          console.error('Backend authentication failed:', error);
          setAuthState({ 
            user: null, 
            loading: false, 
            error: error instanceof Error ? error.message : 'Authentication failed' 
          });
        }
      } else {
        setAuthState({ user: null, loading: false, error: null });
      }
    });

    // Check if user is already signed in
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log('User already signed in:', currentUser.uid);
    }

    return () => {
      console.log('Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const signInWithGooglePopup = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Starting Google sign-in flow...');
      
      const user = await signInWithGoogle();
      console.log('Google sign-in completed, user:', user.uid);
      
      // Backend authentication is handled in onAuthStateChange
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      console.error('Google sign-in error:', errorMessage);
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Starting sign-out...');
      
      await signOut();
      console.log('Firebase sign-out completed');
      
      // Clear any backend session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (logoutError) {
        console.warn('Backend logout failed (non-critical):', logoutError);
      }
      
      setAuthState({ user: null, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-out failed';
      console.error('Sign-out error:', errorMessage);
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithGoogle: signInWithGooglePopup,
    signOut: handleSignOut,
    isAuthenticated: !!authState.user,
  };
}
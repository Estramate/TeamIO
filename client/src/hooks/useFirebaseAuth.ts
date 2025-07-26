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
  checkRedirectResult,
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

  // Listen to Firebase auth state changes and check for redirect result
  useEffect(() => {
    // Setting up Firebase auth state listener
    
    // Check for redirect result first
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        // Found redirect result user: redirectUser.uid
      }
    }).catch((error) => {
      console.error('Error checking redirect result:', error);
    });
    
    const unsubscribe = onAuthStateChange(async (user) => {
      // Firebase auth state changed: { user: !!user, uid: user?.uid }
      
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
    // User already signed in check completed

    return () => {
      // Cleaning up Firebase auth listener
      unsubscribe();
    };
  }, []);

  const signInWithGooglePopup = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      // Starting Google sign-in flow
      const user = await signInWithGoogle();
      // Google sign-in completed
      
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
      // Starting sign-out
      await signOut();
      // Firebase sign-out completed
      
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
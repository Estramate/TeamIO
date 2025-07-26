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
    let isComponentMounted = true;
    
    // Setting up Firebase auth state listener
    console.log('🔧 Setting up Firebase auth listener...');
    
    // Check for redirect result first (important for production)
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser && isComponentMounted) {
        console.log('🔄 Found redirect result user:', redirectUser.uid);
        // Don't set state here - let onAuthStateChange handle it
      }
    }).catch((error) => {
      console.error('Error checking redirect result:', error);
    });
    
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!isComponentMounted) return;
      
      console.log('🔥 Firebase auth state changed:', { 
        hasUser: !!user, 
        uid: user?.uid,
        email: user?.email 
      });
      
      if (user) {
        try {
          // Avoid double authentication by checking current state
          if (authState.user?.uid === user.uid) {
            console.log('⚡ User already authenticated, skipping backend call');
            return;
          }
          
          setAuthState(prev => ({ ...prev, loading: true }));
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
    if (currentUser && isComponentMounted) {
      console.log('👤 User already signed in on mount:', currentUser.uid);
    }

    return () => {
      console.log('🧹 Cleaning up Firebase auth listener');
      isComponentMounted = false;
      unsubscribe();
    };
  }, []); // Remove authState dependency to prevent infinite loops

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
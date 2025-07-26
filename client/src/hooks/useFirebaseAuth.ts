/**
 * React hook for Firebase authentication management
 * Provides Google and Facebook sign-in functionality
 */

import { useState, useEffect } from 'react';
import { 
  signInWithGoogle, 
  signInWithFacebook,
  signInWithGoogleRedirect,
  signInWithFacebookRedirect,
  handleAuthRedirect,
  signOut,
  onAuthStateChange,
  getCurrentUser,
  extractUserData
} from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  // Simplified auth state management - no automatic backend sync
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        console.log('Firebase user authenticated:', { uid: user.uid, email: user.email });
        setAuthState({ user, loading: false, error: null });
      } else {
        setAuthState({ user: null, loading: false, error: null });
      }
    });

    // Check for redirect result on app load
    handleAuthRedirect().catch(console.error);

    return () => unsubscribe();
  }, []);

  // Simplified Google sign-in with immediate backend sync
  const signInWithGooglePopup = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Perform Firebase authentication
      const userCredential = await signInWithGoogle();
      const user = userCredential?.user;
      
      if (!user) {
        throw new Error('No user returned from Firebase');
      }
      
      console.log('Firebase authentication successful:', { uid: user.uid, email: user.email });
      
      // Immediately sync with backend
      const userData = extractUserData(user);
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Backend sync failed' }));
        throw new Error(`Backend sync failed: ${errorData.error}`);
      }
      
      const result = await response.json();
      console.log('Backend sync successful:', result);
      
      setAuthState({ user, loading: false, error: null });
      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen, ${user.displayName || user.email}!`,
      });
      
      // Reload page to pick up new authentication state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Sign out from Firebase if backend sync failed
      try {
        await signOut();
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      
      const errorMessage = error?.code === 'auth/popup-closed-by-user' 
        ? 'Anmeldung wurde abgebrochen'
        : `Anmeldung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`;
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Facebook sign-in with popup
  const signInWithFacebookPopup = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithFacebook();
      // Auth state change will handle the rest
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      const errorMessage = error?.code === 'auth/popup-closed-by-user'
        ? 'Anmeldung wurde abgebrochen'
        : 'Facebook-Anmeldung fehlgeschlagen';
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Google sign-in with redirect (better for mobile)
  const signInWithGoogleRedirectMethod = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error('Google redirect sign-in error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'Google-Anmeldung fehlgeschlagen' }));
    }
  };

  // Facebook sign-in with redirect (better for mobile)
  const signInWithFacebookRedirectMethod = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithFacebookRedirect();
    } catch (error) {
      console.error('Facebook redirect sign-in error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'Facebook-Anmeldung fehlgeschlagen' }));
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Sign out from Firebase
      await signOut();
      
      // Sign out from backend
      await fetch('/api/auth/firebase/logout', {
        method: 'POST',
      });
      
      setAuthState({ user: null, loading: false, error: null });
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Sie wurden sicher abgemeldet.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'Abmeldung fehlgeschlagen' }));
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithGooglePopup,
    signInWithFacebookPopup,
    signInWithGoogleRedirectMethod,
    signInWithFacebookRedirectMethod,
    // Legacy aliases for backward compatibility
    signInWithGoogle: signInWithGooglePopup,
    signInWithFacebook: signInWithFacebookPopup,
    signInWithGoogleRedirect: signInWithGoogleRedirectMethod,
    signInWithFacebookRedirect: signInWithFacebookRedirectMethod,
    signOut: handleSignOut,
    isAuthenticated: !!authState.user,
  };
}
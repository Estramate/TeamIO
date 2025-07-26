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

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        if (user) {
          // User signed in, send to backend
          const userData = extractUserData(user);
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'  // Bypass some middleware
            },
            body: JSON.stringify({ userData }),
            credentials: 'include', // Include cookies for session
          });
          
          if (response.ok) {
            setAuthState({ user, loading: false, error: null });
            toast({
              title: "Erfolgreich angemeldet",
              description: `Willkommen zurück, ${user.displayName || user.email}!`,
            });
            
            // No automatic redirect - let React handle state changes
          } else {
            const errorText = await response.text();
            console.error('Backend response:', response.status, errorText);
            // Don't throw error for authentication failures to prevent infinite loops
            setAuthState({ user: null, loading: false, error: 'Backend-Synchronisation fehlgeschlagen' });
          }
        } else {
          // User signed out
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({ user: null, loading: false, error: 'Anmeldung fehlgeschlagen' });
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: "Backend-Synchronisation fehlgeschlagen. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    });

    // Check for redirect result on app load
    handleAuthRedirect().catch(console.error);

    return () => unsubscribe();
  }, [toast]);

  // Google sign-in with popup
  const signInWithGooglePopup = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithGoogle();
      // Auth state change will handle the rest
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const errorMessage = error?.code === 'auth/popup-closed-by-user' 
        ? 'Anmeldung wurde abgebrochen'
        : 'Google-Anmeldung fehlgeschlagen';
      
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
    signInWithGoogle: signInWithGooglePopup,
    signInWithFacebook: signInWithFacebookPopup,
    signInWithGoogleRedirect: signInWithGoogleRedirectMethod,
    signInWithFacebookRedirect: signInWithFacebookRedirectMethod,
    signOut: handleSignOut,
    isAuthenticated: !!authState.user,
  };
}
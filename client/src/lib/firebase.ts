/**
 * Firebase configuration for Google authentication only
 * Clean implementation without Facebook support
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google using popup with fallback to redirect
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    console.log('Starting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google sign-in successful:', {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    });
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in popup error:', error);
    
    // If popup fails, try redirect method
    if (error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/cancelled-popup-request') {
      console.log('Popup failed, trying redirect method...');
      try {
        await signInWithRedirect(auth, googleProvider);
        // The redirect will happen, so we don't return anything here
        throw new Error('Redirecting to Google sign-in...');
      } catch (redirectError) {
        console.error('Redirect sign-in also failed:', redirectError);
        throw new Error('Google sign-in failed. Please try again.');
      }
    }
    
    throw error;
  }
};

/**
 * Check for redirect result on page load
 */
export const checkRedirectResult = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Redirect sign-in successful:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Redirect result error:', error);
    return null;
  }
};

/**
 * Sign out from Firebase
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('Firebase sign-out successful');
  } catch (error) {
    console.error('Firebase sign-out error:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Extract user data for backend API
 */
export const extractUserData = (user: FirebaseUser) => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    authProvider: 'google',
    providerUserId: user.uid,
    providerData: {
      providerId: user.providerData[0]?.providerId || 'google.com',
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
    },
  };
};

/**
 * Send user data to backend after Firebase authentication
 */
export const authenticateWithBackend = async (user: FirebaseUser): Promise<boolean> => {
  try {
    console.log('Sending user data to backend...');
    const userData = extractUserData(user);
    
    const response = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend authentication failed:', errorData);
      throw new Error(`Backend auth failed: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Backend authentication successful:', result);
    return true;
  } catch (error) {
    console.error('Backend authentication error:', error);
    throw error;
  }
};
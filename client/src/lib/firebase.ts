/**
 * Firebase configuration for Google and Facebook authentication
 * Supports multiple authentication providers alongside existing Replit auth
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  FacebookAuthProvider,
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

// Configure providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

/**
 * Sign in with Google using popup
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Facebook using popup
 */
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google using redirect (better for mobile)
 */
export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, googleProvider);
};

/**
 * Sign in with Facebook using redirect (better for mobile)
 */
export const signInWithFacebookRedirect = () => {
  return signInWithRedirect(auth, facebookProvider);
};

/**
 * Handle redirect result after OAuth redirect
 */
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Auth redirect error:', error);
    throw error;
  }
};

/**
 * Sign out from Firebase
 */
export const signOut = () => {
  return firebaseSignOut(auth);
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
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Extract user data for backend API
 */
export const extractUserData = (user: FirebaseUser) => {
  return {
    uid: user.uid,  // Backend expects 'uid' not 'id'
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    authProvider: getProviderFromProviderId(user.providerData[0]?.providerId),
    providerUserId: user.uid,
    providerData: {
      providerId: user.providerData[0]?.providerId,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
    },
  };
};

/**
 * Helper to determine auth provider from provider ID
 */
const getProviderFromProviderId = (providerId?: string): string => {
  switch (providerId) {
    case 'google.com':
      return 'google';
    case 'facebook.com':
      return 'facebook';
    default:
      return 'firebase';
  }
};
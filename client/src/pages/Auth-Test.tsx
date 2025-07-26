import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";

export default function AuthTest() {
  const { signInWithGooglePopup, loading, error, user } = useFirebaseAuth();
  const [backendUser, setBackendUser] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in test...');
      await signInWithGooglePopup();
    } catch (error) {
      console.error('Auth test error:', error);
    }
  };

  const testBackendAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setBackendUser(userData);
        setBackendError(null);
      } else {
        const errorData = await response.json();
        setBackendError(errorData.message || 'Backend authentication failed');
        setBackendUser(null);
      }
    } catch (error) {
      setBackendError('Network error');
      setBackendUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Authentication Test</CardTitle>
            <CardDescription>Test der vollständigen Authentifizierungskette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Firebase Status */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Firebase Status</h3>
              {user ? (
                <div className="bg-green-50 p-3 rounded border">
                  <p className="text-green-700 font-medium">✓ Firebase User authenticated</p>
                  <p className="text-sm text-green-600">UID: {user.uid}</p>
                  <p className="text-sm text-green-600">Email: {user.email}</p>
                  <p className="text-sm text-green-600">Name: {user.displayName}</p>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded border">
                  <p className="text-red-700">✗ Nicht angemeldet</p>
                </div>
              )}
            </div>

            {/* Google Sign-In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaGoogle className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Anmeldung läuft...' : 'Mit Google anmelden'}
            </Button>

            {error && (
              <div className="bg-red-50 p-3 rounded border">
                <p className="text-red-700">Fehler: {error}</p>
              </div>
            )}

            {/* Backend Test */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Backend Authentifizierung</h3>
              <Button
                onClick={testBackendAuth}
                variant="outline"
                className="w-full"
              >
                Backend-Authentifizierung testen
              </Button>
              
              {backendUser ? (
                <div className="bg-green-50 p-3 rounded border">
                  <p className="text-green-700 font-medium">✓ Backend User authenticated</p>
                  <p className="text-sm text-green-600">ID: {backendUser.id}</p>
                  <p className="text-sm text-green-600">Email: {backendUser.email}</p>
                  <p className="text-sm text-green-600">Provider: {backendUser.authProvider}</p>
                </div>
              ) : backendError ? (
                <div className="bg-red-50 p-3 rounded border">
                  <p className="text-red-700">✗ {backendError}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Zurück zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
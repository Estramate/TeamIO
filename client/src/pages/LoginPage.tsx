/**
 * Login page with multiple authentication options
 * Supports Google, Facebook, and Replit authentication
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useFirebaseAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && !loading) {
      setLocation('/');
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleLoginSuccess = () => {
    setLocation('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Anmeldung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Welcome Card */}
        <Card className="text-center border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-primary" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              TeamIO
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              Vereinsverwaltung für die Zukunft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SocialLoginButtons 
              title="Anmelden"
              description="Wählen Sie Ihre bevorzugte Anmeldemethode"
              onSuccess={handleLoginSuccess}
            />
          </CardContent>
        </Card>

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Neuer Benutzer?</strong> Sie können sich mit allen drei Optionen anmelden. 
            Replit wird für die beste Erfahrung empfohlen.
          </AlertDescription>
        </Alert>

        {/* Back to Landing */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Zurück zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
/**
 * Login page with multiple authentication options
 * Supports Google, Facebook, and Replit authentication
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
              Willkommen bei TeamIO
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Professionelles Vereinsmanagement für moderne Sportvereine
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Options */}
        <SocialLoginButtons 
          onSuccess={handleLoginSuccess}
          title="Anmelden"
          description="Wählen Sie eine Anmeldemethode"
          showExistingAuth={true}
        />

        {/* Information Card */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Neuer Benutzer?</strong> Sie können sich mit Google oder Facebook anmelden und später einem Verein beitreten. 
            Eine direkte Vereinszuordnung ist nicht erforderlich.
          </AlertDescription>
        </Alert>

        {/* Features Preview */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Was Sie erwartet:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Mitgliederverwaltung
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Team- und Spielerorganisation
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Facility-Buchungen
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                Kommunikation & Nachrichten
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                Finanzverwaltung
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
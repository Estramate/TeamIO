/**
 * Social login buttons component - Google authentication only
 * Clean implementation without Facebook support
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { FaGoogle } from "react-icons/fa";
import { SiReplit } from "react-icons/si";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
  showExistingAuth?: boolean;
}

export function SocialLoginButtons({ 
  onSuccess, 
  title = "Anmelden", 
  description = "Wählen Sie eine Anmeldemethode",
  showExistingAuth = true 
}: SocialLoginButtonsProps) {
  const { 
    signInWithGoogle, 
    loading, 
    error 
  } = useFirebaseAuth();

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in from button...');
      await signInWithGoogle();
      console.log('Google sign-in successful from button');
      onSuccess?.();
    } catch (error) {
      console.error('Google sign-in button error:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Replit Login */}
          {showExistingAuth && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => window.location.href = '/api/login'}
              >
                <SiReplit className="w-5 h-5 text-blue-600" />
                Mit Replit anmelden
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">oder</span>
                </div>
              </div>
            </>
          )}
          
          {/* Google Login */}
          <Button
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FaGoogle className="w-5 h-5 text-red-500" />
            )}
            {loading ? 'Anmeldung läuft...' : 'Mit Google anmelden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
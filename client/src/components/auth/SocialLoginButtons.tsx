/**
 * Social login buttons component for Google and Facebook authentication
 * Provides accessible, responsive login options
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { SiReplit } from "react-icons/si";
import { Loader2 } from "lucide-react";

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
    signInWithGooglePopup, 
    signInWithGoogleRedirectMethod,
    signInWithFacebookPopup, 
    signInWithFacebookRedirectMethod,
    loading, 
    error 
  } = useFirebaseAuth();

  const handleGoogleSignIn = async () => {
    try {
      // Use redirect instead of popup for better compatibility
      if (window.innerWidth < 768) {
        // Mobile: always use redirect
        await signInWithGoogleRedirectMethod();
      } else {
        // Desktop: try popup first, fallback to redirect
        try {
          await signInWithGooglePopup();
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            console.log('Popup blocked or closed, trying redirect...');
            await signInWithGoogleRedirectMethod();
          } else {
            throw popupError;
          }
        }
      }
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      // Use redirect instead of popup for better compatibility  
      if (window.innerWidth < 768) {
        // Mobile: always use redirect
        await signInWithFacebookRedirectMethod();
      } else {
        // Desktop: try popup first, fallback to redirect
        try {
          await signInWithFacebookPopup();
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            console.log('Popup blocked or closed, trying redirect...');
            await signInWithFacebookRedirectMethod();
          } else {
            throw popupError;
          }
        }
      }
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Replit Login Button - Primary */}
          <Button
            size="lg"
            className="w-full h-12 bg-primary hover:bg-primary/90 font-medium"
            onClick={() => window.location.href = "/api/login"}
          >
            <SiReplit className="mr-2 h-5 w-5" />
            Mit Replit anmelden
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Empfohlene Option für die beste Erfahrung
          </p>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 text-base font-medium border-2 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
            )}
            Mit Google anmelden
          </Button>

          {/* Facebook Login Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 text-base font-medium border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
            onClick={handleFacebookSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FaFacebook className="mr-2 h-5 w-5 text-blue-600" />
            )}
            Mit Facebook anmelden
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact social login buttons for navigation or small spaces
 */
export function CompactSocialLoginButtons() {
  const { signInWithGoogle, signInWithFacebook, loading } = useFirebaseAuth();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={signInWithGoogle}
        disabled={loading}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FaGoogle className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={signInWithFacebook}
        disabled={loading}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FaFacebook className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = '/api/login'}
        className="flex-1"
      >
        <SiReplit className="h-4 w-4" />
      </Button>
    </div>
  );
}
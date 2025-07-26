/**
 * Social login buttons component for Google and Facebook authentication
 * Provides accessible, responsive login options
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { FaGoogle, FaFacebook } from "react-icons/fa";
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
    signInWithGoogle, 
    signInWithFacebook, 
    loading, 
    error 
  } = useFirebaseAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Login Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-medium border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
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
          className="w-full h-12 text-base font-medium border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
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

        {/* Separator and existing auth options */}
        {showExistingAuth && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Oder
                </span>
              </div>
            </div>

            {/* Replit Auth Link */}
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = '/api/login'}
              >
                Mit Replit-Konto anmelden
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
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
    </div>
  );
}
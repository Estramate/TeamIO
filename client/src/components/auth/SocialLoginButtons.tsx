/**
 * Social login buttons component - Replit authentication only
 * Simplified implementation without Google/Firebase support
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiReplit } from "react-icons/si";

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function SocialLoginButtons({ 
  onSuccess, 
  title = "Anmelden", 
  description = "Wählen Sie Ihre bevorzugte Anmeldemethode"
}: SocialLoginButtonsProps) {

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Replit Login */}
          <Button
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 h-12 text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => window.location.href = '/api/login'}
          >
            <SiReplit className="w-5 h-5 text-blue-600" />
            Mit Replit anmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
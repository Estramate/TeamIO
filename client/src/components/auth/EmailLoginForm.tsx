import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface EmailLoginFormProps {
  onSuccess?: () => void;
  onSwitchToReplit?: () => void;
}

export function EmailLoginForm({ onSuccess, onSwitchToReplit }: EmailLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const endpoint = loginStep === 'credentials' 
        ? '/api/auth/login' 
        : '/api/auth/login/verify-2fa';
      
      return await apiRequest('POST', endpoint, data);
    },
    onSuccess: (result: any) => {
      if (result?.requires2FA) {
        setRequires2FA(true);
        setLoginStep('2fa');
        toast({
          title: '🔐 2FA-Bestätigung erforderlich',
          description: 'Geben Sie den Code aus Ihrer Authenticator-App ein.',
        });
      } else {
        toast({
          title: '✅ Erfolgreich angemeldet',
          description: 'Willkommen zurück!',
        });
        // Redirect to app
        window.location.href = '/';
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Anmeldung fehlgeschlagen';
      
      if (errorMessage.includes('2FA')) {
        toast({
          title: '❌ 2FA-Code ungültig',
          description: 'Bitte überprüfen Sie den Code und versuchen Sie es erneut.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Anmeldung fehlgeschlagen',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setRequires2FA(false);
    form.setValue('twoFactorCode', '');
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          {loginStep === 'credentials' ? 'E-Mail Anmeldung' : '2FA-Bestätigung'}
        </CardTitle>
        <CardDescription>
          {loginStep === 'credentials' 
            ? 'Melden Sie sich mit Ihrer E-Mail-Adresse an'
            : 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {loginStep === 'credentials' && (
            <>
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.com"
                    className="pl-9"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ihr Passwort"
                    className="pl-9 pr-9"
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </>
          )}

          {loginStep === '2fa' && (
            <>
              {/* 2FA Code Input */}
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">2FA-Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="123456"
                    className="pl-9 text-center tracking-widest"
                    maxLength={6}
                    {...form.register('twoFactorCode')}
                    autoComplete="one-time-code"
                  />
                </div>
                {form.formState.errors.twoFactorCode && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.twoFactorCode.message}
                  </p>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Öffnen Sie Ihre Authenticator-App (Google Authenticator, Authy, etc.) 
                  und geben Sie den aktuellen 6-stelligen Code ein.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loginStep === 'credentials' ? 'Anmelden' : 'Code bestätigen'}
          </Button>

          {/* Navigation Buttons */}
          <div className="space-y-2">
            {loginStep === '2fa' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackToCredentials}
              >
                ← Zurück zur Anmeldung
              </Button>
            )}
            
            {onSwitchToReplit && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onSwitchToReplit}
              >
                Oder mit Replit anmelden
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
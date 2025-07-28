import { useState, useEffect } from 'react';
import { Bell, Settings, Volume2, VolumeX, Monitor, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    isDesktopSupported,
    desktopPermission,
    isSoundEnabled,
    activeNotifications,
    requestDesktopPermission,
    toggleSound,
    clearAllNotifications,
    showInfo,
    showSuccess,
    showWarning,
    showError
  } = useNotifications();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Test different notification types
  const testNotifications = {
    info: () => showInfo('Test Info', 'Dies ist eine Informationsbenachrichtigung'),
    success: () => showSuccess('Test Erfolg', 'Operation erfolgreich abgeschlossen'),
    warning: () => showWarning('Test Warnung', 'Bitte beachten Sie diese wichtige Information'),
    error: () => showError('Test Fehler', 'Ein kritischer Fehler ist aufgetreten')
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Active notifications indicator */}
      {activeNotifications > 0 && (
        <Badge variant="destructive" className="animate-pulse">
          {activeNotifications} aktiv
        </Badge>
      )}

      {/* Main notification center dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {activeNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                {activeNotifications}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Benachrichtigungen
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Benachrichtigungseinstellungen</DialogTitle>
                  <DialogDescription>
                    Konfigurieren Sie Ihre Benachrichtigungspräferenzen
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Desktop Notifications */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Desktop-Benachrichtigungen
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Erhalten Sie Benachrichtigungen auch wenn die App nicht geöffnet ist
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {!isDesktopSupported ? (
                        <p className="text-sm text-muted-foreground">
                          Ihr Browser unterstützt keine Desktop-Benachrichtigungen
                        </p>
                      ) : desktopPermission === 'denied' ? (
                        <p className="text-sm text-destructive">
                          Desktop-Benachrichtigungen wurden abgelehnt. Bitte in den Browser-Einstellungen aktivieren.
                        </p>
                      ) : desktopPermission === 'granted' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">Aktiviert</span>
                          <Badge variant="secondary">Erlaubt</Badge>
                        </div>
                      ) : (
                        <Button 
                          onClick={requestDesktopPermission}
                          size="sm"
                          className="w-full"
                        >
                          Berechtigung anfordern
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sound Settings */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        Sound-Benachrichtigungen
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Akustische Benachrichtigungen für wichtige Ereignisse
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sounds aktiviert</span>
                        <Switch 
                          checked={isSoundEnabled}
                          onCheckedChange={toggleSound}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Notifications */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Test-Benachrichtigungen</CardTitle>
                      <CardDescription className="text-xs">
                        Testen Sie verschiedene Benachrichtigungstypen
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" onClick={testNotifications.info}>
                          Info
                        </Button>
                        <Button size="sm" variant="outline" onClick={testNotifications.success}>
                          Erfolg
                        </Button>
                        <Button size="sm" variant="outline" onClick={testNotifications.warning}>
                          Warnung
                        </Button>
                        <Button size="sm" variant="outline" onClick={testNotifications.error}>
                          Fehler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {activeNotifications > 0 ? (
            <>
              <DropdownMenuItem onClick={clearAllNotifications} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Alle schließen ({activeNotifications})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}

          {/* Status indicators */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Desktop-Benachrichtigungen:</span>
              <Badge variant={desktopPermission === 'granted' ? 'default' : 'secondary'}>
                {desktopPermission === 'granted' ? 'Aktiv' : 
                 desktopPermission === 'denied' ? 'Blockiert' : 'Nicht aktiviert'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Sound-Alerts:</span>
              <Badge variant={isSoundEnabled ? 'default' : 'secondary'}>
                {isSoundEnabled ? 'Ein' : 'Aus'}
              </Badge>
            </div>
          </div>
          
          {!isDesktopSupported && (
            <div className="p-3 text-xs text-muted-foreground border-t">
              💡 Für die beste Erfahrung verwenden Sie einen modernen Browser
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Smart notification component that can be embedded anywhere
export function SmartNotificationTrigger({ 
  title, 
  message, 
  type = 'info',
  priority = 'normal',
  children 
}: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  children: React.ReactNode;
}) {
  const { showNotification } = useNotifications();

  const handleClick = () => {
    showNotification({ title, message, type, priority });
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}
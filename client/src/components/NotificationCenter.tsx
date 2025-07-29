import { useState, useEffect } from 'react';
import { Bell, Sliders, Volume2, VolumeX, Monitor, X } from 'lucide-react';
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
// ENTFERNT - NotificationSettingsModal komplett entfernt auf Benutzerwunsch

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
  // ENTFERNT - isAdvancedSettingsOpen State komplett entfernt

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
            {/* ENTFERNT - Settings Button für erweiterte Einstellungen */}
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
      
      {/* ENTFERNT - Advanced Settings Modal auf Benutzerwunsch komplett entfernt */}
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
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useClub } from '@/hooks/use-club';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Volume2, Zap, X } from 'lucide-react';

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface NotificationPreferences {
  id?: number;
  userId: string;
  clubId: number | null;
  
  // Desktop notifications
  desktopNotificationsEnabled: boolean;
  desktopPermissionGranted: boolean;
  
  // Sound notifications  
  soundNotificationsEnabled: boolean;
  soundVolume: string;
  
  // Test notification preferences
  testNotificationsEnabled: boolean;
  testNotificationTypes: {
    info: boolean;
    success: boolean; 
    warning: boolean;
    error: boolean;
  };
  
  // Communication preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  emailDigest: string;
  
  // Event-specific notification settings
  newMessageNotifications: boolean;
  announcementNotifications: boolean;
  eventReminderNotifications: boolean;
  paymentDueNotifications: boolean;
  systemAlertNotifications: boolean;
}

export default function NotificationSettingsModal({ open, onClose }: NotificationSettingsModalProps) {
  const { selectedClub } = useClub();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  // Fetch current notification preferences
  const { data: currentPreferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['/api/clubs', selectedClub?.id, 'notification-preferences'],
    enabled: open && !!selectedClub?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
    
    // Check current desktop notification permission
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, [currentPreferences]);

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      return await apiRequest(`/api/clubs/${selectedClub?.id}/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      setPreferences(data);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', selectedClub?.id, 'notification-preferences'] 
      });
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Benachrichtigungseinstellungen wurden aktualisiert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Einstellungen",
        variant: "destructive",
      });
    }
  });

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      
      if (permission === 'granted' && preferences) {
        updatePreferencesMutation.mutate({
          desktopNotificationsEnabled: true,
          desktopPermissionGranted: true
        });
      }
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    const updates = { [key]: value };
    updatePreferencesMutation.mutate(updates);
  };

  const updateTestNotificationType = (type: keyof NotificationPreferences['testNotificationTypes'], enabled: boolean) => {
    if (!preferences) return;
    
    const newTestTypes = {
      ...preferences.testNotificationTypes,
      [type]: enabled
    };
    
    updatePreferencesMutation.mutate({
      testNotificationTypes: newTestTypes
    });
  };

  const sendTestNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
    const messages = {
      info: { title: 'Info', description: 'Dies ist eine Test-Info-Benachrichtigung' },
      success: { title: 'Erfolg', description: 'Dies ist eine Test-Erfolgs-Benachrichtigung' },
      warning: { title: 'Warnung', description: 'Dies ist eine Test-Warn-Benachrichtigung' },
      error: { title: 'Fehler', description: 'Dies ist eine Test-Fehler-Benachrichtigung' }
    };

    toast({
      title: messages[type].title,
      description: messages[type].description,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  if (!open) return null;
  if (isLoading || !preferences) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Benachrichtigungseinstellungen</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Lade Einstellungen...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Benachrichtigungseinstellungen</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Konfigurieren Sie Ihre Benachrichtigungspräferenzen
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Desktop Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Desktop-Benachrichtigungen</CardTitle>
                  <CardDescription className="text-sm">
                    Erhalten Sie Benachrichtigungen auch wenn die App nicht geöffnet ist
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {desktopPermission === 'default' && (
                <div className="text-sm text-muted-foreground">
                  Ihr Browser unterstützt keine Desktop-Benachrichtigungen
                </div>
              )}
              {desktopPermission === 'denied' && (
                <div className="text-sm text-red-600">
                  Desktop-Benachrichtigungen wurden blockiert
                </div>
              )}
              {desktopPermission === 'granted' ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Desktop-Benachrichtigungen aktiviert</span>
                  <Switch 
                    checked={preferences.desktopNotificationsEnabled}
                    onCheckedChange={(checked) => updatePreference('desktopNotificationsEnabled', checked)}
                  />
                </div>
              ) : (
                <Button 
                  onClick={requestDesktopPermission}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Berechtigung anfordern
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Sound Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Sound-Benachrichtigungen</CardTitle>
                  <CardDescription className="text-sm">
                    Akustische Benachrichtigungen für wichtige Ereignisse
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sounds aktiviert</span>
                <Switch 
                  checked={preferences.soundNotificationsEnabled}
                  onCheckedChange={(checked) => updatePreference('soundNotificationsEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Test-Benachrichtigungen</CardTitle>
                  <CardDescription className="text-sm">
                    Testen Sie verschiedene Benachrichtigungstypen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(preferences.testNotificationTypes).map(([type, enabled]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type === 'info' ? 'Info' : type === 'success' ? 'Erfolg' : type === 'warning' ? 'Warnung' : 'Fehler'}</span>
                      <Switch 
                        checked={enabled}
                        onCheckedChange={(checked) => updateTestNotificationType(type as any, checked)}
                      />
                    </div>
                    {enabled && (
                      <Button 
                        onClick={() => sendTestNotification(type as any)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Test
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Communication Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Kommunikationseinstellungen</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">E-Mail Benachrichtigungen</span>
                  <p className="text-xs text-muted-foreground">Erhalten Sie E-Mails für neue Nachrichten</p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Push Benachrichtigungen</span>
                  <p className="text-xs text-muted-foreground">Erhalten Sie sofortige Benachrichtigungen</p>
                </div>
                <Switch 
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Neue Nachrichten</span>
                  <p className="text-xs text-muted-foreground">Benachrichtigungen für neue Chat-Nachrichten</p>
                </div>
                <Switch 
                  checked={preferences.newMessageNotifications}
                  onCheckedChange={(checked) => updatePreference('newMessageNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Ankündigungen</span>
                  <p className="text-xs text-muted-foreground">Wichtige Vereinsankündigungen</p>
                </div>
                <Switch 
                  checked={preferences.announcementNotifications}
                  onCheckedChange={(checked) => updatePreference('announcementNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">System-Benachrichtigungen</span>
                  <p className="text-xs text-muted-foreground">Wichtige Systemupdates und Wartungen</p>
                </div>
                <Switch 
                  checked={preferences.systemAlertNotifications}
                  onCheckedChange={(checked) => updatePreference('systemAlertNotifications', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
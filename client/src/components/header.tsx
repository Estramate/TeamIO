import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, MessageCircle, Megaphone } from "lucide-react";
import { usePage } from "@/contexts/PageContext";
import { useClub } from "@/hooks/use-club";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataSyncIndicatorCompact } from "@/components/DataSyncIndicator";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { title, subtitle } = usePage();
  const { selectedClub } = useClub();

  // Get unread notifications count - ausgewogene Aktualisierung
  const { data: stats } = useQuery<{
    totalMessages: number;
    unreadMessages: number;
    totalAnnouncements: number;
    unreadNotifications: number;
    recentActivity: number;
  }>({
    queryKey: ['/api/clubs', selectedClub?.id, 'communication-stats'],
    enabled: !!selectedClub?.id,
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache
    refetchInterval: 2 * 60 * 1000, // Alle 2 Minuten aktualisieren für Benutzerfreundlichkeit
  });

  // Get recent messages for notification preview
  const { data: recentMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'messages'],
    enabled: !!selectedClub?.id,
  });

  // Get recent notifications - ausgewogene Aktualisierung
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'notifications'],
    enabled: !!selectedClub?.id,
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache
    refetchInterval: 2 * 60 * 1000, // Alle 2 Minuten aktualisieren für Benutzerfreundlichkeit
  });

  const unreadCount = (stats?.unreadNotifications || 0) + (stats?.unreadMessages || 0);

  return (
    <>
      <header className="bg-card shadow-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="xl:hidden text-foreground"
              onClick={onMenuClick}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time Data Sync Indicator */}
            <DataSyncIndicatorCompact className="hidden sm:flex" />
            
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative text-foreground hover:bg-muted">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Benachrichtigungen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {stats?.unreadMessages && stats.unreadMessages > 0 && (
                    <DropdownMenuItem asChild>
                      <Link href="/communication" className="flex items-center gap-2 cursor-pointer">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium">{stats.unreadMessages} ungelesene Nachrichten</div>
                          <div className="text-xs text-muted-foreground">Klicken zum Anzeigen</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {notifications.filter((n: any) => !n.isRead).slice(0, 3).map((notification: any) => (
                    <DropdownMenuItem key={notification.id} asChild>
                      <Link 
                        href={notification.type === 'announcement' ? "/communication?tab=announcements" : "/communication"} 
                        className="flex items-center gap-2 cursor-pointer p-3 hover:bg-muted"
                        onClick={async () => {
                          // Mark notification as read
                          try {
                            await fetch(`/api/clubs/${selectedClub?.id}/notifications/${notification.id}/read`, {
                              method: 'POST',
                              credentials: 'include',
                            });
                          } catch (error) {
                            console.error('Failed to mark notification as read:', error);
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          {notification.type === 'announcement' ? (
                            <Megaphone className="h-4 w-4 text-orange-500" />
                          ) : notification.type === 'message' ? (
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Bell className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{notification.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{notification.message}</div>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  
                  {stats?.unreadNotifications && stats.unreadNotifications > 3 && (
                    <DropdownMenuItem asChild>
                      <Link href="/communication" className="flex items-center gap-2 cursor-pointer text-center">
                        <div className="flex-1 text-sm text-muted-foreground">
                          +{stats.unreadNotifications - 3} weitere Benachrichtigungen
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {unreadCount === 0 && (
                    <DropdownMenuItem disabled>
                      <div className="text-center text-muted-foreground py-2">
                        Keine neuen Benachrichtigungen
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/communication" className="text-center cursor-pointer">
                      Alle Nachrichten anzeigen
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

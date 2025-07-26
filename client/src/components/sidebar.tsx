import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Users,
  Users2,
  BarChart3,
  UsersRound,
  Calendar,
  MapPin,
  BookOpen,
  Euro,
  MessageCircle,
  FileText,
  UserCog,
  Settings,
  X,
  Sun,
  Moon,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Mitglieder", href: "/members", icon: Users, badge: true },
  { name: "Spieler", href: "/players", icon: Users2, badge: true },
  { name: "Teams", href: "/teams", icon: UsersRound, badge: true },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Anlagen", href: "/facilities", icon: MapPin },
  { name: "Buchungen", href: "/bookings", icon: BookOpen },
  { name: "Finanzen", href: "/finance", icon: Euro },
  { name: "Berichte", href: "/reports", icon: FileText },
  { name: "Kommunikation", href: "/communication", icon: MessageCircle },
];

const adminNavigation = [
  { name: "Benutzer", href: "/users", icon: UserCog },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { selectedClub, setSelectedClub } = useClub();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const { data: clubs } = useQuery({
    queryKey: ['/api/clubs'],
    retry: false,
    enabled: true, // This should work for authenticated users
  });

  const { data: members } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: players } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const handleClubChange = (clubId: string) => {
    const club = (clubs as any[])?.find((c: any) => c.id.toString() === clubId);
    if (club) {
      setSelectedClub(club);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <TooltipProvider delayDuration={300}>
        <aside
          className={cn(
            "fixed xl:static inset-y-0 left-0 z-50 bg-card shadow-lg flex flex-col transition-all duration-300 ease-in-out border-r border-border",
            collapsed ? "w-16" : "w-64",
            open ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          )}
        >
          {/* Header */}
          <div className={cn("border-b border-border transition-all duration-300", collapsed ? "p-2" : "p-6")}>
            {collapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-club-primary rounded-lg flex items-center justify-center">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 hover:bg-muted"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-club-primary rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="text-white text-lg" />
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="text-xl font-bold text-club-primary whitespace-nowrap">TeamIO</h1>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedClub?.name || "Kein Verein"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Collapse Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden xl:flex"
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* Mobile Close */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="xl:hidden"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Club Selector */}
            {!collapsed && (
              <div className="mt-4">
                <Select
                  value={selectedClub?.id?.toString() || ""}
                  onValueChange={handleClubChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Verein auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clubs as any[])?.map((club: any) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name} ({club.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className={cn("space-y-2", collapsed ? "px-2" : "px-3")}>
              {navigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                let badge = null;
                
                if (item.badge && item.href === "/members" && members) {
                  badge = (members as any[]).length;
                } else if (item.badge && item.href === "/players" && players) {
                  badge = (players as any[]).length;
                } else if (item.badge && item.href === "/teams" && teams) {
                  badge = (teams as any[]).length;
                }
                
                const navigationButton = (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      onClose();
                    }}
                    className={cn(
                      "w-full group flex items-center text-sm font-medium transition-all duration-200",
                      collapsed 
                        ? "justify-center p-2 rounded-lg hover:bg-muted/50" 
                        : "px-3 py-2.5 rounded-lg hover:bg-muted/80",
                      isActive
                        ? collapsed 
                          ? "bg-club-primary text-white" 
                          : "bg-club-primary/10 text-club-primary border-l-4 border-club-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        collapsed ? "w-5 h-5" : "w-4 h-4 mr-3",
                        isActive 
                          ? collapsed 
                            ? "text-white" 
                            : "text-club-primary" 
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.name}</span>
                        {badge && (
                          <span className="ml-auto bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );

                return collapsed ? (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {navigationButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2 bg-popover border border-border shadow-md">
                      <span className="font-medium">{item.name}</span>
                      {badge && (
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                          {badge}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : navigationButton;
              })}
            </div>

            {/* Admin Section */}
            <div className={cn("mt-6", collapsed ? "px-2" : "px-3")}>
              <div className="border-t border-border pt-4">
                {!collapsed && (
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Administration
                  </p>
                )}
                <div className="space-y-2">
                  {adminNavigation.map((item) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;
                    
                    const adminButton = (
                      <button
                        key={item.name}
                        onClick={() => {
                          navigate(item.href);
                          onClose();
                        }}
                        className={cn(
                          "w-full group flex items-center text-sm font-medium transition-all duration-200",
                          collapsed 
                            ? "justify-center p-2 rounded-lg hover:bg-muted/50" 
                            : "px-3 py-2.5 rounded-lg hover:bg-muted/80",
                          isActive
                            ? collapsed 
                              ? "bg-club-primary text-white" 
                              : "bg-club-primary/10 text-club-primary border-l-4 border-club-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            collapsed ? "w-5 h-5" : "w-4 h-4 mr-3",
                            isActive 
                              ? collapsed 
                                ? "text-white" 
                                : "text-club-primary" 
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {!collapsed && <span className="font-medium">{item.name}</span>}
                      </button>
                    );

                    return collapsed ? (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {adminButton}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover border border-border shadow-md">
                          <span className="font-medium">{item.name}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : adminButton;
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Theme Toggle */}
          <div className={cn("border-t border-border", collapsed ? "px-2 py-3" : "px-3 py-3")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex justify-center p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
                  >
                    {theme === "light" ? (
                      <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border border-border shadow-md">
                  <span className="font-medium">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground group"
              >
                {theme === "light" ? (
                  <Moon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <Sun className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                <span className="font-medium">
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </span>
              </button>
            )}
          </div>

          {/* User Profile */}
          <div className={cn("border-t border-border", collapsed ? "p-2" : "p-4")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full flex justify-center p-1">
                    <div className="w-10 h-10 bg-club-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-club-primary/90 transition-colors">
                      <Users className="text-white h-5 w-5" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border border-border shadow-md">
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-xs text-muted-foreground">Vereinsadministrator</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-club-primary rounded-full flex items-center justify-center">
                  <Users className="text-white h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Administrator
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Vereinsadministrator
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    // Complete Firebase logout first
                    try {
                      // Import Firebase auth dynamically
                      const { auth } = await import('@/lib/firebase');
                      await auth.signOut();
                      console.log('Firebase logout successful');
                    } catch (error) {
                      console.error('Firebase logout error:', error);
                    }
                    
                    // Clear all local data
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Now go to server logout
                    window.location.href = "/api/logout";
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 h-8 w-8"
                  title="Abmelden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        </aside>
      </TooltipProvider>
    </>
  );
}

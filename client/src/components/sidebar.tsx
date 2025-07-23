import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Users,
  BarChart3,
  UsersRound,
  Calendar,
  MapPin,
  BookOpen,
  Euro,
  MessageCircle,
  UserCog,
  Settings,
  X,
  Sun,
  Moon,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Mitglieder", href: "/members", icon: Users, badge: true },
  { name: "Teams", href: "/teams", icon: UsersRound, badge: true },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Anlagen", href: "/facilities", icon: MapPin },
  { name: "Buchungen", href: "/bookings", icon: BookOpen },
  { name: "Finanzen", href: "/finance", icon: Euro },
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

  const { data: clubs } = useQuery({
    queryKey: ['/api/clubs'],
    retry: false,
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

  const handleClubChange = (clubId: string) => {
    const club = clubs?.find((c: any) => c.id.toString() === clubId);
    if (club) {
      setSelectedClub(club);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card shadow-lg flex flex-col transition-transform duration-300 ease-in-out border-r",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-club-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-club-primary">TeamIO</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedClub?.name || "Kein Verein"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Club Selector */}
          <div className="mt-4">
            <Select
              value={selectedClub?.id?.toString() || ""}
              onValueChange={handleClubChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Verein auswählen" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((club: any) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name} ({club.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              let badge = null;
              
              if (item.badge && item.href === "/members" && members) {
                badge = members.length;
              } else if (item.badge && item.href === "/teams" && teams) {
                badge = teams.length;
              }
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  className={cn(
                    "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-club-primary/10 text-club-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 text-base flex-shrink-0",
                      isActive ? "text-club-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="flex-1 text-left">{item.name}</span>
                  {badge && (
                    <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Section */}
          <div className="mt-6 px-3">
            <div className="border-t border-border pt-4">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        onClose();
                      }}
                      className={cn(
                        "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-club-primary/10 text-club-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 text-base flex-shrink-0",
                          isActive ? "text-club-primary" : "text-muted-foreground"
                        )}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted"
          >
            {theme === "light" ? (
              <Moon className="mr-3 h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="mr-3 h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-foreground">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
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
              onClick={() => window.location.href = "/api/logout"}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

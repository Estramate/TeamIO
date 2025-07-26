/**
 * User profile button with Replit authentication support
 * Shows user info and logout options
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
// Firebase auth removed - using only Replit auth
import { LogOut, User, Settings, Shield } from "lucide-react";
// Firebase icons removed - using only Replit auth
import { SiReplit } from "react-icons/si";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const authData = useAuth();
  
  const replitUser = authData?.user;
  const replitLogout = authData?.logout;

  // Using only Replit authentication
  const currentUser = replitUser;
  const authProvider = replitUser ? 'replit' : null;

  if (!currentUser) {
    return null;
  }

  // Extract user info from Replit auth
  const userInfo = {
    name: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'User',
    email: replitUser.email || '',
    avatar: replitUser.profileImageUrl || null,
    initials: `${replitUser.firstName?.[0] || ''}${replitUser.lastName?.[0] || ''}`.toUpperCase() || replitUser.email?.[0]?.toUpperCase() || 'U',
  };

  const handleLogout = async () => {
    try {
      console.log('UserProfileButton logout - starting logout process');
      
      // Mark that we're logging out
      sessionStorage.setItem('just_logged_out', 'true');
      
      // Clear all local data immediately
      localStorage.clear();
      
      console.log('Local data cleared, redirecting to server logout');
      
      // Always call server logout to clear cookies and sessions
      window.location.assign("/api/logout");
    } catch (error) {
      console.error('Logout process error:', error);
      // Fallback: Force logout even if something fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.assign("/api/logout");
    }
  };

  const getProviderIcon = () => {
    if (authProvider === 'replit') {
      return <SiReplit className="h-3 w-3" />;
    }
    
    return <User className="h-3 w-3" />;
  };

  const getProviderName = () => {
    if (authProvider === 'replit') return 'Replit';
    
    return 'Unknown';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-10 w-10 rounded-full ${className}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo.avatar || undefined} alt={userInfo.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userInfo.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{userInfo.name}</p>
              <Badge variant="secondary" className="text-xs">
                {getProviderIcon()}
                <span className="ml-1">{getProviderName()}</span>
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {userInfo.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Einstellungen</span>
          </DropdownMenuItem>
          {replitUser && (
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Berechtigungen</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
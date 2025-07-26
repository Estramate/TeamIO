/**
 * User profile button with multi-provider authentication support
 * Shows user info and logout options for both Replit and Firebase auth
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
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { SiReplit } from "react-icons/si";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const authData = useAuth();
  const { user: firebaseUser, signOut: firebaseSignOut } = useFirebaseAuth();
  
  const replitUser = authData?.user;
  const replitLogout = authData?.logout;

  // Determine which user and auth provider to display
  const currentUser = replitUser || firebaseUser;
  const authProvider = replitUser ? 'replit' : firebaseUser ? 'firebase' : null;

  if (!currentUser) {
    return null;
  }

  // Extract user info based on auth provider
  const userInfo = replitUser 
    ? {
        name: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'User',
        email: replitUser.email || '',
        avatar: replitUser.profileImageUrl,
        initials: `${replitUser.firstName?.[0] || ''}${replitUser.lastName?.[0] || ''}`.toUpperCase() || replitUser.email?.[0]?.toUpperCase() || 'U',
      }
    : {
        name: firebaseUser?.displayName || firebaseUser?.email || 'User',
        email: firebaseUser?.email || '',
        avatar: firebaseUser?.photoURL,
        initials: firebaseUser?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || firebaseUser?.email?.[0]?.toUpperCase() || 'U',
      };

  const handleLogout = async () => {
    try {
      if (replitUser && replitLogout) {
        replitLogout();
      } else if (firebaseUser) {
        await firebaseSignOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getProviderIcon = () => {
    if (authProvider === 'replit') {
      return <SiReplit className="h-3 w-3" />;
    }
    
    // For Firebase, check the specific provider
    const providerId = firebaseUser?.providerData?.[0]?.providerId;
    if (providerId === 'google.com') {
      return <FaGoogle className="h-3 w-3" />;
    } else if (providerId === 'facebook.com') {
      return <FaFacebook className="h-3 w-3" />;
    }
    
    return <User className="h-3 w-3" />;
  };

  const getProviderName = () => {
    if (authProvider === 'replit') return 'Replit';
    
    const providerId = firebaseUser?.providerData?.[0]?.providerId;
    if (providerId === 'google.com') return 'Google';
    if (providerId === 'facebook.com') return 'Facebook';
    
    return 'Firebase';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-10 w-10 rounded-full ${className}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo.avatar || undefined} alt={userInfo.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userInfo.initials || 'U'}
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
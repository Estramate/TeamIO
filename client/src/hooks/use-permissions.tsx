import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useClub } from './use-club';

export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canManageTeams: boolean;
  canManageMembers: boolean;
  canManageFinances: boolean;
  canManageBookings: boolean;
  isReadOnly: boolean;
}

export function usePermissions(): UserPermissions {
  const { isAuthenticated } = useAuth();
  const { selectedClub } = useClub();

  return useMemo(() => {
    if (!isAuthenticated || !selectedClub) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canManageTeams: false,
        canManageMembers: false,
        canManageFinances: false,
        canManageBookings: false,
        isReadOnly: true,
      };
    }

    // For authenticated users with selected club, give full permissions
    // This allows administrators and team members to manage club data
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCreate: true,
      canManageTeams: true,
      canManageMembers: true,
      canManageFinances: true,
      canManageBookings: true,
      isReadOnly: false,
    };
  }, [isAuthenticated, selectedClub]);
}
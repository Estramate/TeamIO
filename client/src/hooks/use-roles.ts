/**
 * React Hook for managing database-stored roles
 * Provides centralized access to role data from the roles table
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch all active roles from database
 */
export function useRoles() {
  return useQuery({
    queryKey: ['/api/super-admin/roles'],
    queryFn: async (): Promise<Role[]> => {
      return await apiRequest('/api/super-admin/roles');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    gcTime: 10 * 60 * 1000 // 10 minutes (updated from cacheTime)
  });
}

/**
 * Helper function to get role display name by role name
 */
export function getRoleDisplayName(roleName: string, roles: Role[] = []): string {
  const role = roles.find(r => r.name === roleName);
  return role?.displayName || roleName;
}

/**
 * Helper function to get available roles for dropdowns
 */
export function getRoleOptions(roles: Role[] = []) {
  return roles
    .filter(role => role.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(role => ({
      value: role.name,
      label: role.displayName,
      description: role.description
    }));
}

/**
 * Helper function to format role badge text
 */
export function formatRoleBadge(roleName: string, roles: Role[] = []): string {
  const role = roles.find(r => r.name === roleName);
  if (!role) return roleName;
  
  // Short display names for badges
  switch (role.name) {
    case 'club-administrator':
      return 'Admin';
    case 'trainer':
      return 'Trainer';
    case 'member':
      return 'Mitglied';
    default:
      return role.displayName;
  }
}
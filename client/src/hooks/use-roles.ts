/**
 * React Hook for managing database-stored roles
 * Provides centralized access to role data from the roles table
 */

import { useQuery } from '@tanstack/react-query';

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
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime)
    select: (data) => {
      // Sort roles by sort_order for consistent display
      return data?.sort((a: any, b: any) => (a.sortOrder || 999) - (b.sortOrder || 999));
    }
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

    case 'kassier':
      return 'Kassier';
    case 'schriftfuehrer':
      return 'Sekretär';
    case 'trainer':
      return 'Trainer';
    case 'member':
      return 'Mitglied';
    case 'obmann':
      return 'Obmann';
    case 'platzwart':
      return 'Platzwart';
    case 'eventmanager':
      return 'Event-Mgr';
    default:
      return role.displayName;
  }
}

/**
 * Get role color for badges and UI elements
 */
export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    'club-administrator': '#8b5cf6', // Purple

    'kassier': '#10b981', // Green  
    'schriftfuehrer': '#3b82f6', // Blue
    'trainer': '#f59e0b', // Orange
    'member': '#6b7280', // Gray
    'obmann': '#dc2626', // Red
    'platzwart': '#059669', // Teal
    'eventmanager': '#7c3aed', // Violet
  };
  return roleColors[role] || '#6b7280';
}

/**
 * Get role permissions description for tooltips
 */
export function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'club-administrator': ['Alle Bereiche verwalten', 'Benutzer und Rollen verwalten', 'Systemkonfiguration'],

    'kassier': ['Finanzen verwalten', 'Berichte erstellen', 'Mitgliedsbeiträge'],
    'schriftfuehrer': ['Mitglieder verwalten', 'Kommunikation', 'Dokumente', 'Meetings'],
    'trainer': ['Teams verwalten', 'Training planen', 'Spieler betreuen'],
    'member': ['Persönliche Daten', 'Termine ansehen', 'Nachrichten lesen'],
    'obmann': ['Alle Statistiken', 'Strategische Übersicht', 'Auswertungen'],
    'platzwart': ['Anlagen verwalten', 'Platzbelegung', 'Wartung'],
    'eventmanager': ['Veranstaltungen planen', 'Teilnehmer verwalten', 'Budget'],
  };
  return permissions[role] || ['Grundlegende Berechtigungen'];
}
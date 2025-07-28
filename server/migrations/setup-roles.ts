/**
 * Setup script for inserting default roles into the roles table
 * This normalizes role management and replaces string-based roles
 */
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { roles, type InsertRole, type Role } from '../../shared/schema';

export const defaultRoles: InsertRole[] = [
  {
    name: 'member',
    displayName: 'Mitglied',
    description: 'Standardrolle für Vereinsmitglieder mit grundlegenden Berechtigungen',
    permissions: ['view_club_info', 'view_events', 'join_events'],
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'trainer',
    displayName: 'Trainer',
    description: 'Trainer mit erweiterten Berechtigungen für Mannschaftsverwaltung',
    permissions: ['view_club_info', 'view_events', 'join_events', 'manage_team', 'view_members'],
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'club-administrator',
    displayName: 'Club Administrator',
    description: 'Vollständige administrative Rechte für den Verein',
    permissions: [
      'view_club_info', 'edit_club_info', 'view_events', 'create_events', 'manage_events',
      'view_members', 'invite_members', 'manage_members', 'manage_teams', 'manage_facilities',
      'view_finances', 'manage_finances', 'view_reports', 'manage_settings'
    ],
    isActive: true,
    sortOrder: 3
  }
];

export async function setupRoles() {
  console.log('🔧 Setting up default roles...');
  
  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles);
    
    if (existingRoles.length > 0) {
      console.log(`✅ Roles already exist (${existingRoles.length} found), skipping setup`);
      return existingRoles;
    }

    // Insert default roles
    const insertedRoles = await db.insert(roles).values(defaultRoles).returning();
    
    console.log(`✅ Successfully created ${insertedRoles.length} default roles:`);
    insertedRoles.forEach((role: Role) => {
      console.log(`   - ${role.displayName} (${role.name})`);
    });
    
    return insertedRoles;
  } catch (error) {
    console.error('❌ Error setting up roles:', error);
    throw error;
  }
}

export async function getRoleByName(roleName: string) {
  const role = await db.select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  
  return role[0] || null;
}

export async function getAllRoles() {
  return await db.select()
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(roles.sortOrder);
}
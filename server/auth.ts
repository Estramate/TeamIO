/**
 * Password-based authentication system with 2FA support
 * Provides email/password login, invitation handling, and TOTP 2FA
 */

import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import storage from './storage';
import { sendInvitationEmail } from './emailService';
import { logger, ValidationError, AuthorizationError } from './logger';
import type { User } from '@shared/schemas/core';

export interface InvitationData {
  clubId: number;
  email: string;
  roleId: number;
  invitedBy: string;
  personalMessage?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Generate secure random token for invitations
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Send email invitation to user
 */
export async function sendUserInvitation(invitationData: InvitationData): Promise<{ success: boolean; invitationId?: number; error?: string }> {
  try {
    const { clubId, email, roleId, invitedBy, personalMessage } = invitationData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      // Check if already a member of this club
      const membership = await storage.getUserClubMembership(existingUser.id, clubId);
      if (membership) {
        return { success: false, error: 'Benutzer ist bereits Mitglied dieses Vereins' };
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await storage.getPendingInvitation(email, clubId);
    if (existingInvitation) {
      return { success: false, error: 'Eine Einladung für diese E-Mail-Adresse steht bereits aus' };
    }

    // Generate invitation token
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record
    const invitation = await storage.createEmailInvitation({
      clubId,
      invitedBy,
      email,
      roleId,
      token,
      expiresAt,
      status: 'pending'
    });

    // Get club and inviter information
    const club = await storage.getClub(clubId);
    const inviter = await storage.getUser(invitedBy);

    if (!club || !inviter) {
      throw new ValidationError('Club oder Einladender nicht gefunden');
    }

    // Get role information
    const role = await storage.getRoleById(roleId);
    const roleName = role?.displayName || 'Mitglied';

    // Send invitation email
    const emailSent = await sendInvitationEmail({
      to: email,
      clubName: club.name,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      role: roleName,
      personalMessage,
      invitationUrl: `${process.env.APP_URL || 'https://clubflow.replit.app'}/register?token=${token}`,
      expiresAt
    });

    if (!emailSent) {
      // Rollback invitation if email failed
      await storage.deleteEmailInvitation(invitation.id);
      return { success: false, error: 'E-Mail konnte nicht gesendet werden' };
    }

    logger.info('User invitation sent', { 
      invitationId: invitation.id, 
      email, 
      clubId, 
      invitedBy 
    });

    return { success: true, invitationId: invitation.id };
  } catch (error: any) {
    logger.error('Failed to send user invitation', { error: error.message, invitationData });
    return { success: false, error: 'Fehler beim Senden der Einladung' };
  }
}

/**
 * Register user from invitation - activates existing user and sets password
 */
export async function registerUserFromInvitation(registrationData: RegistrationData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { email, password, firstName, lastName, token } = registrationData;

    console.log('🔑 Registration attempt with token:', token);
    console.log('🔑 Registration data:', { email, firstName, lastName });

    // Validate invitation token
    const invitation = await storage.getInvitationByToken(token);
    if (!invitation) {
      console.log('❌ Invalid invitation token:', token);
      return { success: false, error: 'Ungültiger oder abgelaufener Einladungslink' };
    }

    console.log('✅ Found valid invitation:', invitation);

    if (invitation.status !== 'pending') {
      console.log('❌ Invitation already used, status:', invitation.status);
      return { success: false, error: 'Diese Einladung wurde bereits verwendet' };
    }

    if (new Date() > invitation.expiresAt) {
      console.log('❌ Invitation expired at:', invitation.expiresAt);
      return { success: false, error: 'Diese Einladung ist abgelaufen' };
    }

    if (invitation.email !== email) {
      console.log('❌ Email mismatch - invitation:', invitation.email, 'provided:', email);
      return { success: false, error: 'E-Mail-Adresse stimmt nicht mit der Einladung überein' };
    }

    // Check if user already exists (should exist for admin invitations)
    const existingUser = await storage.getUserByEmail(email);
    if (!existingUser) {
      console.log('❌ User does not exist for invitation:', email);
      return { success: false, error: 'Benutzer wurde nicht gefunden. Kontaktieren Sie den Administrator.' };
    }

    console.log('✅ Found existing user:', existingUser.id);

    // Hash password
    const passwordHash = await hashPassword(password);

    // Update existing user - set password and activate (using correct field names)
    const user = await storage.updateUser(existingUser.id, {
      passwordHash: passwordHash,
      firstName: firstName,
      lastName: lastName,
      isActive: true,
      hasCompletedOnboarding: true,
    });

    console.log('✅ User updated and activated:', user.id);

    // Update club membership to active (if it exists and is pending)
    const membership = await storage.getUserClubMembership(existingUser.id, invitation.clubId);
    if (membership && membership.status === 'pending') {
      await storage.updateClubMembership(existingUser.id, invitation.clubId, {
        status: 'active'
      });
      console.log('✅ Club membership activated for club:', invitation.clubId);
    }

    // Mark invitation as accepted
    await storage.updateEmailInvitation(invitation.id, {
      status: 'accepted',
      acceptedAt: new Date()
    });

    console.log('✅ Invitation marked as accepted:', invitation.id);

    logger.info('User registered from invitation', { 
      userId: user.id, 
      email, 
      clubId: invitation.clubId 
    });

    return { success: true, user };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    logger.error('Failed to register user from invitation', { error: error.message, email: registrationData.email });
    return { success: false, error: 'Fehler bei der Registrierung' };
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; requires2FA?: boolean; error?: string }> {
  try {
    const { email, password, twoFactorCode } = credentials;

    // Find user by email
    const user = await storage.getUserByEmailAndProvider(email, 'email');
    if (!user) {
      return { success: false, error: 'Ungültige E-Mail-Adresse oder Passwort' };
    }

    if (!user.passwordHash) {
      return { success: false, error: 'Dieser Benutzer kann sich nicht mit Passwort anmelden' };
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, error: 'Ungültige E-Mail-Adresse oder Passwort' };
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return { success: false, requires2FA: true, error: '2FA-Code erforderlich' };
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1
      });

      if (!verified) {
        // Try backup codes
        if (user.twoFactorBackupCodes) {
          const backupCodes = Array.isArray(user.twoFactorBackupCodes) 
            ? user.twoFactorBackupCodes 
            : JSON.parse(user.twoFactorBackupCodes as string);
          
          const codeIndex = backupCodes.indexOf(twoFactorCode.toUpperCase());
          if (codeIndex === -1) {
            return { success: false, requires2FA: true, error: 'Ungültiger 2FA-Code' };
          }

          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await storage.updateUser(user.id, { twoFactorBackupCodes: backupCodes });
        } else {
          return { success: false, requires2FA: true, error: 'Ungültiger 2FA-Code' };
        }
      }
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    logger.info('User authenticated successfully', { userId: user.id, email });
    return { success: true, user };
  } catch (error: any) {
    logger.error('Failed to authenticate user', { error: error.message, email: credentials.email });
    return { success: false, error: 'Fehler bei der Anmeldung' };
  }
}

/**
 * Setup 2FA for user
 */
export async function setup2FA(userId: string): Promise<{ success: boolean; setup?: TwoFactorSetup; error?: string }> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ClubFlow (${user.email})`,
      issuer: 'ClubFlow'
    });

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url || '')}`;

    return {
      success: true,
      setup: {
        secret: secret.base32 || '',
        qrCodeUrl,
        backupCodes
      }
    };
  } catch (error: any) {
    logger.error('Failed to setup 2FA', { error: error.message, userId });
    return { success: false, error: 'Fehler beim Einrichten der 2FA' };
  }
}

/**
 * Enable 2FA for user after verification
 */
export async function enable2FA(userId: string, secret: string, verificationCode: string, backupCodes: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationCode,
      window: 1
    });

    if (!verified) {
      return { success: false, error: 'Ungültiger Verifikationscode' };
    }

    // Update user with 2FA settings
    await storage.updateUser(userId, {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes
    });

    logger.info('2FA enabled for user', { userId });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to enable 2FA', { error: error.message, userId });
    return { success: false, error: 'Fehler beim Aktivieren der 2FA' };
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await storage.updateUser(userId, {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null
    });

    logger.info('2FA disabled for user', { userId });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to disable 2FA', { error: error.message, userId });
    return { success: false, error: 'Fehler beim Deaktivieren der 2FA' };
  }
}
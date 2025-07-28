/**
 * Super Administrator Routes
 * Platform-wide management endpoints for super administrators
 */

import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requiresSuperAdmin } from "../lib/super-admin";
// import { sendEmail } from "../lib/sendgrid"; // Optional email functionality

const router = Router();

// Schema for creating clubs
const createClubSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  website: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#3b82f6"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#64748b"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#10b981"),
});

// Schema for creating administrators
const createAdminSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  clubId: z.string().min(1, "Club ID is required"),
  sendWelcomeEmail: z.boolean().default(true),
});

// GET /api/super-admin/clubs - Get all clubs
router.get("/clubs", 
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const { storage } = await import("../storage");
      
      // Get all clubs with additional statistics
      const clubs = await storage.getAllClubs();
      
      // Enhance clubs with user counts (all users associated with club)
      const enhancedClubs = await Promise.all(
        clubs.map(async (club: any) => {
          const members = await storage.getClubMembers(club.id);
          const clubUsers = await storage.getClubUsersWithMembership(club.id);
          
          return {
            ...club,
            memberCount: members.length,
            userCount: clubUsers.length, // Total users for super admin view
            subscriptionPlan: 'free', // Default subscription plan
            createdAt: club.createdAt || new Date(),
          };
        })
      );
      
      res.json(enhancedClubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  }));

// POST /api/super-admin/clubs - Create new club
router.post("/clubs",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = createClubSchema.parse(req.body);
      const { storage } = await import("../storage");
      
      // Create the club
      const newClub = await storage.createClub({
        name: validatedData.name,
        description: validatedData.description,
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website,
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        accentColor: validatedData.accentColor,
        settings: JSON.stringify({
          allowSelfRegistration: false,
          requireApproval: true,
          defaultMemberRole: 'member',
        }),
      });

      // Log the super admin action
      console.log(`SUPER ADMIN ACTION: Club "${validatedData.name}" created by ${req.user.email}`);
      
      res.json({
        success: true,
        club: newClub,
        message: "Club successfully created"
      });
    } catch (error) {
      console.error("Error creating club:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create club" });
    }
  }));

// GET /api/super-admin/users - Get all users
router.get("/users",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const { storage } = await import("../storage");
      
      // Get all users
      const users = await storage.getAllUsers();
      
      // Enhance users with club memberships
      const enhancedUsers = await Promise.all(
        users.map(async (user: any) => {
          const memberships = await storage.getUserClubMemberships(user.id);
          
          // Get club names for memberships
          const membershipDetails = await Promise.all(
            memberships.map(async (membership: any) => {
              const club = await storage.getClub(membership.clubId);
              return {
                clubId: membership.clubId,
                clubName: club?.name || `Club ${membership.clubId}`,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
              };
            })
          );
          
          return {
            ...user,
            memberships: membershipDetails,
          };
        })
      );
      
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }));

// GET /api/super-admin/club-subscriptions - Get all club subscriptions
router.get("/club-subscriptions",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const { storage } = await import("../storage");
      const subscriptions = await storage.getAllClubSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching club subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch club subscriptions" });
    }
  }));

// POST /api/super-admin/create-admin - Create new club administrator
router.post("/create-admin",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = createAdminSchema.parse(req.body);
      const { storage } = await import("../storage");
      
      // Check if user already exists
      let user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        // Create new user
        const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.createUser({
          id: userId,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          authProvider: 'email',
          hasCompletedOnboarding: false,
          isActive: true,
        });
      }
      
      // Check if club exists
      const club = await storage.getClub(parseInt(validatedData.clubId));
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      
      // Create club membership with administrator role
      await storage.createClubMembership({
        userId: user.id,
        clubId: club.id,
        role: 'club-administrator',
        status: 'active',
      });
      
      // Send welcome email if requested (implementation needed)
      if (validatedData.sendWelcomeEmail) {
        // TODO: Implement email functionality
        console.log(`Welcome email would be sent to ${validatedData.email} for club ${club.name}`);
      }

      // Log the super admin action
      console.log(`SUPER ADMIN ACTION: Administrator "${validatedData.firstName} ${validatedData.lastName}" created for club "${club.name}" by ${req.user.email}`);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        club: {
          id: club.id,
          name: club.name,
        },
        welcomeEmailSent: validatedData.sendWelcomeEmail,
        message: "Administrator successfully created"
      });
    } catch (error) {
      console.error("Error creating administrator:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create administrator" });
    }
  }));

// DELETE /api/super-admin/clubs/:clubId - Delete club (careful!)
router.delete("/clubs/:clubId",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const { storage } = await import("../storage");
      
      const club = await storage.getClub(clubId);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }

      // TODO: Implement soft delete or archive instead of hard delete
      // This is a dangerous operation and should be logged extensively
      
      console.log(`SUPER ADMIN ACTION: Club "${club.name}" deletion requested by ${req.user.email}`);
      
      res.json({
        message: "Club deletion not yet implemented - requires additional safety measures",
        clubId,
        clubName: club.name
      });
    } catch (error) {
      console.error("Error deleting club:", error);
      res.status(500).json({ error: "Failed to delete club" });
    }
  }));

// Helper function to send welcome email to new administrators
async function sendWelcomeAdminEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  clubName: string;
  adminEmail: string;
}) {
  const subject = `🎉 Willkommen als Administrator bei ${data.clubName} - ClubFlow`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">ClubFlow</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Vereinsmanagement leicht gemacht</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #2d3748; margin-top: 0;">Willkommen als Administrator!</h2>
          
          <p>Hallo ${data.firstName} ${data.lastName},</p>
          
          <p>Sie wurden als Administrator für <strong>${data.clubName}</strong> bei ClubFlow eingerichtet.</p>
          
          <div style="background: #e6fffa; border-left: 4px solid #38a169; padding: 15px; margin: 20px 0;">
            <strong>Ihre Zugangsdaten:</strong>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>E-Mail: <strong>${data.email}</strong></li>
              <li>Verein: <strong>${data.clubName}</strong></li>
              <li>Rolle: <strong>Club-Administrator</strong></li>
            </ul>
          </div>
          
          <h3>Erste Schritte:</h3>
          <ol style="padding-left: 20px;">
            <li>Besuchen Sie <a href="https://clubflow.replit.app/">ClubFlow</a></li>
            <li>Melden Sie sich mit Ihrer E-Mail-Adresse an</li>
            <li>Vervollständigen Sie Ihr Profil</li>
            <li>Erkunden Sie die Administrator-Funktionen</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://clubflow.replit.app/" 
               style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Jetzt anmelden
            </a>
          </div>
          
          <p style="font-size: 14px; color: #718096;">
            Bei Fragen wenden Sie sich an unseren Support unter club.flow.2025@gmail.com
          </p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          
          <p style="font-size: 12px; color: #a0aec0;">
            Diese E-Mail wurde von ${data.adminEmail} (Super Administrator) generiert.
          </p>
        </div>
      </div>
    </div>
  `;
  
  try {
    await sendEmail(process.env.SENDGRID_API_KEY!, {
      to: data.email,
      from: process.env.FROM_EMAIL || 'club.flow.2025@gmail.com',
      subject,
      html,
    });
    console.log(`Welcome email sent to new administrator: ${data.email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${data.email}:`, error);
  }
}

// PUT /api/super-admin/clubs/:id - Update club
router.put("/clubs/:id",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.id);
      const { name, description, address, phone, email, website } = req.body;
      const { storage } = await import("../storage");
      
      const club = await storage.updateClub(clubId, {
        name,
        description,
        address,
        phone,
        email,
        website,
      });
      
      res.json(club);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(500).json({ error: "Failed to update club" });
    }
  }));

// POST /api/super-admin/clubs/:id/deactivate - Deactivate club
router.post("/clubs/:id/deactivate",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.id);
      const { storage } = await import("../storage");
      
      const club = await storage.updateClub(clubId, {
        isActive: false,
      });
      
      res.json({ message: "Club deactivated successfully", club });
    } catch (error) {
      console.error("Error deactivating club:", error);
      res.status(500).json({ error: "Failed to deactivate club" });
    }
  }));

// PUT /api/super-admin/users/:id - Update user
router.put("/users/:id",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.params.id;
      const { firstName, lastName, email, isActive } = req.body;
      const { storage } = await import("../storage");
      
      const user = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        isActive,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }));

// POST /api/super-admin/users/:id/deactivate - Deactivate user
router.post("/users/:id/deactivate",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.params.id;
      const { storage } = await import("../storage");
      
      const user = await storage.updateUser(userId, {
        isActive: false,
      });
      
      res.json({ message: "User deactivated successfully", user });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  }));

export default router;
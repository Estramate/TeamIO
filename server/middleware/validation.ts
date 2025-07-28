import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../logger';

// Generic validation middleware factory
const createValidator = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        
        logger.warn('Validation error', { 
          path: req.path,
          errors: error.errors 
        });
        
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errorMessages 
        });
      }
      
      logger.error('Unexpected validation error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Basic schemas for validation
const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
});

const clubSchema = z.object({
  name: z.string().min(1, 'Club name is required'),
  shortName: z.string().optional(),
  description: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  league: z.string().optional(),
});

const playerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  jerseyNumber: z.number().int().min(1).max(999).optional(),
  position: z.string().optional(),
});

const facilitySchema = z.object({
  name: z.string().min(1, 'Facility name is required'),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

const bookingSchema = z.object({
  facilityId: z.number().int().positive(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().optional(),
});

const financeSchema = z.object({
  amount: z.number(),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  transactionType: z.enum(['income', 'expense']),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  recipientIds: z.array(z.string()).min(1, 'At least one recipient is required'),
});

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  category: z.string().optional(),
});

// Export validation middleware functions
export const validateUser = createValidator(userSchema);
export const validateClub = createValidator(clubSchema);
export const validateMember = createValidator(memberSchema);
export const validateTeam = createValidator(teamSchema);
export const validatePlayer = createValidator(playerSchema);
export const validateFacility = createValidator(facilitySchema);
export const validateBooking = createValidator(bookingSchema);
export const validateFinance = createValidator(financeSchema);
export const validateMessage = createValidator(messageSchema);
export const validateAnnouncement = createValidator(announcementSchema);

// Parameter validation helpers
export const validateClubId = (req: Request, res: Response, next: NextFunction) => {
  const clubId = parseInt(req.params.clubId);
  if (isNaN(clubId) || clubId <= 0) {
    return res.status(400).json({ message: 'Valid club ID is required' });
  }
  next();
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid user ID is required' });
  }
  next();
};
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseStorage } from '../storage';

// Mock Drizzle ORM
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  
  beforeEach(() => {
    storage = new DatabaseStorage();
    vi.clearAllMocks();
  });

  describe('User Operations', () => {
    it('should get user by id', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };
      
      // Mock DB response
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.select().from().where()).mockResolvedValue([mockUser]);
      
      const result = await storage.getUser('test-user-123');
      
      expect(result).toEqual(mockUser);
    });

    it('should return undefined for non-existent user', async () => {
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.select().from().where()).mockResolvedValue([]);
      
      const result = await storage.getUser('non-existent-user');
      
      expect(result).toBeUndefined();
    });

    it('should create new user', async () => {
      const newUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User'
      };
      
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.insert().values().returning()).mockResolvedValue([newUser]);
      
      const result = await storage.upsertUser(newUser);
      
      expect(result).toEqual(newUser);
    });
  });

  describe('Club Operations', () => {
    it('should get user clubs with active status only', async () => {
      const mockClubs = [
        { id: 1, name: 'Test Club 1', status: 'active' },
        { id: 2, name: 'Test Club 2', status: 'active' }
      ];
      
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.select().from().where()).mockResolvedValue(mockClubs);
      
      const result = await storage.getUserClubs('test-user-123');
      
      expect(result).toEqual(mockClubs);
    });

    it('should create club membership with inactive status', async () => {
      const membershipData = {
        userId: 'test-user-123',
        clubId: 1,
        role: 'member',
        status: 'inactive'
      };
      
      const mockMembership = { id: 1, ...membershipData };
      
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.insert().values().returning()).mockResolvedValue([mockMembership]);
      
      const result = await storage.addUserToClub(membershipData);
      
      expect(result).toEqual(mockMembership);
    });
  });

  describe('Activity Logging', () => {
    it('should create activity log entry', async () => {
      const logData = {
        clubId: 1,
        userId: 'test-user-123',
        action: 'membership_requested',
        description: 'User requested membership',
        metadata: { role: 'member' }
      };
      
      const mockLog = { id: 1, ...logData, createdAt: new Date() };
      
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.insert().values().returning()).mockResolvedValue([mockLog]);
      
      const result = await storage.createActivityLog(logData);
      
      expect(result).toEqual(mockLog);
    });

    it('should get activity logs for club', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'membership_approved',
          description: 'Membership approved',
          createdAt: new Date(),
          user: { id: 'admin-123', firstName: 'Admin', lastName: 'User' }
        }
      ];
      
      const mockDb = await import('../db');
      vi.mocked(mockDb.db.select().from().innerJoin().leftJoin().where().orderBy().limit()).mockResolvedValue(mockLogs);
      
      const result = await storage.getActivityLogs(1, 10);
      
      expect(result).toEqual(mockLogs);
    });
  });
});
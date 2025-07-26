import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { isAuthenticated } from '../replitAuth';

// Mock Express app für Tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
  
  // Mock authenticated route
  app.get('/api/test-protected', isAuthenticated, (req, res) => {
    res.json({ message: 'Protected route accessed', user: req.user });
  });
  
  // Mock public route
  app.get('/api/test-public', (req, res) => {
    res.json({ message: 'Public route accessed' });
  });
  
  return app;
};

describe('Authentication Middleware', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows access to public routes without authentication', async () => {
    const response = await request(app)
      .get('/api/test-public')
      .expect(200);
      
    expect(response.body.message).toBe('Public route accessed');
  });

  it('blocks access to protected routes without authentication', async () => {
    const response = await request(app)
      .get('/api/test-protected')
      .expect(401);
      
    expect(response.body.message).toBe('Unauthorized');
  });

  it('allows access to protected routes with valid session', async () => {
    // Mock authenticated session
    const agent = request.agent(app);
    
    // Simulate login by setting session data
    await agent
      .post('/api/mock-login')
      .send({ userId: 'test-user-123' });
    
    const response = await agent
      .get('/api/test-protected')
      .expect(200);
      
    expect(response.body.message).toBe('Protected route accessed');
  });

  it('handles expired sessions correctly', async () => {
    // Test mit abgelaufener Session würde hier implementiert
    const response = await request(app)
      .get('/api/test-protected')
      .set('Cookie', 'connect.sid=expired-session-id')
      .expect(401);
      
    expect(response.body.message).toBe('Unauthorized');
  });
});
// OpenAPI/Swagger documentation setup for ClubFlow API
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ClubFlow API',
    version: '1.0.0',
    description: 'Comprehensive sports club management platform API',
    contact: {
      name: 'ClubFlow Support',
      email: 'support@teamio.app'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://teamio.app/api' 
        : 'http://localhost:5000/api',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: 'Session cookie authentication'
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
        description: 'CSRF protection token'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'ValidationError' },
              message: { type: 'string', example: 'Invalid input data' },
              field: { type: 'string', example: 'email' },
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string', example: 'abc123' }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '12345' },
          name: { type: 'string', example: 'Max Mustermann' },
          email: { type: 'string', example: 'max.mustermann@example.com' },
          avatar: { type: 'string', example: 'https://example.com/avatar.jpg' }
        }
      },
      Club: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'FC Beispiel' },
          description: { type: 'string', example: 'Ein großartiger Sportverein' },
          address: { type: 'string', example: 'Musterstraße 1, 12345 Beispielstadt' },
          phone: { type: 'string', example: '+49 123 456789' },
          email: { type: 'string', example: 'info@fc-beispiel.de' },
          website: { type: 'string', example: 'https://fc-beispiel.de' },
          foundedYear: { type: 'integer', example: 1950 },
          colors: { type: 'string', example: 'Blau und Weiß' },
          logo: { type: 'string', example: 'https://example.com/logo.png' }
        }
      },
      Member: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          clubId: { type: 'integer', example: 1 },
          firstName: { type: 'string', example: 'Max' },
          lastName: { type: 'string', example: 'Mustermann' },
          email: { type: 'string', example: 'max@example.com' },
          phone: { type: 'string', example: '+49 123 456789' },
          birthDate: { type: 'string', format: 'date', example: '1990-01-01' },
          address: { type: 'string', example: 'Musterstraße 1' },
          membershipNumber: { type: 'string', example: 'M2025001' },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
          joinDate: { type: 'string', format: 'date', example: '2025-01-01' },
          notes: { type: 'string', example: 'Zusätzliche Informationen' }
        }
      },
      Team: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          clubId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Herren 1' },
          category: { type: 'string', example: 'senior' },
          ageGroup: { type: 'string', example: 'U21' },
          coach: { type: 'string', example: 'Trainer Schmidt' },
          league: { type: 'string', example: 'Kreisliga A' },
          season: { type: 'string', example: '2024/25' }
        }
      },
      Facility: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          clubId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Hauptplatz' },
          type: { type: 'string', example: 'field' },
          capacity: { type: 'integer', example: 500 },
          description: { type: 'string', example: 'Naturrasenplatz mit Floodlicht' },
          location: { type: 'string', example: 'Sportanlage Nord' }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          clubId: { type: 'integer', example: 1 },
          facilityId: { type: 'integer', example: 1 },
          teamId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Training Herren 1' },
          type: { type: 'string', enum: ['training', 'game', 'event', 'maintenance'], example: 'training' },
          date: { type: 'string', format: 'date', example: '2025-01-15' },
          startTime: { type: 'string', example: '18:00' },
          endTime: { type: 'string', example: '20:00' },
          recurring: { type: 'boolean', example: true },
          recurringType: { type: 'string', enum: ['weekly', 'monthly'], example: 'weekly' },
          recurringUntil: { type: 'string', format: 'date', example: '2025-06-30' },
          notes: { type: 'string', example: 'Zusätzliche Notizen' }
        }
      }
    }
  },
  security: [
    { cookieAuth: [] },
    { csrfToken: [] }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./server/routes.ts', './server/api-docs-routes.ts'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);

export const setupApiDocs = (app: Express) => {
  // Serve API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ClubFlow API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    }
  }));

  // Serve OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 API Documentation available at /api-docs');
};
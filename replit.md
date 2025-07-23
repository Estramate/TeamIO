# TeamIO Club Management System

## Overview

TeamIO is a comprehensive club management system designed for sports clubs and organizations. It provides a modern, web-based platform for managing members, teams, facilities, bookings, finances, and communications all in one place.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Zustand for client state (club selection)
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Hot reload with Vite middleware integration

### Database Strategy
- **ORM**: Drizzle ORM for type-safe database operations
- **Provider**: Neon Database (serverless PostgreSQL)
- **Schema**: Shared TypeScript schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- **Provider**: Replit's OpenID Connect authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Authorization**: Role-based access control within clubs

### Multi-Club Support
- Users can belong to multiple clubs with different roles
- Club selection persisted in local storage
- Role-based permissions per club membership

### Core Entities
- **Users**: Authentication and profile information
- **Clubs**: Main organizational entity with settings and branding
- **Members**: Club-specific member profiles and data
- **Teams**: Organized groups within clubs with categories and age groups
- **Facilities**: Physical locations and resources for booking
- **Bookings**: Facility reservations and scheduling
- **Events**: Calendar events and activities
- **Finances**: Income, expenses, and financial tracking

### UI/UX Design
- **Design System**: shadcn/ui components with Radix UI primitives
- **Responsive**: Mobile-first design with adaptive layouts
- **Theme**: Neutral color scheme with CSS custom properties
- **Accessibility**: ARIA compliance through Radix UI components

## Data Flow

### Authentication Flow
1. User accesses protected route
2. Redirect to Replit Auth if not authenticated
3. OAuth flow with Replit's OIDC provider
4. User profile creation/update in database
5. Session establishment with PostgreSQL storage

### Club Selection Flow
1. User selects club from dropdown in sidebar
2. Club selection stored in Zustand state and localStorage
3. All subsequent API calls include selected club context
4. Role-based UI adaptation based on user's club membership

### Data Management Flow
1. Frontend makes API requests through TanStack Query
2. Query keys include club context for proper caching
3. Express routes handle club-scoped data operations
4. Drizzle ORM executes type-safe database queries
5. Results cached and synchronized across components

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication and user management
- **WebSockets**: For real-time database connections (via ws package)

### Frontend Libraries
- **React Ecosystem**: React Router alternative (Wouter), React Hook Form, TanStack Query
- **UI Components**: Extensive Radix UI component collection
- **Utilities**: Class variance authority, clsx, date-fns for internationalization

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Development**: Hot reload, error overlays, and debugging tools

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: Replit-specific environment variables for OIDC
- **Sessions**: `SESSION_SECRET` for secure session encryption

### Production Setup
- Express serves built React app as static files
- Database connection pooling with Neon serverless
- Session persistence across server restarts
- Error handling and logging for production monitoring

### Development Workflow
- `npm run dev`: Starts development server with hot reload
- `npm run build`: Creates production build
- `npm run check`: TypeScript compilation check
- Vite proxy for seamless development experience

The architecture prioritizes type safety, developer experience, and scalability while maintaining simplicity for club administrators and users.
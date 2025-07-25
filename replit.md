# TeamIO - Professional Club Management System

## Overview

TeamIO is a comprehensive, modern web-based platform designed for sports clubs and organizations. It provides complete management solutions for members, teams, facilities, bookings, finances, and communication. The system supports multi-club management with role-based access control and features a responsive, accessible design optimized for desktop, tablet, and mobile devices.

**Latest Enhancement**: The platform now includes enterprise-level optimization with performance monitoring, comprehensive testing infrastructure, full WCAG accessibility compliance, virtualized data handling, and professional API documentation.

## Recent Changes (Latest Session - July 25, 2025)
- ✅ Implemented ALL improvements from detailed analysis document
- ✅ Added database optimization with SQL indices for performance and data integrity  
- ✅ Implemented comprehensive API documentation using Swagger/OpenAPI at /api-docs
- ✅ Added React code splitting and lazy loading for all pages to improve initial load times
- ✅ Enhanced accessibility with WCAG compliance, keyboard navigation, and accessible form components
- ✅ Created virtualized lists for handling large datasets efficiently  
- ✅ Added performance monitoring components with Web Vitals tracking
- ✅ Implemented complete testing infrastructure with Vitest, unit tests, and test utilities
- ✅ Added comprehensive error boundaries and centralized error handling
- ✅ Created environment variable template (.env.example) for easy deployment setup
- ✅ Enhanced server-side error reporting and performance monitoring

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development builds and optimized production bundles
- **Tailwind CSS** with shadcn/ui component library for consistent, accessible UI
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Zustand** for client-side state management (club selection, themes)

### Backend Architecture
- **Express.js** with TypeScript for REST API development
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **Neon Database** (serverless PostgreSQL) for cloud database hosting
- **OpenID Connect** authentication with Express sessions
- **Session storage** in PostgreSQL for secure user sessions

### Development Tools
- **TypeScript** in strict mode for comprehensive type checking
- **ESLint** for code quality enforcement
- **Drizzle Kit** for database schema migrations
- **Hot Module Replacement** for efficient development workflow

## Key Components

### Authentication System
- OpenID Connect integration for secure authentication
- Express sessions with PostgreSQL storage
- Role-based access control with club-specific permissions
- Multi-club support with user-club memberships

### Database Schema
- **Core Entities**: Users, Clubs, Members, Teams, Players, Facilities
- **Operations**: Bookings, Events, Finances, Member Fees, Training Fees
- **Relationships**: Club memberships, team assignments, player-team associations
- **Session Management**: Dedicated sessions table for authentication

### State Management
- **Server State**: TanStack Query for API data caching and synchronization
- **Client State**: Zustand stores for UI state (selected club, theme preferences)
- **Cache Invalidation**: Centralized system for maintaining data consistency across entities

### UI Framework
- **Component Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Utility-first Tailwind CSS with CSS custom properties
- **Theming**: Dark/light mode support with club-specific color customization
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts

## Data Flow

### Request Flow
1. User authentication via OpenID Connect
2. Club selection stored in Zustand state
3. API requests include club context for data filtering
4. TanStack Query manages caching and background updates
5. Optimistic updates for improved user experience

### Data Synchronization
- Real-time cache invalidation across related entities
- Background refetching for stale data
- Error handling with unauthorized request redirects
- Centralized API request handling with credential management

## External Dependencies

### Database & Hosting
- **Neon Database**: Serverless PostgreSQL hosting
- **DATABASE_URL**: Environment variable for database connection

### Authentication
- **OpenID Connect**: Replit authentication service
- **ISSUER_URL**: Authentication service endpoint
- **SESSION_SECRET**: Session encryption key

### Development
- **Replit Integration**: Development banner and cartographer plugin
- **WebSocket**: For Neon database connection (ws package)

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized static assets
2. **Backend**: esbuild bundles server code for Node.js
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: `npm run dev` with hot reload and development middleware
- **Production**: `npm run build && npm start` with optimized assets
- **Database**: Automatic schema synchronization via Drizzle

### File Structure
- **Client**: React application in `/client` directory
- **Server**: Express API in `/server` directory  
- **Shared**: Common schemas and types in `/shared` directory
- **Migrations**: Database migrations in `/migrations` directory

### Key Features
- **Multi-Club Support**: Users can manage multiple clubs with granular permissions
- **Real-time Updates**: Live data synchronization across all components
- **Mobile Optimization**: Fully responsive design for all screen sizes
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Performance**: Efficient caching and background updates
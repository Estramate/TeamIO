# TeamIO - Professional Club Management System

## Overview

TeamIO is a comprehensive, modern web-based platform designed for sports clubs and organizations. It provides complete management solutions for members, teams, facilities, bookings, finances, and communication. The system supports multi-club management with role-based access control and features a responsive, accessible design optimized for desktop, tablet, and mobile devices.

**Latest Enhancement**: The platform now includes enterprise-level optimization with performance monitoring, comprehensive testing infrastructure, full WCAG accessibility compliance, virtualized data handling, and professional API documentation.

## Recent Changes (Latest Session - July 25, 2025) - UPDATED
✅ **ADDITIONAL MODULARIZATION AND SECURITY IMPROVEMENTS** completed:

**Database Architecture Enhancement:**
- ✅ Modularized large schema.ts (676 lines) into domain-specific files
- ✅ Created shared/schemas/ directory with core.ts, members.ts, teams.ts, facilities.ts, finances.ts
- ✅ Improved maintainability and reduced complexity per file
- ✅ Enhanced relations and cross-domain references

**Code Quality & Tooling:**
- ✅ ESLint v9 configuration with TypeScript and React support
- ✅ Prettier formatting with consistent style guidelines
- ✅ Enhanced environment configuration with comprehensive .env.example
- ✅ Professional CONTRIBUTING.md with development guidelines

**Security & Logging Enhancement:**
- ✅ Enhanced logging security with sensitive data filtering
- ✅ Automatic redaction of passwords, tokens, API keys from logs
- ✅ Pattern-based detection of sensitive information
- ✅ Improved request/response logging with privacy protection

**Accessibility & WCAG 2.1 AA Compliance:**
- ✅ Comprehensive accessibility hooks (useFocusTrap, useScreenReaderAnnouncement, useKeyboardNavigation)
- ✅ AccessibleButton component with loading states and confirmations
- ✅ Accessibility testing suite with WCAG compliance tests
- ✅ Focus management, keyboard navigation, and screen reader support

**Status: ENTERPRISE-READY+** - All core improvements plus additional modularization, security, and accessibility enhancements completed.

## User Preferences

- **Communication Style**: Simple, everyday language (German preferred)
- **Documentation**: User wants settings and improvements documented in README
- **Memory**: Always remember and document current project settings and state
- **Project Management**: Systematic implementation of improvements with documentation

**Latest User Request**: User reported issues with landing page showing immediate club selection forcing Replit login, logout not clearing cookies properly, and persistent WebSocket console errors. All issues have been resolved:
- ✅ Landing page now shows content first, login only when "Start" button clicked
- ✅ Logout now properly clears all cookies and sessions (Firebase + Replit)
- ✅ WebSocket errors completely eliminated through global HTML-head override
- ✅ System runs cleanly without console spam from Replit's internal WebSocket attempts

**LATEST UPDATE (July 26, 2025):**
✅ **MULTI-PROVIDER AUTHENTICATION SYSTEM** fully implemented:
- ✅ Email + AuthProvider unique constraint system activated
- ✅ Database supports separate accounts per provider (Replit, Firebase/Google)
- ✅ Same email address can have different accounts per authentication provider
- ✅ Provider-specific user handling with proper database separation
- ✅ Cookie-based Firebase authentication working correctly
- ✅ Multi-provider middleware supporting both Replit and Firebase tokens

**Recent Fixes**: 
- Fixed React duplicate key warning in Members component - unique keys now include member ID and index for team mappings
- Removed all console.log statements from Finance components (finance.tsx, finance-fees.tsx) for cleaner production code

**MAJOR UPDATE - Complete Communication System (January 25, 2025):**
✅ **COMPREHENSIVE COMMUNICATION PLATFORM** implemented with all project standards:

**Database Schema & Backend:**
- ✅ Complete communication database schema with messages, announcements, notifications, and communication preferences tables
- ✅ Full PostgreSQL migration with proper indexing and relationships
- ✅ RESTful API endpoints for all communication operations (CRUD, search, statistics)
- ✅ WebSocket server with authentication and real-time broadcasting
- ✅ Club-specific communication with proper access control

**Frontend Implementation:**
- ✅ Modern React communication page with comprehensive UI/UX
- ✅ Real-time WebSocket integration with connection status indicators
- ✅ Custom React hooks for communication management (useCommunication, useWebSocket)
- ✅ Form validation using React Hook Form with Zod schemas
- ✅ Search functionality for messages and announcements
- ✅ Communication statistics dashboard and preference management

**Enterprise Standards Compliance:**
- ✅ TypeScript strict mode with comprehensive type definitions
- ✅ Accessibility (WCAG 2.1 AA) compliant interface components
- ✅ Responsive design for mobile, tablet, and desktop
- ✅ Error handling with toast notifications and loading states
- ✅ German language support with proper localization
- ✅ Real-time updates via WebSocket with automatic reconnection

**Status: FULLY FUNCTIONAL** - Complete communication system successfully tested and deployed with working message sending, WebSocket integration, and multi-recipient support.

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
# TeamIO Club Management System

## Overview

TeamIO is a comprehensive club management system designed for sports clubs and organizations. It provides a modern, web-based platform for managing members, teams, facilities, bookings, finances, and communications all in one place.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Januar 24, 2025 (Neueste)
- **Umfassende Datumsvalidierung implementiert**: Verhindert unmögliche Datumseingaben in allen Formularen
  - Finance-Fees: Enddatum darf nicht vor Startdatum liegen für Mitglieds- und Trainingsbeiträge
  - Members: Geburtsdatum nicht in der Zukunft, Beitrittsdatum nicht vor Geburtsdatum
  - Players: Geburtsdatum nicht in der Zukunft, Vertragsende nicht vor Vertragsbeginn, Vertragsbeginn nicht vor Geburtsdatum
  - Finance: Fälligkeitsdatum nicht vor Transaktionsdatum für alle Finanz-Einträge
  - Intelligente Fehlermeldungen leiten Benutzer zur korrekten Datumseingabe an
  - Verhindert Datenbankfehler durch inkonsistente Datumsbereiche

- **Umfassendes Finance-Dashboard**: Vollständig überarbeitete Finanz-Übersichtsseite mit reichhaltigen Informationen
  - Dashboard-Sektion mit Transaktionsverlauf-Diagramm und Monatsstatistiken hinzugefügt
  - "Neueste Transaktionen" Übersicht mit klickbaren Elementen für schnelle Details
  - Kategorie-Aufschlüsselung für Einnahmen und Ausgaben mit farbkodierten Bereichen
  - Interaktive Statistiken: größte Einnahme/Ausgabe, Durchschnitt pro Transaktion, tägliche Aktivität
  - Leere Zustände für neue Benutzer mit ansprechenden Platzhaltern und Handlungsaufforderungen
  - Responsive Design mit adaptiven Grids für optimale Darstellung auf allen Geräten

- **Finance-Module CRUD-Funktionalität komplett repariert**: Alle Erstellungs- und Bearbeitungsfunktionen funktionieren einwandfrei
  - Edit-Modal Form-Validierungsfehler für recurringInterval Enum behoben (akzeptiert jetzt leere Strings)
  - Separates editFinanceForm Schema implementiert zur Vermeidung von Konflikten zwischen Create und Edit
  - Automatisches Form-Reset nach erfolgreichem Erstellen neuer Transaktionen
  - Umfassende Console-Logging für Debugging und Fehlerverfolgung implementiert
  - Alle CRUD-Operationen (Create, Read, Update, Delete) vollständig funktionsfähig

### Januar 23, 2025 (Frühere Updates)
- **Unified Filter Layout Implementation**: Applied consistent filter design across all management pages
  - Top row: Search field and filter dropdowns with rounded-xl styling and proper heights (h-10)
  - Bottom row: View toggle buttons (Cards/List) on left, blue "Hinzufügen" button on right with sm:ml-auto
  - Standardized across Teams, Members, Players, Facilities, Bookings, and Finance pages
  - All filter containers use identical bg-card rounded-xl shadow-sm border structure
  - Consistent button styling: blue bg-blue-600 hover:bg-blue-700 for add buttons
  - Responsive gap-3 spacing and proper sm:flex-row breakpoints for mobile-first design

- **Header Navigation Fix and Complete Responsive Optimization**: Fixed page title display issue and completed mobile-first design
  - Fixed missing `usePage` hook implementation across all pages (Teams, Finance, Bookings, Facilities, Calendar, Communication, Users)
  - Header now correctly displays current page title instead of always showing "Dashboard"
  - Optimized breakpoint transitions from lg: (1024px) to xl: (1280px) for better tablet experience
  - Improved sidebar collapsing behavior to prevent awkward layout breaks at medium screen sizes
  - Enhanced Finance page with comprehensive mobile responsiveness (1-4 column adaptive grid)
  - Updated Tailwind config with explicit custom breakpoints for consistent responsive behavior
  - Eliminated ungainly layout transitions and improved overall mobile-first user experience

- **Quick Status Toggle in Context Menus**: Implemented elegant status management through 3-dot navigation menus
  - Added "Aktivieren/Deaktivieren" options to all dropdown menus for Teams, Members, and Players
  - Color-coded menu items: green for "Aktivieren", orange for "Deaktivieren", red for "Löschen"
  - Color-coded status badges: green for active records, red for inactive/deactivated records
  - Clean status badge display without visual clutter from toggle switches
  - One-click status changes with proper loading states and error handling
  - Contextual menu items that dynamically show "Aktivieren" or "Deaktivieren" based on current status
  - Consistent user experience across grid and list views for all entity types

- **Complete CRUD Operations Fix**: Resolved all database operation issues across the application
  - Fixed API endpoint inconsistencies - all routes now use proper club-specific structure (/api/clubs/:clubId/)
  - Implemented date field validation for empty strings to prevent PostgreSQL errors
  - Corrected apiRequest parameter order in all frontend mutations (method, url, data)
  - Added comprehensive date field cleaning for Members and Players (birthDate, contractStart, contractEnd, joinDate)
  - All create, read, update, delete operations now function properly for Teams, Members, and Players

- **Collapsible Sidebar with Tooltips**: Implemented modern collapsible navigation sidebar
  - Toggle button (chevron icons) to expand/collapse sidebar on desktop
  - Collapsed mode shows only icons with hover tooltips for all navigation items
  - Smooth transitions and animations for professional web app experience
  - Maintains mobile responsive design with overlay for small screens
  - Tooltips display navigation names and badge counts in collapsed mode
  
- **Consistent Bordered Filter Layout**: Applied unified filter design across all management pages
  - Teams, Players, and Members pages now use identical bordered card containers for filters
  - Beautiful rounded corners, subtle shadows, and proper spacing for professional appearance
  - Consistent button placement and styling across all management interfaces
  
### January 23, 2025 (Earlier Updates)
- **Dark Mode Overhaul**: Completely redesigned dark mode system for better usability
  - Changed background from hsl(240, 10%, 3.9%) to hsl(222, 47%, 11%) for better readability
  - Updated card backgrounds to hsl(225, 44%, 16%) for better definition
  - Enhanced border and input colors to hsl(220, 34%, 25%) for visible boundaries
  - Improved contrast ratios across all components for modern web standards
  
- **UI Improvements**: Fixed duplicate buttons and enhanced user experience
  - Removed duplicate "Mitglied hinzufügen" buttons from header (kept only on specific pages)
  - Updated all components to use consistent theme variables instead of hardcoded gray values
  - Enhanced Member page with better search and filter styling

- **Dynamic Page Titles**: Implemented PageContext system for correct page titles
  - Fixed issue where all pages showed "Dashboard" title
  - Each page now displays correct title and subtitle based on current section

- **Modern Players Page Redesign**: Complete overhaul of players management interface
  - **Team-Based Filtering**: Added tabs for filtering players by team assignments with player counts
  - **Dual View Modes**: Grid and list view toggle for different data consumption preferences
  - **Enhanced Cards**: Hover effects, smooth animations, and professional styling
  - **Unified Card System**: Standardized card design with hidden action menus (3-dot pattern)
  - **Player Detail Modal**: Click-to-view comprehensive player information in read-only format
  - **Sticky Header**: Fixed header with backdrop blur for modern app feel
  - **Responsive Grid**: 1-5 columns adaptive layout based on screen size
  - **Improved Scrolling**: Fixed content area scrolling with proper overflow handling
  - **Modern WebApp-Style Tabs**: Refactored team tabs to modern pill-style buttons with hover effects

- **Complete KM-FR Team Data Integration**: Added all 28 authentic female players from OEFB
  - Imported complete roster from official OEFB website (vereine.oefb.at)
  - All players with authentic names, jersey numbers, positions, and profile images
  - Proper team assignments for accurate filtering and display
  - Positions include: Tor, Verteidigung, Mittelfeld, Sturm

- **Unified 3-Dot Menu System**: Implemented consistent design pattern across all card-based pages
  - **Members Page Modernization**: Complete redesign with unified card system and hidden action menus
  - **Grid/List Toggle**: Consistent view mode switching with modern pill-style buttons
  - **Member Detail Modal**: Click-to-view comprehensive member information in read-only format
  - **Hover Interactions**: Professional hover effects with opacity transitions for action menus
  - **Responsive Design**: Adaptive grid layouts (1-5 columns) based on screen size
  - **Input Field Visibility**: Fixed light mode visibility issues for search and filter inputs
  - **Scroll Performance**: Optimized container overflow handling for smooth scrolling with large datasets

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
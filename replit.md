# ClubFlow - Professional Club Management System

## Overview

ClubFlow ist eine umfassende, moderne webbasierte Plattform für die professionelle Verwaltung von Sportvereinen und Organisationen. Das System bietet vollständige Management-Lösungen für Mitglieder, Teams, Anlagen, Buchungen, Finanzen und Kommunikation mit Multi-Vereins-Unterstützung und rollenbasierter Zugriffskontrolle.

ClubFlow digitalisiert die Vereinsverwaltung und adressiert häufige Herausforderungen wie manuelle Prozesse und fragmentierte Daten. Es ist produktionsreif mit vollständigen CRUD-Operationen, professioneller Settings-Schnittstelle, robusten Benutzerverwaltung und Enterprise-Level-Features inklusive Event-Management für alle Subscription-Typen. Die Plattform ist für nahtlosen Betrieb konzipiert, mit Fokus auf Benutzerfreundlichkeit und Datenintegrität, und ist bereit für den Markteinsatz.

## User Preferences

- **Communication Style**: Simple, everyday language (German preferred)
- **Documentation**: User wants settings and improvements documented in README
- **Memory**: Always remember and document current project settings and state
- **Project Management**: Systematic implementation of improvements with documentation

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with shadcn/ui for consistent, accessible UI
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Zustand** for client-side state management (club selection, themes)

### Backend Architecture
- **Express.js** with TypeScript for REST API development
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **Multi-provider Authentication** (Replit OAuth + Email/Password with 2FA)
- **Session storage** in PostgreSQL
- **SendGrid** for email services

### Core System Features
- **Complete Club Management**: Professional settings interface with full CRUD operations for members, teams, facilities, bookings, finances, and communication.
- **Multi-Club Support**: Users can manage multiple clubs with granular permissions and persistent club selection.
- **Role-based Access Control**: An 8-role system (including Club Administrator, Obmann, Kassier) with unified permissions across backend and frontend.
- **Real-time Communication**: WebSocket-powered messaging and notifications system with intelligent background loading and silent updates.
- **Email System**: SendGrid integration for email invitations and notifications.
- **Subscription Management**: Tiered plans with usage tracking and Super Admin oversight. Free plan includes event management, paid plans include booking functionality.
- **Feature-Gating System**: FeatureGate components protect subscription-restricted pages with elegant upgrade prompts
- **Mobile Optimization**: Fully responsive design for all screen sizes.
- **Accessibility**: WCAG 2.1 AA compliant with comprehensive testing.
- **Performance**: Efficient caching strategies, lazy loading, virtualization, and background data synchronization for optimal user experience.
- **Security**: Database-based Super Admin system, rate-limiting, input sanitization, and 2FA support.
- **UI/UX Decisions**: Modern interface design with full-width responsive layouts, 3-tab professional UI (General, Design, Advanced for settings), real-time statistics, logo management with fallback, and color customization with live preview. Consistent use of professional branding (ClubFlow icons, beta badge).

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting
- **OpenID Connect**: Replit authentication service  
- **SendGrid**: Email service for invitations and notifications
- **WebSocket**: For real-time communication and database connection

## Current Development Status (August 20, 2025)

### 🎯 Contextual Help System with Playful Micro-Interactions Complete
- **Enhanced Tooltip Components**: Custom contextual help with smooth animations and micro-interactions
- **Centralized Help Content**: Organized help system with type-specific styling (info, tip, warning, feature, shortcut)
- **Floating Help Assistant**: Global help companion with expandable interface and page-specific guidance
- **Integrated Throughout Platform**:
  - Dashboard → Tab explanations, KPI guidance, and statistics tooltips
  - Members → Search help, status filtering, and feature explanations
  - Layout → Global floating help with smart page detection
- **Playful Interactions**: Hover effects, pulse animations, and contextual color coding
- **German Localization**: All help content in German for optimal user experience

### 🚀 Feature-Gating System Implementation Complete
- **FeatureGate Components**: All subscription-restricted pages now use FeatureGate for access control
- **Elegant Upgrade Prompts**: Users see professional upgrade cards instead of error messages
- **Page Protection Applied to**:
  - Bookings → facilityBooking Feature (Starter+ Plan)
  - Teams → teamManagement Feature (Starter+ Plan) 
  - Facilities → facilityBooking Feature (Starter+ Plan)
  - Finance → financialReports Feature (Professional+ Plan)
  - Reports → advancedReports Feature (Professional+ Plan)
- **Upgrade Button Fixed**: Correct navigation to /subscription page
- **Production Ready**: All React rendering errors eliminated, consistent UX across platform

### 🔧 React Rendering Stability Achieved
- **Type-Guards Implemented**: Protection against React child rendering errors
- **Console Spam Eliminated**: Clean development environment without debug noise
- **LSP Errors Minimized**: Production-ready codebase with systematic error resolution
- **Subscription Detection**: Correct planType reading from subscription data

### 💻 Technical Architecture Status
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL
- **Authentication**: Multi-provider (Replit OAuth + Email/Password with 2FA)
- **Database**: Modularized schemas (core, members, teams, facilities, finances, communication, subscriptions)
- **Hosting**: Neon Database (serverless PostgreSQL)
- **Email**: SendGrid integration for invitations and notifications

### 🎯 Complete System Documentation
- **Architecture Documentation**: Comprehensive replit.md with current system state
- **Feature-Gating Documentation**: Complete guide at docs/FEATURE_GATING_SYSTEM.md
- **Database Schemas**: Fully documented modularized schemas in shared/schemas/
- **API Integration**: Type-safe Drizzle ORM with complete CRUD operations
- **Subscription System**: Production-ready tiered plans with elegant feature restrictions
- **Development Status**: Zero critical errors, minimal LSP diagnostics, production-ready codebase
# ClubFlow - Professional Club Management System

## Overview

ClubFlow is a comprehensive, modern web-based platform designed for sports clubs and organizations. It provides complete management solutions for members, teams, facilities, bookings, finances, and communication. The system supports multi-club management with role-based access control and features a responsive, accessible design optimized for desktop, tablet, and mobile devices.

ClubFlow aims to digitalize club management, addressing common challenges like manual processes and fragmented data. It is production-ready, featuring full CRUD operations, a professional settings interface, robust user management, and enterprise-level features including event management for all subscription types. The platform is designed for seamless operation, with a focus on user experience and data integrity, and is ready for market adoption.

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
- **Firebase**: Used for multi-provider authentication and deployment in the past. Current status implies a move towards Replit/Email-based auth, but it was integrated. (Note: Original document indicates Firebase components were removed, but mentions it as part of "Multi-provider authentication (Replit + Firebase)" in System Architecture, so it's included here for completeness of past integration.)
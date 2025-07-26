# ClubFlow - Professional Club Management System

ClubFlow is a comprehensive, enterprise-grade web-based platform designed for sports clubs and organizations. Built with cutting-edge technologies and optimized for performance, accessibility, and scalability, it provides complete management solutions for members, teams, facilities, bookings, finances, and communication systems.

## ✨ Key Features

### 🏆 Core Management
- **Member Management**: Complete member profiles with advanced search, filtering, and role-based permissions
- **Team Organization**: Team creation, player assignments, and categorization by age groups and categories
- **Player Database**: Detailed player profiles with contract management, statistics, and multi-team assignments
- **Facility Booking**: Real-time availability checking with recurring bookings and conflict prevention
- **Financial Management**: Comprehensive income/expense tracking, membership fees, and automated reporting

### 🚀 Advanced Functionality
- **Dynamic Dashboard**: Real-time statistics, activity feeds, and data visualization with interactive charts
- **Calendar System**: Drag-and-drop event scheduling with multiple view modes (day, week, month)
- **Automated Reporting**: Professional PDF report generation for finances, members, and team statistics
- **Communication Hub**: Centralized communication tracking and notification system
- **Multi-Club Support**: Users can manage multiple clubs with granular role-based access control

### 💡 User Experience & Performance
- **Enterprise Performance**: Virtualized lists for large datasets, lazy loading, and optimized database queries
- **Full Accessibility**: WCAG 2.1 AA compliant with keyboard navigation, screen reader support, and focus management
- **Professional API**: Complete OpenAPI/Swagger documentation available at `/api-docs` with interactive testing
- **Comprehensive Testing**: Full test coverage with Vitest, unit tests, integration tests, and accessibility testing
- **Performance Monitoring**: Real-time Web Vitals tracking, error reporting, and performance analytics
- **Responsive Design**: Mobile-first design optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface built with shadcn/ui and Tailwind CSS
- **Real-time Updates**: Live data synchronization across all components with intelligent cache management

## 🛠️ Tech Stack

### Frontend Architecture
- **React 18** with TypeScript for type-safe, component-based development
- **Tailwind CSS** for utility-first, responsive styling
- **shadcn/ui** component library with Radix UI primitives for accessibility
- **Wouter** for lightweight, efficient client-side routing
- **TanStack Query** for sophisticated server state management and caching
- **TanStack Virtual** for efficient rendering of large lists
- **Zustand** for predictable client-side state management
- **Vite** for lightning-fast development and optimized production builds

### Backend Infrastructure
- **Express.js** with TypeScript for robust API development
- **PostgreSQL** with Neon serverless hosting for scalable data storage
- **Drizzle ORM** for type-safe database operations and migrations
- **OpenID Connect** authentication with session management
- **Express Sessions** with PostgreSQL storage for secure user sessions
- **Winston** for structured logging and monitoring
- **Helmet** for security headers and CSRF protection

### Development & Quality Assurance
- **TypeScript** strict mode for comprehensive type checking
- **ESLint** for code quality and consistency
- **Vitest** for unit and integration testing
- **@testing-library/react** for component testing
- **Drizzle Kit** for database schema migrations
- **Swagger/OpenAPI** for complete API documentation
- **Hot Module Replacement** for efficient development workflow

## 📋 Prerequisites

- **Node.js 18+** - Latest LTS version recommended
- **PostgreSQL Database** - Neon serverless recommended for production
- **OpenID Connect Provider** - For secure user authentication

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/yourusername/clubflow.git
cd clubflow
npm install
```

### 2. Environment Configuration
Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
ISSUER_URL=https://your-auth-provider.com
SESSION_SECRET=your-very-secure-session-secret-key-here

# Application Settings
NODE_ENV=development
PORT=5000
ALLOWED_DOMAINS=localhost:3000,localhost:5000

# Optional: Security & Performance
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_TIMEOUT_MS=30000
MAX_REQUEST_SIZE_BYTES=10485760
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Optional: Open database studio
npm run db:studio
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📚 API Documentation

TeamIO includes comprehensive API documentation powered by Swagger/OpenAPI:

- **Interactive Documentation**: Visit `/api-docs` when the server is running
- **OpenAPI Spec**: Available at `/api-docs.json`
- **Authentication**: All endpoints use session-based authentication with CSRF protection

## 🏗️ Project Architecture

### Database Schema (Modularized)
The database schema has been modularized into domain-specific files for better maintainability:

```
shared/schemas/
├── index.ts          # Central exports and enhanced relations
├── core.ts           # Users, Clubs, Sessions, Club Memberships
├── members.ts        # Members, Team Memberships
├── teams.ts          # Teams, Players, Player Assignments, Statistics
├── facilities.ts     # Facilities, Bookings, Events
└── finances.ts       # Finances, Member Fees, Training Fees
```

### Code Quality & Standards
- **ESLint v9**: Modern configuration with TypeScript and React support
- **Prettier**: Consistent code formatting across the entire codebase
- **TypeScript**: Strict mode with comprehensive type checking
- **Accessibility**: WCAG 2.1 AA compliance with custom hooks and components

### Security Features
- **Enhanced Logging**: Automatic filtering of sensitive data (passwords, tokens, API keys)
- **Request Security**: Helmet headers, rate limiting, CORS protection
- **Session Management**: Secure session storage with PostgreSQL
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Development Tools
```bash
# Code Quality
npm run lint          # Run ESLint checks
npm run lint:fix      # Fix ESLint issues automatically
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting

# Testing
npm run test          # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate test coverage report

# Database
npm run db:push       # Push schema changes to database
npm run check         # TypeScript type checking
```

## 🎯 Recent Improvements (Latest Session)

### ✅ Database Architecture Enhancement
- Modularized large schema.ts (676 lines) into 5 domain-specific files
- Improved maintainability and reduced complexity per file
- Enhanced relations and cross-domain references

### ✅ Code Quality & Tooling
- ESLint v9 configuration with TypeScript and React support
- Prettier formatting with consistent style guidelines
- Enhanced environment configuration with comprehensive .env.example
- Professional CONTRIBUTING.md with development guidelines

### ✅ Security & Logging Enhancement
- Enhanced logging security with sensitive data filtering
- Automatic redaction of passwords, tokens, API keys from logs
- Pattern-based detection of sensitive information
- Improved request/response logging with privacy protection

### ✅ Accessibility & WCAG 2.1 AA Compliance
- Comprehensive accessibility hooks: `useFocusTrap`, `useScreenReaderAnnouncement`, `useKeyboardNavigation`
- `AccessibleButton` component with loading states and confirmations
- Accessibility testing suite with WCAG compliance tests
- Focus management, keyboard navigation, and screen reader support

## 🔧 Configuration

### Environment Variables
All configuration is managed through environment variables. See `.env.example` for a complete template:

```env
# Core Configuration
DATABASE_URL=postgresql://username:password@host:port/database
ISSUER_URL=https://your-auth-provider.com
SESSION_SECRET=your-very-secure-session-secret-key-here
NODE_ENV=development
PORT=5000

# Security Settings
ALLOWED_DOMAINS=localhost:3000,localhost:5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_TIMEOUT_MS=30000
MAX_REQUEST_SIZE_BYTES=10485760

# Logging
LOG_LEVEL=info
```

### Development Settings
- **Hot Module Replacement**: Automatic reload during development
- **TypeScript**: Strict mode with comprehensive error checking
- **Database**: Automatic schema synchronization via Drizzle
- **Testing**: Comprehensive test suite with coverage reporting

## 🧪 Testing

TeamIO includes comprehensive testing infrastructure:

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database operation testing
- **Accessibility Tests**: WCAG 2.1 AA compliance verification
- **Component Tests**: React component behavior and rendering

### Running Tests
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test src/components/ui/accessible-button.test.tsx
```

## 📈 Performance Features

### Frontend Optimizations
- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Virtualized Lists**: Efficient rendering of large datasets with TanStack Virtual
- **Optimized Queries**: Smart caching and background refetching with TanStack Query

### Backend Optimizations
- **Database Indexing**: Optimized queries with proper database indices
- **Request Timeout**: Configurable timeouts to prevent hanging requests
- **Rate Limiting**: Protection against abuse with configurable limits
- **Response Compression**: Automatic compression for better performance

## 🔒 Security

### Authentication & Authorization
- **OpenID Connect**: Industry-standard authentication protocol
- **Session-based Auth**: Secure session management with PostgreSQL storage
- **Role-based Access**: Granular permissions per club and user role
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Data Protection
- **Sensitive Data Filtering**: Automatic removal of sensitive information from logs
- **Security Headers**: Helmet.js for comprehensive security headers
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Protection**: Drizzle ORM prevents SQL injection attacks

## 📖 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:
- Development setup and prerequisites
- Code style and formatting requirements
- Testing procedures and standards
- Pull request process and requirements
- Security considerations and best practices

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure session secret
4. Configure allowed domains for CORS
5. Set up proper logging levels

### Monitoring & Performance
- API documentation available at `/api-docs`
- Health check endpoint at `/health`
- Performance monitoring built-in
- Structured logging with Winston

---

**Enterprise-Ready**: ClubFlow is production-ready with comprehensive testing, security, accessibility compliance, and professional documentation.

### Key API Endpoints

- `GET /api/auth/user` - Get current authenticated user
- `GET /api/clubs` - List all clubs for current user
- `GET /api/clubs/{clubId}/members` - Get club members
- `GET /api/clubs/{clubId}/teams` - Get club teams
- `GET /api/clubs/{clubId}/bookings` - Get club bookings
- `GET /api/clubs/{clubId}/facilities` - Get club facilities
- `GET /api/clubs/{clubId}/dashboard` - Get dashboard statistics

## 🧪 Testing

ClubFlow includes a comprehensive testing suite:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Categories
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **Accessibility Tests**: WCAG compliance testing
- **Performance Tests**: Load time and interaction testing

## 🏗️ Database Schema

### Core Tables
- **users**: User authentication and profile data
- **clubs**: Club information and settings
- **user_clubs**: User-club memberships with roles
- **members**: Club member profiles and status
- **teams**: Team organization and metadata
- **players**: Player profiles and statistics
- **team_assignments**: Player-team relationships
- **facilities**: Club facilities and resources
- **bookings**: Facility reservations and events
- **finances**: Financial transactions and reporting

### Optimizations
- **Database Indices**: Optimized queries for common operations
- **Foreign Key Constraints**: Data integrity enforcement
- **Session Storage**: Secure user session management
- **Query Optimization**: Efficient data fetching patterns

## 🔧 Development

### Project Structure
```
clubflow/
├── client/src/           # React frontend application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Application pages/routes
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React context providers
│   ├── lib/             # Utility functions and configs
│   └── test/            # Test files and utilities
├── server/              # Express backend application
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data access layer
│   ├── security.ts      # Security middleware
│   └── logger.ts        # Logging configuration
├── shared/              # Shared types and schemas
└── docs/                # Additional documentation
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run db:push` - Apply database schema changes
- `npm run db:studio` - Open database management interface

### Performance Features
- **Code Splitting**: Lazy loading of page components
- **Virtual Scrolling**: Efficient handling of large data lists
- **Query Optimization**: Intelligent caching and background updates
- **Bundle Optimization**: Tree-shaking and modern build optimization
- **Performance Monitoring**: Real-time Web Vitals tracking

### Accessibility Features
- **WCAG 2.1 AA Compliance**: Full accessibility standard compliance
- **Keyboard Navigation**: Complete keyboard-only operation
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Intelligent focus handling and trap
- **High Contrast**: Support for high contrast display modes
- **Responsive Text**: Scalable text for vision accessibility

## 🔒 Security

### Authentication & Authorization
- **OpenID Connect** integration for secure authentication
- **Session-based** authentication with CSRF protection
- **Role-based access control** with club-specific permissions
- **Secure session storage** in PostgreSQL

### Security Headers
- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Rate limiting** for API protection
- **Request validation** with Zod schemas
- **SQL injection** prevention through parameterized queries

## 🚀 Deployment

### Production Requirements
- **Node.js 18+** runtime environment
- **PostgreSQL** database (Neon recommended)
- **OpenID Connect** provider configuration
- **HTTPS** certificate for secure connections

### Environment Variables
Ensure all required environment variables are configured:
- Database connection string
- Authentication provider settings
- Session secrets and security keys
- Performance and monitoring settings

### Performance Optimization
- **Database indices** for query optimization
- **CDN integration** for static asset delivery
- **Gzip compression** for reduced bandwidth
- **Caching strategies** for improved response times

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Performance Tracking**: Web Vitals and custom metrics
- **Error Reporting**: Centralized error logging and reporting
- **API Analytics**: Request/response monitoring
- **User Activity**: Session and interaction tracking

### Integration Ready
- **External Monitoring**: Ready for Sentry, DataDog, or similar services
- **Custom Dashboards**: Performance and usage analytics
- **Alert Systems**: Automated monitoring and notifications

## 🤝 Contributing

We welcome contributions to ClubFlow! Please read our contributing guidelines and:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines
- Follow TypeScript strict mode
- Maintain test coverage above 80%
- Follow accessibility best practices
- Document API changes in OpenAPI spec
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check `/api-docs` for API reference
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Security**: Report security issues privately

---

**TeamIO** - Professional club management made simple and powerful. Built with modern web technologies for scalability, performance, and accessibility.
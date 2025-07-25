# Contributing to TeamIO

Thank you for your interest in contributing to TeamIO! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites
- Node.js 18+ (Latest LTS recommended)
- PostgreSQL database (Neon serverless recommended)
- OpenID Connect provider for authentication

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/teamio.git
   cd teamio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style
- **TypeScript**: Use strict mode with comprehensive type checking
- **Formatting**: Use Prettier (run `npm run format`)
- **Linting**: Use ESLint (run `npm run lint`)
- **Accessibility**: Follow WCAG 2.1 AA guidelines

### Architecture Principles
- **Frontend**: Keep as much logic as possible in the frontend
- **Backend**: Focus on data persistence and API calls only
- **Modular**: Split complex files into domain-specific modules
- **Type Safety**: Use Zod schemas for validation and Drizzle for database operations

### Testing
- **Unit Tests**: Write tests for all critical functions
- **Integration Tests**: Test API endpoints and database operations
- **Accessibility Tests**: Ensure WCAG compliance
- **Run Tests**: `npm test` for all tests, `npm run test:coverage` for coverage

### Database Changes
- **Schema**: Use modular schemas in `shared/schemas/` directory
- **Migrations**: Use `npm run db:push` for schema changes
- **Never**: Write raw SQL migrations manually

### Security Guidelines
- **Sensitive Data**: Never log passwords, tokens, or other sensitive information
- **Authentication**: Use OpenID Connect with proper session management
- **Validation**: Always validate input with Zod schemas
- **CORS**: Configure allowed origins properly

## Project Structure

```
teamio/
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
│   ├── logger.ts        # Logging configuration
│   └── middleware.ts    # Custom middleware
├── shared/              # Shared types and schemas
│   └── schemas/         # Modular schema definitions
└── docs/                # Additional documentation
```

## Pull Request Process

1. **Branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop**: Make your changes following the guidelines above

3. **Test**: Ensure all tests pass
   ```bash
   npm test
   npm run lint
   npm run format:check
   npm run check
   ```

4. **Commit**: Use clear, descriptive commit messages
   ```bash
   git commit -m "feat: add member fee management functionality"
   ```

5. **Push**: Push your branch and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Requirements
- [ ] All tests pass
- [ ] Code follows style guidelines (ESLint + Prettier)
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated if needed
- [ ] Accessibility considerations addressed
- [ ] Security implications considered

## Common Tasks

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link if needed
4. Write tests for the new component

### Adding a New API Endpoint
1. Define schema in appropriate `shared/schemas/` file
2. Add storage method in `server/storage.ts`
3. Add route in `server/routes.ts`
4. Add proper validation and error handling
5. Write integration tests

### Database Schema Changes
1. Modify or add schema in `shared/schemas/`
2. Update relationships in `shared/schemas/index.ts`
3. Run `npm run db:push` to apply changes
4. Update storage interface if needed

## Getting Help

- **Issues**: Check existing GitHub issues or create a new one
- **Documentation**: Refer to README.md and inline code comments
- **Code Review**: Request reviews from maintainers

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines and standards

Thank you for contributing to TeamIO!
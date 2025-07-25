# TeamIO - Comprehensive Club Management System

TeamIO is a modern, web-based platform designed for sports clubs and organizations. It provides complete management solutions for members, teams, facilities, bookings, finances, and communications all in one place.

## ✨ Features

### Core Management
- **Member Management**: Complete member profiles with search, filtering, and role-based permissions
- **Team Organization**: Team creation, player assignments, and categorization by age groups
- **Player Database**: Detailed player profiles with contract management and team assignments
- **Facility Booking**: Real-time availability checking and comprehensive booking management
- **Financial Tracking**: Income/expense tracking, membership fees, and detailed financial reporting

### Advanced Functionality
- **Dashboard Analytics**: Real-time statistics and data visualization
- **Calendar Integration**: Event scheduling with drag-and-drop functionality
- **Automated Reporting**: PDF report generation for finances, members, and team statistics
- **Communication Hub**: Centralized communication tracking and notifications
- **Multi-Club Support**: Users can manage multiple clubs with role-based access

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: Automatic theme switching with user preferences
- **Modern UI**: Clean, professional interface built with shadcn/ui components
- **Real-time Updates**: Live data synchronization across all components

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** component library with Radix UI primitives
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient server state management
- **Zustand** for client-side state management
- **Vite** for fast development and optimized builds

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Replit Auth** with OpenID Connect for secure authentication
- **Express Sessions** with PostgreSQL storage

### Development Tools
- **TypeScript** strict mode for robust type checking
- **ESLint** for code quality
- **Drizzle Kit** for database migrations
- **Hot Reload** development environment

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Replit account for authentication (or custom OIDC provider)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/teamio.git
   cd teamio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   SESSION_SECRET=your-session-secret-key
   # Add Replit Auth variables if using Replit Auth
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Seed Database (Optional)**
   ```bash
   npm run seed:all
   ```

## 🎯 Getting Started

### Development Mode
```bash
npm run dev
```
This starts both the frontend (Vite) and backend (Express) servers with hot reload.

### Production Build
```bash
npm run build
npm start
```

### Available Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run seed:all` - Seed database with sample data

## 📁 Project Structure

```
teamio/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utility functions and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data access layer
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── package.json
```

## 🔐 Authentication

TeamIO uses Replit Auth with OpenID Connect for secure user authentication. Users can:
- Sign in with their Replit account
- Automatic user profile creation
- Role-based access control within clubs
- Multi-club membership support

## 📊 Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users**: Authentication and profile information
- **Clubs**: Main organizational entities
- **Members**: Club-specific member profiles
- **Teams**: Organized groups within clubs
- **Players**: Detailed player information with team assignments
- **Facilities**: Bookable resources and locations
- **Bookings**: Facility reservations and scheduling
- **Events**: Calendar events and activities
- **Finances**: Financial transactions and tracking

## 🎨 UI Components

Built with shadcn/ui and Radix UI for:
- Accessibility compliance
- Consistent design system
- Professional component library
- Customizable themes
- Responsive layouts

## 📱 Mobile Support

- Mobile-first responsive design
- Touch-friendly interfaces
- Optimized layouts for small screens
- Progressive Web App capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Implement responsive design
- Add appropriate error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `replit.md`
- Review the codebase examples

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external calendars
- [ ] Automated email notifications
- [ ] Multi-language support
- [ ] Advanced role management
- [ ] API documentation
- [ ] Webhook integrations

## 🙏 Acknowledgments

- Built with love for sports clubs and organizations
- Powered by modern web technologies
- Designed for scalability and user experience

---

**TeamIO** - Making club management simple and efficient.
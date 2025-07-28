# ClubFlow - Professionelle Vereinsmanagement-Plattform

![ClubFlow Logo](https://img.shields.io/badge/ClubFlow-Vereinsmanagement-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Enterprise%20Ready-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0-orange?style=for-the-badge)

## 🏆 Überblick

ClubFlow ist eine moderne, webbasierte Plattform für die umfassende Verwaltung von Sportvereinen und Organisationen. Das System bietet komplette Management-Lösungen für Mitglieder, Teams, Anlagen, Buchungen, Finanzen und Kommunikation mit Multi-Vereins-Unterstützung und rollenbasierter Zugriffskontrolle.

### ✨ Hauptfunktionen

- **🔐 Multi-Provider-Authentifizierung** - Replit & Google OAuth Integration
- **👥 Mitgliederverwaltung** - Genehmigungssystem für neue Mitglieder
- **🏅 Team-Management** - Vollständige Team- und Spielerverwaltung
- **🏟️ Anlagenbuchung** - Buchungssystem für Vereinsanlagen
- **💰 Finanzmanagement** - Budgetverfolgung und Beitragsverwaltung
- **📧 Kommunikation** - Nachrichten, Ankündigungen und Benachrichtigungen
- **📊 Activity-Tracking** - Vollständiges Aktivitätsprotokoll aller Benutzeraktionen
- **📱 Responsive Design** - Optimiert für Desktop, Tablet und Mobile

## 🚀 Aktuelle Version - Enterprise Ready+

### Neueste Updates (Juli 26, 2025)

#### ✅ Komponenten-Standardisierung Abgeschlossen
- **PascalCase-Namenskonvention** für alle Komponentendateien
- **Import-Optimierung** - Alle @shared/schema zu @shared/schemas/core
- **Datei-Struktur bereinigt** für bessere Code-Qualität

#### ✅ Activity-Logging-System Implementiert
- **Automatisches Protokollieren** aller kritischen Benutzeraktionen:
  - Mitgliedschaftsanträge, Genehmigungen, Ablehnungen
  - Rollenänderungen und Status-Updates
  - E-Mail-Einladungen und Administratoraktionen
- **Datenbank-Integration** mit vollständiger Metadaten-Erfassung
- **Admin-Dashboard** für Aktivitätseinsicht

#### ✅ CSS-Layout-Optimierungen
- **Team-Status-Widget** repariert - keine Container-Überschreitungen mehr
- **Responsive Grid-Layouts** für alle Dashboard-Komponenten
- **Text-Truncation** für lange Inhalte implementiert

### Vollständig Implementierte Features

#### 🔒 Authentifizierung & Sicherheit
- Multi-Provider OAuth (Replit + Google)
- Sichere Session-Verwaltung mit PostgreSQL
- Rollenbasierte Zugriffskontrolle
- Activity-Logging für Compliance

#### 👤 Benutzer- & Mitgliederverwaltung
- Genehmigungsworkflow für neue Mitglieder
- E-Mail-Einladungssystem mit SendGrid
- Automatische Rollenzuweisung
- Vollständiges Aktivitätsprotokoll

#### 🏢 Multi-Vereins-Architektur
- Beliebig viele Vereine pro Benutzer
- Vereinsspezifische Berechtigungen
- Club-Branding und Anpassung
- Isolierte Datenverwaltung

#### 📊 Dashboard & Reporting
- Echtzeit-Statistiken und Metriken
- Aktivitätsverfolgung
- Team-Status-Übersicht
- Finanzielle Zusammenfassungen

## 🛠️ Technische Architektur

### Frontend-Stack
- **React 18** mit TypeScript für typsichere Entwicklung
- **Vite** für schnelle Entwicklung und optimierte Production-Builds
- **Tailwind CSS** + shadcn/ui für konsistente, zugängliche UI
- **Wouter** für Client-Side-Routing
- **TanStack Query** für Server-State-Management
- **Zustand** für Client-State-Management

### Backend-Stack
- **Express.js** mit TypeScript für REST API
- **Drizzle ORM** mit PostgreSQL für typsichere Datenbankoperationen
- **Neon Database** (serverless PostgreSQL) für Cloud-Hosting
- **OpenID Connect** Authentifizierung mit Express Sessions
- **Winston** für strukturiertes Logging

### Datenbank-Schema (Modularisiert)
```
shared/schemas/
├── core.ts        # Users, Clubs, Sessions, Activity Logs
├── members.ts     # Memberships, Team Assignments
├── teams.ts       # Teams, Players, Statistics
├── facilities.ts  # Facilities, Bookings
├── finances.ts    # Budgets, Fees, Transactions
└── communication.ts # Messages, Announcements, Notifications
```

### Entwicklungstools
- **TypeScript** im Strict-Modus
- **ESLint v9** für Code-Qualität
- **Prettier** für einheitliche Formatierung
- **Drizzle Kit** für Datenbankmigrationen
- **Hot Module Replacement** für effizienten Entwicklungsworkflow

## 🚦 Installation & Setup

### Voraussetzungen
- Node.js 18+ 
- PostgreSQL-Datenbank (Neon empfohlen)
- Replit-Account für Authentifizierung

### Schnellstart
```bash
# Repository klonen
git clone <repository-url>
cd clubflow

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeiten Sie .env mit Ihrigen Credentials

# Datenbank-Schema anwenden
npm run db:push

# Entwicklungsserver starten
npm run dev
```

### Erforderliche Umgebungsvariablen
```env
# Datenbank
DATABASE_URL=postgresql://...

# Authentifizierung
SESSION_SECRET=your-session-secret
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app

# Firebase (optional)
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id
# ... weitere Firebase-Konfiguration

# E-Mail Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key-here
# Note: Using verified sender address club.flow.2025@gmail.com
```

## 📋 Verfügbare Scripts

```bash
npm run dev          # Entwicklungsserver starten
npm run build        # Production-Build erstellen
npm start           # Production-Server starten
npm run db:push     # Datenbankschema synchronisieren
npm run db:studio   # Drizzle Studio öffnen
npm run lint        # Code-Qualitätsprüfung
npm run format      # Code-Formatierung
```

## 🏗️ Projektstruktur

```
clubflow/
├── client/src/           # React Frontend
│   ├── components/       # Wiederverwendbare UI-Komponenten
│   ├── pages/           # Seiten-Komponenten (PascalCase)
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Utility-Funktionen
│   └── contexts/        # React Context Provider
├── server/              # Express Backend
│   ├── routes.ts        # API-Endpunkte
│   ├── storage.ts       # Datenbank-Operationen
│   ├── auth.ts          # Authentifizierung
│   └── middleware/      # Express Middleware
├── shared/              # Geteilte Typen und Schemas
│   └── schemas/         # Modularisierte Datenbankschemas
└── docs/               # Dokumentation
```

## 🔧 API-Dokumentation

Die vollständige API-Dokumentation ist verfügbar unter `/api-docs` wenn der Server läuft.

### Wichtige Endpunkte
- `GET /api/auth/user` - Aktuelle Benutzerinformationen
- `GET /api/clubs` - Benutzer-Vereine (nur aktive)
- `POST /api/clubs/:id/join` - Vereinsbeitritt beantragen
- `GET /api/clubs/:id/members` - Vereinsmitglieder
- `GET /api/clubs/:id/activity-logs` - Aktivitätsprotokoll (Admin)

## 🎯 Funktionale Highlights

### Mitgliedschafts-Genehmigungsworkflow
1. **Benutzer beantragt** Vereinsmitgliedschaft
2. **System erstellt** inaktive Mitgliedschaft
3. **Administrator genehmigt/lehnt ab** über Users-Seite
4. **Automatisches Logging** aller Aktionen
5. **E-Mail-Benachrichtigungen** (optional)

### Multi-Club-Management
- Benutzer können mehreren Vereinen angehören
- Vereinsspezifische Rollen und Berechtigungen
- Automatische Club-Auswahl bei einzelner Mitgliedschaft
- Vereinsisolierte Datenansicht

### Activity-Tracking-System
- Protokollierung aller kritischen Benutzeraktionen
- Metadaten-Erfassung (IP, User-Agent, Timestamps)
- Admin-Dashboard für Compliance-Übersicht
- Deutsche Lokalisierung aller Log-Nachrichten

## 🌟 Enterprise-Features

### Sicherheit & Compliance
- ✅ WCAG 2.1 AA Accessibility-Compliance
- ✅ Sensitive Daten-Filtering in Logs
- ✅ Rate-Limiting für API-Endpunkte
- ✅ SQL-Injection-Schutz durch Drizzle ORM

### Performance & Skalierbarkeit
- ✅ Server-Side Caching mit TanStack Query
- ✅ Optimistische Updates für bessere UX
- ✅ Lazy Loading für große Datasets
- ✅ Virtualisierte Listen für Performance

### Entwicklererfahrung
- ✅ TypeScript Strict Mode
- ✅ Comprehensive Error Handling
- ✅ Strukturierte Logging mit Winston
- ✅ Hot Module Replacement

## 🤝 Beiträge

Detaillierte Entwicklungsrichtlinien finden Sie in [CONTRIBUTING.md](./CONTRIBUTING.md).

### Code-Standards
- **TypeScript Strict Mode** für alle neuen Dateien
- **PascalCase** für Komponentendateien
- **Deutsche UI-Texte** für Benutzerfreundlichkeit
- **Comprehensive Testing** für kritische Features

## 📄 Lizenz

Dieses Projekt ist proprietär. Alle Rechte vorbehalten.

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die API-Dokumentation unter `/api-docs`
2. Konsultieren Sie die Entwicklungsrichtlinien in `CONTRIBUTING.md`
3. Überprüfen Sie die Activity-Logs für Debugging-Informationen

---

**Status**: Enterprise-Ready+ ✅ | **Letzte Aktualisierung**: Juli 26, 2025 | **Version**: 2.0
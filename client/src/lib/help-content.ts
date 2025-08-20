// Centralized help content for contextual tooltips
export interface HelpContent {
  id: string
  title: string
  content: string
  type: "info" | "tip" | "warning" | "feature" | "shortcut"
  category: string
}

export const helpContent: Record<string, HelpContent> = {
  // Dashboard Help
  "dashboard-stats": {
    id: "dashboard-stats",
    title: "Vereinsstatistiken", 
    content: "Diese Übersicht zeigt die wichtigsten Kennzahlen Ihres Vereins in Echtzeit. Alle Daten werden direkt aus der Datenbank berechnet.",
    type: "info",
    category: "dashboard"
  },
  "dashboard-kpis": {
    id: "dashboard-kpis",
    title: "Key Performance Indikatoren",
    content: "KPIs helfen Ihnen, die Leistung Ihres Vereins zu messen. Grün bedeutet über dem Ziel, Orange unter dem Ziel.",
    type: "tip", 
    category: "dashboard"
  },
  "dashboard-analytics": {
    id: "dashboard-analytics", 
    title: "Erweiterte Analytics",
    content: "Detaillierte Analysen und Trends für professionelle Vereinsführung. Verfügbar ab Professional Plan.",
    type: "feature",
    category: "dashboard"
  },

  // Member Management Help
  "members-overview": {
    id: "members-overview",
    title: "Mitgliederverwaltung",
    content: "Verwalten Sie alle Vereinsmitglieder zentral. Fügen Sie neue Mitglieder hinzu, bearbeiten Sie Profile und verfolgen Sie Mitgliedsstatus.",
    type: "info", 
    category: "members"
  },
  "member-status": {
    id: "member-status",
    title: "Mitgliederstatus",
    content: "Aktiv = zahlendes Mitglied, Inaktiv = pausiert, Pending = wartet auf Bestätigung",
    type: "tip",
    category: "members"
  },
  "member-fees": {
    id: "member-fees",
    title: "Mitgliedsbeiträge",
    content: "Automatische Beitragsverwaltung mit flexiblen Zahlungsintervallen. Verfolgen Sie Zahlungsstatus und senden Sie Erinnerungen.",
    type: "feature",
    category: "members"
  },

  // Team Management Help  
  "teams-overview": {
    id: "teams-overview",
    title: "Team-Management",
    content: "Organisieren Sie Ihre Mannschaften effizient. Erstellen Sie Teams, weisen Sie Spieler zu und verwalten Sie Trainingszeiten.",
    type: "info",
    category: "teams"
  },
  "team-players": {
    id: "team-players", 
    title: "Spielerzuordnung",
    content: "Spieler können mehreren Teams zugeordnet werden. Drag & Drop für einfache Teamwechsel.",
    type: "tip",
    category: "teams"
  },

  // Booking System Help
  "bookings-overview": {
    id: "bookings-overview",
    title: "Buchungssystem",
    content: "Verwalten Sie Anlagenbuchungen zentral. Vermeiden Sie Konflikte durch automatische Überschneidungsprüfung.", 
    type: "info",
    category: "bookings"
  },
  "booking-types": {
    id: "booking-types",
    title: "Buchungsarten",
    content: "Training (Blau), Spiel (Orange), Event (Lila), Wartung (Gelb). Jeder Typ hat eigene Regeln und Prioritäten.",
    type: "tip",
    category: "bookings"
  },
  "booking-conflicts": {
    id: "booking-conflicts",
    title: "Konfliktvermeidung", 
    content: "Das System prüft automatisch Überschneidungen und warnt vor Doppelbuchungen. Wartungstermine blockieren andere Buchungen.",
    type: "warning",
    category: "bookings"
  },

  // Finance Help
  "finance-overview": {
    id: "finance-overview",
    title: "Finanzverwaltung",
    content: "Komplette Übersicht über Vereinsfinanzen. Verfolgen Sie Einnahmen, Ausgaben und erstellen Sie Berichte.",
    type: "info",
    category: "finance"
  },
  "transaction-categories": {
    id: "transaction-categories",
    title: "Transaktionskategorien",
    content: "Ordnen Sie alle Transaktionen in Kategorien für bessere Übersicht: Mitgliedsbeiträge, Ausrüstung, Wartung, etc.",
    type: "tip",
    category: "finance"
  },
  "financial-reports": {
    id: "financial-reports",
    title: "Finanzberichte",
    content: "Automatische Berichte mit Gewinn-Verlust-Rechnung, Cashflow und Budget-Analyse. Verfügbar ab Professional Plan.",
    type: "feature", 
    category: "finance"
  },

  // Settings Help
  "club-settings": {
    id: "club-settings",
    title: "Vereinseinstellungen",
    content: "Konfigurieren Sie Ihren Verein: Logo, Farben, Kontaktdaten und erweiterte Funktionen.",
    type: "info",
    category: "settings"
  },
  "theme-customization": {
    id: "theme-customization", 
    title: "Design anpassen",
    content: "Personalisieren Sie ClubFlow mit Ihren Vereinsfarben und Logo für ein professionelles Erscheinungsbild.",
    type: "feature",
    category: "settings"
  },

  // Keyboard Shortcuts
  "shortcut-search": {
    id: "shortcut-search",
    title: "Suche öffnen",
    content: "Schnelle Navigation durch alle Bereiche",
    type: "shortcut", 
    category: "shortcuts"
  },
  "shortcut-add": {
    id: "shortcut-add",
    title: "Neuen Eintrag erstellen",
    content: "Fügen Sie schnell neue Mitglieder, Teams oder Buchungen hinzu",
    type: "shortcut",
    category: "shortcuts"
  }
}

// Helper function to get help content by ID
export function getHelpContent(id: string): HelpContent | null {
  return helpContent[id] || null
}

// Helper function to get help content by category
export function getHelpByCategory(category: string): HelpContent[] {
  return Object.values(helpContent).filter(help => help.category === category)
}

// Contextual help for specific UI patterns
export const uiPatterns = {
  // Form field help
  requiredField: {
    title: "Pflichtfeld",
    content: "Dieses Feld muss ausgefüllt werden",
    type: "warning" as const
  },
  
  // Status indicators
  statusActive: {
    title: "Aktiver Status", 
    content: "Element ist aktiv und funktional",
    type: "info" as const
  },
  
  // Feature gates
  premiumFeature: {
    title: "Premium Feature",
    content: "Diese Funktion ist in höheren Plänen verfügbar",
    type: "feature" as const
  },

  // Data validation
  dataValidation: {
    title: "Eingabevalidierung",
    content: "Überprüfen Sie Ihre Eingabe auf Korrektheit",
    type: "warning" as const
  }
}
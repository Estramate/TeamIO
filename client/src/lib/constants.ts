export const CLUB_ROLES = {
  // Vorstand & Führung
  CLUB_ADMINISTRATOR: 'club-administrator',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice-president',
  TREASURER: 'treasurer',
  SECRETARY: 'secretary',
  SPORTS_DIRECTOR: 'sports-director',
  YOUTH_LEADER: 'youth-leader',
  BOARD_MEMBER: 'board-member',

  // Trainer & Betreuer
  HEAD_COACH: 'head-coach',
  COACH: 'coach',
  ASSISTANT_COACH: 'assistant-coach',
  GOALKEEPER_COACH: 'goalkeeper-coach',
  YOUTH_COACH: 'youth-coach',
  TEAM_MANAGER: 'team-manager',
  PHYSIOTHERAPIST: 'physiotherapist',

  // Funktionäre
  REFEREE: 'referee',
  LINESMAN: 'linesman',
  TIMEKEEPER: 'timekeeper',
  MATCH_COMMISSIONER: 'match-commissioner',

  // Verwaltung & Organisation
  MEMBER_ADMIN: 'member-admin',
  EVENT_COORDINATOR: 'event-coordinator',
  MARKETING_PR: 'marketing-pr',
  GROUNDSKEEPER: 'groundskeeper',
  EQUIPMENT_MANAGER: 'equipment-manager',
  COMMITTEE_MEMBER: 'committee-member',

  // Sektionsleiter
  FOOTBALL_SECTION_LEADER: 'football-section-leader',
  TENNIS_SECTION_LEADER: 'tennis-section-leader',
  VOLLEYBALL_SECTION_LEADER: 'volleyball-section-leader',
  HANDBALL_SECTION_LEADER: 'handball-section-leader',
  BASKETBALL_SECTION_LEADER: 'basketball-section-leader',
  ATHLETICS_SECTION_LEADER: 'athletics-section-leader',
  GYMNASTICS_SECTION_LEADER: 'gymnastics-section-leader',
  SWIMMING_SECTION_LEADER: 'swimming-section-leader',

  // Spielerrollen
  TEAM_CAPTAIN: 'team-captain',
  VICE_CAPTAIN: 'vice-captain',
  PLAYER: 'player',

  // Ehrenmitglieder
  HONORARY_PRESIDENT: 'honorary-president',
  HONORARY_MEMBER: 'honorary-member',
  FOUNDING_MEMBER: 'founding-member',

  // Mitgliedschaft
  PASSIVE_MEMBER: 'passive-member',
  SUPPORTING_MEMBER: 'supporting-member',
  VOLUNTEER: 'volunteer',
  MEMBER: 'member',
};

export const PERMISSIONS = {
  USER_MANAGEMENT: {
    VIEW: 'user_management.view',
    CREATE: 'user_management.create',
    EDIT: 'user_management.edit',
    DELETE: 'user_management.delete',
    CHANGE_ROLES: 'user_management.change_roles',
    RESET_PASSWORD: 'user_management.reset_password',
  },
  MEMBER_MANAGEMENT: {
    VIEW: 'member_management.view',
    VIEW_ALL: 'member_management.view_all',
    VIEW_OWN_TEAM: 'member_management.view_own_team',
    CREATE: 'member_management.create',
    EDIT: 'member_management.edit',
    EDIT_OWN_TEAM: 'member_management.edit_own_team',
    DELETE: 'member_management.delete',
    IMPORT: 'member_management.import',
    EXPORT: 'member_management.export',
  },
  TEAM_MANAGEMENT: {
    VIEW: 'team_management.view',
    VIEW_ALL: 'team_management.view_all',
    VIEW_OWN_TEAM: 'team_management.view_own_team',
    CREATE: 'team_management.create',
    EDIT: 'team_management.edit',
    EDIT_OWN_TEAM: 'team_management.edit_own_team',
    DELETE: 'team_management.delete',
    MANAGE_COACHES: 'team_management.manage_coaches',
  },
  FACILITY_MANAGEMENT: {
    VIEW: 'facility_management.view',
    CREATE: 'facility_management.create',
    EDIT: 'facility_management.edit',
    DELETE: 'facility_management.delete',
    MAINTAIN: 'facility_management.maintain',
  },
  BOOKING_MANAGEMENT: {
    VIEW: 'booking_management.view',
    VIEW_ALL: 'booking_management.view_all',
    VIEW_OWN_TEAM: 'booking_management.view_own_team',
    CREATE: 'booking_management.create',
    CREATE_OWN_TEAM: 'booking_management.create_own_team',
    EDIT: 'booking_management.edit',
    EDIT_OWN_TEAM: 'booking_management.edit_own_team',
    DELETE: 'booking_management.delete',
    APPROVE: 'booking_management.approve',
  },
  FINANCE_MANAGEMENT: {
    VIEW: 'finance_management.view',
    VIEW_SUMMARY: 'finance_management.view_summary',
    CREATE: 'finance_management.create',
    EDIT: 'finance_management.edit',
    DELETE: 'finance_management.delete',
    APPROVE_EXPENSES: 'finance_management.approve_expenses',
    EXPORT: 'finance_management.export',
  },
  COMMUNICATION: {
    VIEW: 'communication.view',
    SEND_MESSAGES: 'communication.send_messages',
    SEND_TEAM_MESSAGES: 'communication.send_team_messages',
    SEND_ANNOUNCEMENTS: 'communication.send_announcements',
    MODERATE: 'communication.moderate',
  },
  REPORTS: {
    VIEW_BASIC: 'reports.view_basic',
    VIEW_DETAILED: 'reports.view_detailed',
    VIEW_FINANCIAL: 'reports.view_financial',
    EXPORT: 'reports.export',
  },
  CALENDAR: {
    VIEW: 'calendar.view',
    VIEW_ALL: 'calendar.view_all',
    VIEW_OWN_TEAM: 'calendar.view_own_team',
    CREATE: 'calendar.create',
    CREATE_OWN_TEAM: 'calendar.create_own_team',
    EDIT: 'calendar.edit',
    EDIT_OWN_TEAM: 'calendar.edit_own_team',
    DELETE: 'calendar.delete',
  },
  SYSTEM_ADMIN: {
    BACKUP: 'system_admin.backup',
    RESTORE: 'system_admin.restore',
    MAINTENANCE_MODE: 'system_admin.maintenance_mode',
    VIEW_LOGS: 'system_admin.view_logs',
    SYSTEM_SETTINGS: 'system_admin.system_settings',
    DATABASE_MANAGEMENT: 'system_admin.database_management',
  },
};

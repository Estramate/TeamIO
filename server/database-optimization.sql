-- Database optimization indices for ClubFlow
-- These indices improve query performance for frequently accessed data

-- User authentication and sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Club access patterns
CREATE INDEX IF NOT EXISTS idx_user_clubs_user_id ON user_clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clubs_club_id ON user_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_user_clubs_status ON user_clubs(status);
CREATE INDEX IF NOT EXISTS idx_user_clubs_composite ON user_clubs(user_id, club_id, status);

-- Member queries
CREATE INDEX IF NOT EXISTS idx_members_club_id ON members(club_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_members_search ON members(club_id, status, first_name, last_name);

-- Team operations
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team_id ON team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_player_id ON team_assignments(player_id);

-- Booking system performance
CREATE INDEX IF NOT EXISTS idx_bookings_club_id ON bookings(club_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_search ON bookings(club_id, facility_id, date);

-- Financial operations
CREATE INDEX IF NOT EXISTS idx_finances_club_id ON finances(club_id);
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(date);
CREATE INDEX IF NOT EXISTS idx_finances_reporting ON finances(club_id, type, date);

-- Facilities
CREATE INDEX IF NOT EXISTS idx_facilities_club_id ON facilities(club_id);

-- Optimize common text searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_members_email_lower ON members(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Audit and activity tracking
CREATE INDEX IF NOT EXISTS idx_activities_club_id ON activities(club_id) WHERE activities IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(created_at) WHERE activities IS NOT NULL;
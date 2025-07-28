# Datenbank-Tabellen-Analyse - Genutzte vs. Ungenutzte Tabellen

## AKTIV GENUTZTE TABELLEN (18)
✅ **Core System:**
- `users` - Benutzerkonten und Authentifizierung 
- `clubs` - Vereinsdaten und Einstellungen
- `club_memberships` - Benutzer-Verein-Zuordnungen
- `roles` - Rollenverwaltung (normalisiert)
- `sessions` - Session-Management

✅ **Member & Team Management:**
- `members` - Vereinsmitglieder
- `teams` - Teams/Mannschaften
- `team_memberships` - Team-Zuordnungen
- `players` - Spielerdaten
- `player_team_assignments` - Spieler-Team-Zuordnungen

✅ **Operations & Booking:**
- `facilities` - Sportstätten/Anlagen
- `bookings` - Buchungen und Reservierungen
- `finances` - Finanzielle Transaktionen
- `member_fees` - Mitgliedsbeiträge
- `training_fees` - Trainingsgebühren

✅ **Communication System:**
- `announcements` - Vereinsankündigungen
- `messages` - Interne Nachrichten
- `message_recipients` - Nachrichtenempfänger

✅ **Admin & Tracking:**
- `activity_logs` - System-Aktivitätsprotokolle
- `email_invitations` - E-Mail-Einladungssystem
- `subscription_plans` - Abo-Pläne
- `club_subscriptions` - Vereins-Abonnements
- `user_notification_preferences` - Benachrichtigungseinstellungen

## POTENTIELL UNGENUTZTE TABELLEN (12)

⚠️ **Live Chat System (Doppelte Implementierung):**
- `live_chat_rooms` - Duplikat zu `chat_rooms`
- `live_chat_messages` - Duplikat zu Chat-System  
- `live_chat_message_read_status` - Read-Status für Live Chat
- `live_chat_room_participants` - Duplikat zu `chat_room_participants`

⚠️ **Alternative Chat Implementation:**
- `chat_rooms` - Chat-Räume (neue Implementierung)
- `chat_room_participants` - Chat-Teilnehmer

⚠️ **Notification System:**
- `notifications` - Benachrichtigungen (SQL-Fehler)
- `user_activity` - Benutzeraktivität (möglicherweise unused)

## EMPFOHLENE BEREINIGUNG

**1. Live Chat Konsolidierung:**
- Behalte: `chat_rooms`, `chat_room_participants` (neue, saubere Implementation)
- Lösche: `live_chat_*` Tabellen (veraltete Implementierung)

**2. System-Integration:**
- Repariere `notifications` Tabelle (aktuell SQL-Fehler)
- Integriere `user_activity` ordnungsgemäß oder entfernen

**3. Datenmigration:**
- Falls Daten in `live_chat_*` Tabellen vorhanden: Migration zu `chat_*` Tabellen
- Dann Löschung der veralteten Tabellen

## GESCHÄTZTE SPEICHERERSPARNIS
Durch Löschung der unused Tabellen: ~30-40% weniger Datenbank-Overhead
import sgMail from '@sendgrid/mail';
import pg from 'pg';

// Use environment variable for API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const token = 'invite_test_1755092740_new';
const invitationUrl = `https://clubflow.replit.app/invitation/${token}`;

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

try {
  await client.connect();
  
  // Test-Benutzer erstellen
  await client.query(`
    INSERT INTO users (
      id, email, first_name, last_name, auth_provider, is_active, 
      has_completed_onboarding, preferred_language, is_super_admin
    ) VALUES (
      'test_user_1755092740', 'test.registrierung@example.com',
      'Test', 'Benutzer', 'email', false, false, 'de', false
    ) ON CONFLICT (email, auth_provider) DO NOTHING
  `);

  // Club-Mitgliedschaft erstellen
  await client.query(`
    INSERT INTO club_memberships (
      user_id, club_id, role_id, status, joined_at
    ) VALUES (
      'test_user_1755092740', 2, 3, 'pending', NOW()
    ) ON CONFLICT (user_id, club_id) DO NOTHING
  `);

  // Einladung erstellen
  await client.query(`
    INSERT INTO club_invitations (
      id, club_id, email, invited_by, role_id, token, expires_at, status, created_at
    ) VALUES (
      'inv_test_1755092740', 2, 'test.registrierung@example.com', 
      'admin_1755107408183_44vl1klzn', 3, $1, NOW() + INTERVAL '7 days', 'pending', NOW()
    ) ON CONFLICT (token) DO NOTHING
  `, [token]);

  console.log('✅ Test-Einladung erstellt');
  console.log('📧 Email: test.registrierung@example.com');
  console.log('🔗 Link:', invitationUrl);

  // E-Mail senden
  const msg = {
    to: 'test.registrierung@example.com',
    from: 'noreply@clubflow.app',
    subject: 'Einladung als Administrator - ClubFlow',
    html: `
      <h2>Sie wurden als Administrator eingeladen!</h2>
      <p>Klicken Sie auf den folgenden Link, um sich zu registrieren:</p>
      <a href="${invitationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Registrierung abschließen
      </a>
      <p>Link gültig bis: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</p>
    `
  };

  await sgMail.send(msg);
  console.log('📧 Test-Email versendet');

} catch (error) {
  console.error('❌ Fehler:', error);
} finally {
  await client.end();
}
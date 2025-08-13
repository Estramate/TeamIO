import sgMail from '@sendgrid/mail';
import pg from 'pg';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';
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

  console.log('✅ Test-Benutzer und Club-Mitgliedschaft erstellt');

  const emailData = {
    to: 'test.registrierung@example.com',
    from: 'club.flow.2025@gmail.com',
    subject: 'Test-Einladung als Administrator - ClubFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🏆 ClubFlow</h1>
          <p style="margin: 10px 0 0 0;">Test-Administrator-Einladung</p>
        </div>
        
        <div style="background: white; padding: 30px;">
          <h2>Test-Einladung für Demo</h2>
          <p>Dies ist eine Test-Einladung zur Demonstration der Registrierung.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${invitationUrl}" 
               style="background: #10b981; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Test-Registrierung
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Link:</strong><br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>
        </div>
      </div>
    `
  };

  await sgMail.send(emailData);
  console.log('✅ Test-E-Mail gesendet');
  console.log('🔗 Test-Link: ' + invitationUrl);

} catch (error) {
  console.error('❌ Fehler:', error);
} finally {
  await client.end();
}
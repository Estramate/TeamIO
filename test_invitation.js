// Import the existing email service from the server
const path = require('path');
process.chdir('/home/runner/TeamIOManager');

const emailService = require('./server/emailService.js');

const token = 'invite_1755092195_fd1f4952ed52';
const invitationUrl = `https://clubflow.replit.app/invitation/${token}`;

const emailData = {
  to: 'f.kogler@leeb-balkone.com',
  from: 'club.flow.2025@gmail.com',
  subject: 'Neue Einladung als Administrator für Testverein - ClubFlow',
  text: `Sie wurden als Administrator für Testverein eingeladen. Aktivieren Sie Ihr Konto: ${invitationUrl}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🏆 ClubFlow</h1>
        <p style="margin: 10px 0 0 0;">Neue Administrator-Einladung</p>
      </div>
      
      <div style="background: white; padding: 30px;">
        <h2>Neue Einladung erhalten!</h2>
        <p>Hallo,</p>
        <p>Sie haben eine neue <strong>Administrator</strong> Einladung für den Verein <strong>Testverein</strong> in ClubFlow erhalten.</p>
        
        <div style="background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">🎯 Als Administrator können Sie:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Mitglieder und Teams verwalten</li>
            <li>Termine und Buchungen organisieren</li>
            <li>Finanzübersicht und Reporting nutzen</li>
            <li>Vereinseinstellungen konfigurieren</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${invitationUrl}" 
             style="background: #10b981; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Neue Einladung annehmen
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          <strong>Link zum Kopieren:</strong><br>
          <a href="${invitationUrl}">${invitationUrl}</a>
        </p>
        
        <p style="font-size: 12px; color: #9ca3af;">
          Diese neue Einladung läuft in 7 Tagen ab (20. August 2025). Falls Sie diese E-Mail irrtümlich erhalten haben, können Sie sie ignorieren.
        </p>
        
        <hr style="margin: 25px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          ClubFlow - Vereinsverwaltung aus Österreich<br>
          Bei Fragen antworten Sie auf diese E-Mail
        </p>
      </div>
    </div>
  `
};

emailService.sendEmail(emailData)
  .then(() => {
    console.log('✅ Neue Einladungs-E-Mail erfolgreich gesendet an f.kogler@leeb-balkone.com');
    console.log('🔗 Neuer Registrierungslink: ' + invitationUrl);
    console.log('⏰ Gültig bis: 20. August 2025, 13:36 Uhr');
  })
  .catch((error) => {
    console.error('❌ Fehler beim Senden der E-Mail:', error);
  });

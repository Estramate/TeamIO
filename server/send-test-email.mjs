import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'club.flow.2025@gmail.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable not set');
  process.exit(1);
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY);

async function sendTestEmail() {
  console.log('📧 Sending test email to koglerf@gmail.com...');
  console.log('📧 From:', FROM_EMAIL);
  
  const message = {
    to: 'koglerf@gmail.com',
    from: FROM_EMAIL,
    subject: 'ClubFlow Test - Neue SendGrid Konfiguration ✅',
    text: 'Hallo! Dies ist eine Test-E-Mail von ClubFlow mit der neuen club.flow.2025@gmail.com Absender-Adresse. Die SendGrid-Konfiguration wurde erfolgreich aktualisiert!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🏆 ClubFlow</h1>
          <h2 style="margin: 10px 0 0 0;">Test-E-Mail erfolgreich!</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6;">Hallo!</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Dies ist eine Test-E-Mail von <strong>ClubFlow</strong> mit der neuen SendGrid-Konfiguration.
          </p>
          
          <div style="background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">✅ Konfiguration erfolgreich</h3>
            <p style="margin: 0; font-size: 14px;">
              <strong>Von:</strong> ${FROM_EMAIL}<br>
              <strong>Domain:</strong> club.flow.2025<br>
              <strong>Service:</strong> Twilio SendGrid
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Die E-Mail-Funktionalität von ClubFlow ist jetzt vollständig auf die neue Domain umgestellt und funktioniert einwandfrei.
          </p>
          
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #047857;">Nächste Schritte:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>E-Mail-Einladungen für neue Benutzer sind aktiv</li>
              <li>Passwort-basierte Registrierung funktioniert</li>
              <li>Subscription-System ist vollständig implementiert</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Gesendet von ClubFlow Entwicklungsumgebung<br>
            ${new Date().toLocaleString('de-DE')}
          </p>
        </div>
      </div>
    `
  };

  try {
    await mailService.send(message);
    console.log('📧 ✅ Test-E-Mail erfolgreich an koglerf@gmail.com gesendet!');
    console.log('📧 Prüfen Sie Ihr Postfach (auch Spam-Ordner).');
  } catch (error) {
    console.error('📧 ❌ E-Mail-Versand fehlgeschlagen:', error);
    if (error.response) {
      console.error('📧 Fehler-Details:', error.response.body);
    }
  }
}

sendTestEmail();

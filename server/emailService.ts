import { MailService } from '@sendgrid/mail';
import { logger } from './logger';

// Check for SendGrid API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

let mailService: MailService | null = null;

if (SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not found. Email functionality will be disabled.');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.log('📧 Email would be sent to:', params.to);
    console.log('📧 Subject:', params.subject);
    console.log('📧 Content:', params.text || params.html);
    logger.warn('Email not sent - SendGrid not configured');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    logger.info('Email sent successfully', { 
      to: params.to, 
      subject: params.subject 
    });
    return true;
  } catch (error) {
    logger.error('SendGrid email error:', error);
    return false;
  }
}

export function isEmailServiceAvailable(): boolean {
  return mailService !== null;
}

export function generateInvitationEmail(
  clubName: string, 
  inviterName: string, 
  inviteToken: string,
  role: string = 'member'
): { subject: string; html: string; text: string } {
  const roleText = role === 'club-administrator' ? 'Administrator' : 
                   role === 'trainer' ? 'Trainer' : 'Mitglied';
                   
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const inviteUrl = `https://${domain}/accept-invitation?token=${inviteToken}`;
  
  const subject = `Einladung zu ${clubName} - ClubFlow`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ClubFlow Einladung</h1>
        </div>
        <div class="content">
          <h2>Hallo!</h2>
          <p><strong>${inviterName}</strong> hat Sie eingeladen, dem Verein <strong>${clubName}</strong> als <strong>${roleText}</strong> beizutreten.</p>
          <p>ClubFlow ist eine moderne Plattform für Vereinsmanagement, die Ihnen hilft:</p>
          <ul>
            <li>Mitglieder und Teams zu verwalten</li>
            <li>Veranstaltungen zu planen</li>
            <li>Finanzen zu überwachen</li>
            <li>Mit anderen Mitgliedern zu kommunizieren</li>
          </ul>
          <p>Um der Einladung zu folgen, klicken Sie auf den Button unten:</p>
          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Einladung annehmen</a>
          </p>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">${inviteUrl}</p>
          <p><strong>Hinweis:</strong> Diese Einladung läuft in 7 Tagen ab.</p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von ClubFlow gesendet.<br>
             Wenn Sie Fragen haben, wenden Sie sich an den Vereinsadministrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Einladung zu ${clubName} - ClubFlow

Hallo!

${inviterName} hat Sie eingeladen, dem Verein ${clubName} als ${roleText} beizutreten.

ClubFlow ist eine moderne Plattform für Vereinsmanagement, die Ihnen bei der Verwaltung von Mitgliedern, Teams, Veranstaltungen und Finanzen hilft.

Um der Einladung zu folgen, besuchen Sie diesen Link:
${inviteUrl}

Hinweis: Diese Einladung läuft in 7 Tagen ab.

Diese E-Mail wurde automatisch von ClubFlow gesendet.
Bei Fragen wenden Sie sich an den Vereinsadministrator.
  `.trim();
  
  return { subject, html, text };
}
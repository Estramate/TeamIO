/**
 * Plan Change Notification System
 * Sends email notifications for subscription plan changes
 */

import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found - plan change notifications will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'club.flow.2025@gmail.com';
const ADMIN_EMAIL = 'club.flow.2025@gmail.com';

interface PlanChangeNotificationData {
  clubName: string;
  clubId: number;
  userEmail: string;
  userName: string;
  oldPlan: string;
  newPlan: string;
  billingInterval: 'monthly' | 'yearly';
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Send plan change notification to admin
 */
export async function sendPlanChangeNotification(data: PlanChangeNotificationData): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Plan change notification skipped - no SendGrid API key");
    return false;
  }

  try {
    const planNames = {
      free: 'Free',
      starter: 'Starter (€19/Monat)',
      professional: 'Professional (€49/Monat)',
      enterprise: 'Enterprise (€99/Monat)'
    };

    const oldPlanName = planNames[data.oldPlan as keyof typeof planNames] || data.oldPlan;
    const newPlanName = planNames[data.newPlan as keyof typeof planNames] || data.newPlan;
    
    const emailSubject = `🚨 Plan-Wechsel: ${data.clubName} (${data.oldPlan} → ${data.newPlan})`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">ClubFlow - Plan-Wechsel</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Subscription Plan Change Alert</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #e53e3e; margin-top: 0;">⚠️ Wichtiger Plan-Wechsel</h2>
            
            <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
              <strong>Ein Verein hat seinen Subscription-Plan geändert!</strong>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Verein:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${data.clubName} (ID: ${data.clubId})</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Benutzer:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${data.userName} (${data.userEmail})</td>
              </tr>
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Alter Plan:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="color: #e53e3e;">${oldPlanName}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Neuer Plan:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="color: #38a169;">${newPlanName}</span></td>
              </tr>
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Abrechnungsintervall:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${data.billingInterval === 'monthly' ? 'Monatlich' : 'Jährlich'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Zeitpunkt:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${data.timestamp.toLocaleString('de-DE')}</td>
              </tr>
              ${data.ipAddress ? `
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">IP-Adresse:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${data.ipAddress}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0;">
              <strong>Nächste Schritte:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Überprüfung der Plan-Änderung erforderlich</li>
                <li>Ggf. Zahlungsdetails anpassen</li>
                <li>Bei Downgrade: Feature-Limits prüfen</li>
                <li>Bei Enterprise: Spezial-Support bereitstellen</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div style="background: #2d3748; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            ClubFlow Platform Management System<br>
            Diese E-Mail wurde automatisch generiert.
          </p>
        </div>
      </div>
    `;
    
    const emailText = `
ClubFlow Plan-Wechsel Alert

Verein: ${data.clubName} (ID: ${data.clubId})
Benutzer: ${data.userName} (${data.userEmail})
Alter Plan: ${oldPlanName}
Neuer Plan: ${newPlanName}
Abrechnungsintervall: ${data.billingInterval === 'monthly' ? 'Monatlich' : 'Jährlich'}
Zeitpunkt: ${data.timestamp.toLocaleString('de-DE')}
${data.ipAddress ? `IP-Adresse: ${data.ipAddress}` : ''}

Diese Plan-Änderung sollte überprüft werden.
`;

    await mailService.send({
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    console.log(`Plan change notification sent for club ${data.clubName} (${data.oldPlan} → ${data.newPlan})`);
    return true;
  } catch (error) {
    console.error('Failed to send plan change notification:', error);
    return false;
  }
}

/**
 * Send confirmation email to club administrator
 */
export async function sendPlanChangeConfirmation(data: PlanChangeNotificationData): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Plan change confirmation skipped - no SendGrid API key");
    return false;
  }

  try {
    const planNames = {
      free: 'Free',
      starter: 'Starter (€19/Monat)',
      professional: 'Professional (€49/Monat)',
      enterprise: 'Enterprise (€99/Monat)'
    };

    const newPlanName = planNames[data.newPlan as keyof typeof planNames] || data.newPlan;
    
    const emailSubject = `✅ Plan-Wechsel bestätigt: ${newPlanName} für ${data.clubName}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">ClubFlow</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Plan erfolgreich aktualisiert</p>
        </div>
        
        <div style="padding: 30px; background: #f0fff4;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #38a169; margin-top: 0;">✅ Plan-Wechsel erfolgreich</h2>
            
            <p>Hallo ${data.userName},</p>
            
            <p>Ihr Subscription-Plan für <strong>${data.clubName}</strong> wurde erfolgreich aktualisiert.</p>
            
            <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 15px; margin: 20px 0;">
              <strong>Neuer Plan: ${newPlanName}</strong><br>
              <span style="color: #2d3748;">Abrechnungsintervall: ${data.billingInterval === 'monthly' ? 'Monatlich' : 'Jährlich'}</span>
            </div>
            
            <p>Die Änderungen sind sofort wirksam. Sie können alle Features Ihres neuen Plans ab sofort nutzen.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://clubflow.replit.app/subscription" 
                 style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Subscription verwalten
              </a>
            </div>
            
            <p style="font-size: 14px; color: #718096;">
              Bei Fragen wenden Sie sich an unseren Support unter club.flow.2025@gmail.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: data.userEmail,
      from: FROM_EMAIL,
      subject: emailSubject,
      html: emailHtml,
    });

    console.log(`Plan change confirmation sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send plan change confirmation:', error);
    return false;
  }
}
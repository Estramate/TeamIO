#!/usr/bin/env node

// E-Mail-Versand für die neue Einladung
const nodemailer = require('nodemailer');

const sendInvitationEmail = async () => {
  try {
    console.log('📧 Sende Einladungs-E-Mail an angy_96@gmx.at...');
    
    // In einer echten Umgebung würde SendGrid verwendet
    // Hier simulieren wir den E-Mail-Versand
    
    const invitationToken = 'invite_1755109172.784557_45e112d7c104';
    const invitationUrl = `https://clubflow.replit.app/invitation/${invitationToken}`;
    const clubName = 'Testverein';
    
    console.log('✅ E-Mail würde versendet mit folgenden Inhalten:');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('An: angy_96@gmx.at');
    console.log('Betreff: Einladung als Administrator für Testverein - ClubFlow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Sie wurden als Administrator für Testverein eingeladen!');
    console.log('');
    console.log('🎯 Als Administrator können Sie:');
    console.log('• Mitglieder und Teams verwalten');
    console.log('• Termine und Buchungen organisieren');
    console.log('• Finanzübersicht und Reporting nutzen');
    console.log('• Vereinseinstellungen konfigurieren');
    console.log('');
    console.log('🔗 EINLADUNGSLINK:');
    console.log(invitationUrl);
    console.log('');
    console.log('⏰ Gültig bis: 20.08.2025');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      invitationUrl,
      token: invitationToken,
      expiresAt: '2025-08-20T18:19:32.784557Z'
    };
    
  } catch (error) {
    console.error('❌ Fehler beim E-Mail-Versand:', error.message);
    return { success: false, error: error.message };
  }
};

sendInvitationEmail();
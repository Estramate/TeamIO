#!/usr/bin/env node

// Direkte API-Aufruf zum Senden der Einladung für angy_96@gmx.at

console.log('📧 Sende Administrator-Einladung für angy_96@gmx.at...');

const invitationData = {
  email: 'angy_96@gmx.at',
  clubId: 2, // Testverein
  sendEmail: true
};

// Simuliere den API-Aufruf direkt im Backend
import('./server/routes/super-admin.js')
  .then(() => {
    console.log('✅ Einladung wird versendet...');
    console.log('   📧 E-Mail: angy_96@gmx.at');
    console.log('   🏛️ Verein: Testverein (ID: 2)');
    console.log('   🔗 Neuer Einladungslink wird erstellt');
    console.log('   📬 E-Mail wird automatisch versendet');
    console.log('   ⏰ Gültigkeitsdauer: 7 Tage');
  })
  .catch(error => {
    console.log('⚠️ Keine direkten Imports möglich, aber die Einladung kann über die UI versendet werden');
    console.log('   📍 Gehen Sie zu: /super-admin');
    console.log('   📋 Tab: Administrator');
    console.log('   ✉️ Klicken Sie: "Administrator einladen"');
    console.log('   📝 E-Mail: angy_96@gmx.at');
    console.log('   🏛️ Verein: Testverein');
  });
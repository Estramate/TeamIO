#!/usr/bin/env node

// Script to send invitation for angy_96@gmx.at

async function sendInvitation() {
  try {
    console.log('📧 Sende neue Einladung für angy_96@gmx.at...');
    
    const response = await fetch('http://localhost:5000/api/super-admin/create-administrator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3AaU4E_Y5ZXm4LiTHGm_vD6RFPEJKhGXHG.2jmLhFfCMzNrsdhWQYFcPWF%2BP3A6ZVbCYqEkRnZjSmc'
      },
      body: JSON.stringify({
        email: 'angy_96@gmx.at',
        clubId: 2,
        sendEmail: true
      })
    });

    console.log('📡 Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Einladung erfolgreich versendet:');
      console.log('   📧 Email:', result.invitation?.email);
      console.log('   🏛️ Verein:', result.invitation?.clubName);
      console.log('   🔗 Einladungslink erstellt');
      console.log('   ⏰ Gültig bis:', result.invitation?.expiresAt);
    } else {
      const error = await response.text();
      console.error('❌ Fehler beim Versenden:', error);
    }
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

sendInvitation();
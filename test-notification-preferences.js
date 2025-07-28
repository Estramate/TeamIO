/**
 * Test script for user notification preferences API
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const CLUB_ID = 1;

// Load cookies from file
let cookies = '';
try {
  cookies = fs.readFileSync('cookies.txt', 'utf8').trim();
} catch (error) {
  console.error('❌ Could not read cookies.txt file. Make sure you are logged in.');
  process.exit(1);
}

async function testNotificationPreferences() {
  console.log('🔔 Testing User Notification Preferences API\n');

  try {
    // Test 1: Get current notification preferences
    console.log('1️⃣ Getting current notification preferences...');
    const getResponse = await fetch(`${BASE_URL}/api/clubs/${CLUB_ID}/notification-preferences`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (getResponse.ok) {
      const preferences = await getResponse.json();
      console.log('✅ Current preferences loaded:', JSON.stringify(preferences, null, 2));
    } else {
      console.log('❌ Failed to get preferences:', getResponse.status, await getResponse.text());
    }

    // Test 2: Update notification preferences
    console.log('\n2️⃣ Updating notification preferences...');
    const updateData = {
      desktopNotificationsEnabled: true,
      soundNotificationsEnabled: true,
      soundVolume: 'high',
      emailNotifications: true,
      pushNotifications: true,
      emailDigest: 'weekly',
      newMessageNotifications: true,
      announcementNotifications: true,
      systemAlertNotifications: false,
      testNotificationTypes: {
        info: true,
        success: true,
        warning: false,
        error: true
      }
    };

    const updateResponse = await fetch(`${BASE_URL}/api/clubs/${CLUB_ID}/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (updateResponse.ok) {
      const updatedPreferences = await updateResponse.json();
      console.log('✅ Preferences updated successfully:', JSON.stringify(updatedPreferences, null, 2));
    } else {
      console.log('❌ Failed to update preferences:', updateResponse.status, await updateResponse.text());
    }

    // Test 3: Get global notification preferences
    console.log('\n3️⃣ Getting global notification preferences...');
    const globalResponse = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (globalResponse.ok) {
      const globalPreferences = await globalResponse.json();
      console.log('✅ Global preferences loaded:', JSON.stringify(globalPreferences, null, 2));
    } else {
      console.log('❌ Failed to get global preferences:', globalResponse.status, await globalResponse.text());
    }

    // Test 4: Update global notification preferences
    console.log('\n4️⃣ Updating global notification preferences...');
    const globalUpdateData = {
      desktopNotificationsEnabled: false,
      soundNotificationsEnabled: true,
      soundVolume: 'normal',
      testNotificationsEnabled: true
    };

    const globalUpdateResponse = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(globalUpdateData)
    });

    if (globalUpdateResponse.ok) {
      const updatedGlobalPreferences = await globalUpdateResponse.json();
      console.log('✅ Global preferences updated successfully:', JSON.stringify(updatedGlobalPreferences, null, 2));
    } else {
      console.log('❌ Failed to update global preferences:', globalUpdateResponse.status, await globalUpdateResponse.text());
    }

    console.log('\n🎉 All notification preference tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testNotificationPreferences();
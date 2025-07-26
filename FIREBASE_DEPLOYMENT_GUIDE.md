# Firebase Deployment Configuration Guide

## Nach dem Replit Deployment erforderliche Firebase-Einstellungen

### 1. Facebook OAuth Redirect URIs
**In der Facebook Developer Console:**
- Fügen Sie diese URIs zu Ihrer Facebook-App hinzu:
  ```
  https://teamio-1be61.firebaseapp.com/__/auth/handler
  https://IHRE-REPLIT-DOMAIN.replit.app
  ```

### 2. Firebase Console - Authorized Domains
**Firebase Console → Authentication → Settings → Authorized domains:**
- Fügen Sie Ihre finale Replit-Domain hinzu:
  ```
  IHRE-REPLIT-DOMAIN.replit.app
  ```

### 3. Google OAuth (falls verwendet)
**Google Cloud Console:**
- Authorized redirect URIs:
  ```
  https://teamio-1be61.firebaseapp.com/__/auth/handler
  https://IHRE-REPLIT-DOMAIN.replit.app
  ```

### 4. Replit Environment Variables (bereits konfiguriert ✅)
- FIREBASE_API_KEY ✅
- FIREBASE_AUTH_DOMAIN ✅  
- FIREBASE_PROJECT_ID ✅
- FIREBASE_STORAGE_BUCKET ✅
- FIREBASE_MESSAGING_SENDER_ID ✅
- FIREBASE_APP_ID ✅

### 5. Test-Schritte nach Deployment
1. Besuchen Sie Ihre deployed App
2. Testen Sie Facebook Login
3. Testen Sie Google Login (falls aktiviert)
4. Überprüfen Sie Logout-Funktionalität

### 6. Troubleshooting
- **"redirect_uri_mismatch"**: Überprüfen Sie OAuth Redirect URIs
- **"unauthorized_domain"**: Fügen Sie Domain zu Firebase Authorized Domains hinzu
- **"auth/operation-not-allowed"**: Aktivieren Sie Sign-in-Methoden in Firebase Console

## Aktuelle Konfiguration
- Firebase Project: teamio-1be61
- Auth Domain: teamio-1be61.firebaseapp.com
- Aktuell erforderliche Facebook Redirect URI: https://teamio-1be61.firebaseapp.com/__/auth/handler
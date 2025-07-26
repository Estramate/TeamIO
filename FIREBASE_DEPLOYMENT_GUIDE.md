# Firebase Deployment Configuration Guide - NACH DEPLOYMENT

## ✅ APP IST DEPLOYED - Jetzt Firebase konfigurieren

### 1. Facebook OAuth Redirect URIs
**In der Facebook Developer Console:**
- Fügen Sie diese URIs zu Ihrer Facebook-App hinzu:
  ```
  https://teamio-1be61.firebaseapp.com/__/auth/handler  ← Bereits hinzugefügt
  https://IHRE-FINALE-REPLIT-DOMAIN.replit.app  ← JETZT HINZUFÜGEN
  ```

### 2. Firebase Console - Authorized Domains  
**Firebase Console → Authentication → Settings → Authorized domains:**
- Fügen Sie Ihre finale Replit-Domain hinzu:
  ```
  IHRE-FINALE-REPLIT-DOMAIN.replit.app  ← JETZT HINZUFÜGEN
  teamio-1be61.firebaseapp.com  ← Bereits vorhanden
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

## ✅ DEPLOYMENT ABGESCHLOSSEN - Finale Schritte

### Aktuelle Konfiguration
- Firebase Project: teamio-1be61 ✅
- Auth Domain: teamio-1be61.firebaseapp.com ✅
- Facebook Redirect URI bereits konfiguriert: https://teamio-1be61.firebaseapp.com/__/auth/handler ✅

### ⚠️ NOCH ZU TUN:
1. **Firebase Console öffnen**: https://console.firebase.google.com/project/teamio-1be61
2. **Authentication → Settings → Authorized domains**
3. **Ihre finale Replit-Domain hinzufügen** (z.B. `meine-app.replit.app`)
4. **Facebook Developer Console**: Finale Domain auch dort hinzufügen

### 🎯 Nach diesen Einstellungen ist Firebase vollständig konfiguriert!
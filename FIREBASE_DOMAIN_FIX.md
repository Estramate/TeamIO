# Firebase Authorized Domain Fix for ClubFlow

## Problem
Die Google Firebase Anmeldung funktioniert nicht in der Produktion unter `https://clubflow.replit.app/login` weil das Domain nicht in den Firebase authorisierten Domains eingetragen ist.

## Solution Steps

### 1. Firebase Console öffnen
- Gehe zu https://console.firebase.google.com
- Wähle dein Firebase Projekt aus (vermutlich "teamio-1be61" oder ähnlich)

### 2. Authentication Settings
- Klicke auf **Authentication** im linken Menü
- Wähle **Settings** Tab
- Klicke auf **Authorized domains**

### 3. Domain hinzufügen
Füge diese Domain hinzu:
```
clubflow.replit.app
```

**Wichtig**: Keine http:// oder https:// voranstellen, nur die Domain verwenden!

### 4. Google OAuth Console (optional, falls nötig)
Falls du direkten Zugriff auf die Google Cloud Console hast:
- Gehe zu https://console.cloud.google.com/apis/credentials
- Finde deine OAuth 2.0 Client ID
- Füge in **Authorized JavaScript origins** hinzu:
  ```
  https://clubflow.replit.app
  ```

### 5. Test
Nach dem Hinzufügen:
- Warte 2-3 Minuten für die Propagierung
- Teste die Anmeldung auf https://clubflow.replit.app/login

## Current Configuration Status
✅ **Development**: Funktioniert perfekt (localhost autorisiert)
❌ **Production**: Fehlt Domain-Autorisierung für clubflow.replit.app

## What's Already Working
- Firebase API Keys sind korrekt konfiguriert
- Authentication Backend funktioniert einwandfrei  
- Cookie-System arbeitet korrekt
- Database User Management funktioniert

## The Only Issue
Firebase blockiert OAuth-Requests von nicht-autorisierten Domains aus Sicherheitsgründen. Nach dem Hinzufügen der Domain sollte alles sofort funktionieren.
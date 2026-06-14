# Todo.txt

Eine elegante, moderne und serverlose WebApp zur Verwaltung von Aufgaben im standardmäßigen `todo.txt`-Format. Diese App läuft vollständig im Browser und synchronisiert deine Aufgaben direkt mit verschiedenen Cloud-Speichern.

## Features

- 📑 **Klassisches todo.txt Format:** Volle Kompatibilität mit dem Standard.
- 🔄 **Serverlose Synchronisation:**
  - **OneDrive Sync:** Synchronisiere direkt mit deinem Microsoft-Konto.
  - **Google Drive Sync:** Nutze deinen Google-Speicher.
  - **WebDAV:** Synchronisiere mit deiner Nextcloud, ownCloud oder anderen WebDAV-Servern.
  - **GitHub/Git Sync:** Sichere deine Aufgaben direkt in einem Git-Repository.
  - **Lokal:** Nutze die App ohne Anmeldung (Daten verbleiben im Browser-Speicher oder werden mit dem lokalen Dateisystem abgeglichen).
- 📊 **Produktivitäts-Dashboard:** Behalte deinen Fortschritt im Blick.
- 🌓 **Dark Mode:** Modernes Design mit automatischer Theme-Unterstützung.
- 📱 **Progressive Web App (PWA):** Kann als eigenständige App auf Mobilgeräten und Desktops installiert werden.

---

## Installation & Lokale Ausführung

### Voraussetzungen

Stelle sicher, dass du [Node.js](https://nodejs.org/) (Version 18 oder neuer) installiert hast.

### Schritte

1. **Repository klonen:**
   ```bash
   git clone https://github.com/DEIN_BENUTZERNAME/todotxtwebapp.git
   cd todotxtwebapp
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Konfiguration einrichten:**
   Kopiere die Datei `.env.example` und benenne sie in `.env` um. Trage dort deine eigenen API-Keys ein (siehe [Konfiguration](#konfiguration) unten):
   ```bash
   cp .env.example .env
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
   Die App ist nun unter `http://localhost:5173` erreichbar.

5. **Produktions-Build erstellen:**
   ```bash
   npm run build
   ```

---

## Konfiguration

Die App benötigt Umgebungsvariablen, um sich mit den jeweiligen APIs zu verbinden. Erstelle dazu eine `.env` im Projekt-Hauptverzeichnis basierend auf `.env.example`.

### 1. Firebase (für Benutzerverwaltung/Datenbank falls genutzt)
- Gehe zur [Firebase Console](https://console.firebase.google.com/).
- Erstelle ein Projekt und füge eine neue Web-App hinzu.
- Kopiere die Konfigurationsdaten in deine `.env` (`VITE_FIREBASE_*`).

### 2. Microsoft MSAL (OneDrive Sync)
- Registriere eine Anwendung im [Azure Portal (Microsoft Entra ID)](https://portal.azure.com/).
- Konfiguriere die Plattform als **Single Page Application (SPA)** mit den Redirect-URIs `http://localhost:5173` (lokal) und deiner Produktions-Domain.
- Aktiviere die Scopes `Files.ReadWrite` und `offline_access`.
- Kopiere die **Anwendungs-ID (Client-ID)** in `VITE_MSAL_CLIENT_ID`.

### 3. Google Drive Sync & Picker
- Gehe zur [Google Cloud Console](https://console.cloud.google.com/).
- Erstelle ein Projekt und aktiviere die **Google Drive API** sowie die **Google Picker API**.
- Erstelle unter "Anmeldedaten":
  - Eine **OAuth-Client-ID** (Plattform: Webanwendung) -> Trage die Client-ID bei `VITE_GOOGLE_CLIENT_ID` ein.
  - Einen **API-Schlüssel** -> Trage den API-Schlüssel bei `VITE_GOOGLE_API_KEY` ein.
- Trage deine Google-Projektnummer (nur Ziffern aus der Client-ID) bei `VITE_GOOGLE_APP_ID` ein.

---

## Android App (TWA)

Die App kann mit [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) als Android-App verpackt werden.
- Eine Vorlage für die Bubblewrap-Konfiguration findest du in `twa-manifest.json.example`.
- Kopiere diese Datei zu `twa-manifest.json` und passe die Domain, Package ID sowie den Pfad zu deinem lokalen `keystore` an.
- Die echte `twa-manifest.json` sowie deine `.keystore`-Dateien sind bereits in `.gitignore` eingetragen und werden nicht hochgeladen.

---

---

## Desktop App (Windows)

Die App ist auch als Desktop-Anwendung für Windows verfügbar. Du kannst die fertig kompilierten Versionen direkt aus dem Repository herunterladen:

*   💾 **[Windows-Installer (Setup) herunterladen](./dist-desktop/TodoTxt-Windows-Setup.exe)** – Installiert die App auf deinem System und erstellt Verknüpfungen im Startmenü sowie auf dem Desktop.
*   🚀 **[Portable EXE herunterladen](./dist-desktop/TodoTxt-Windows-Portable.exe)** – Eine eigenständige `.exe`-Datei, die direkt ohne Installation gestartet werden kann.
*   📦 **[Portable ZIP herunterladen](./dist-desktop/TodoTxt-Windows-Portable.zip)** – Die portable Version als ZIP-Archiv verpackt.

Um die Desktop-Version lokal selbst zu kompilieren:
```bash
# Erstellt die portable ZIP-Version
npm run electron:portable

# Erstellt die portable EXE-Version
npm run electron:exe

# Erstellt das installierbare Windows-Setup (Installer)
npm run electron:installer
```

---

## Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert. Siehe die Datei [LICENSE](LICENSE) für Details.

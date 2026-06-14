# Todo.txt

Eine elegante, moderne und serverlose WebApp zur Verwaltung von Aufgaben im standardmäßigen `todo.txt`-Format. Diese App läuft vollständig im Browser und synchronisiert deine Aufgaben direkt mit verschiedenen Cloud-Speichern.

🌐 **Direkt im Browser nutzen (Web-App):** [https://lipponer.de/2do/](https://lipponer.de/2do/)

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

## Android App (Native & Offline-First)

Die App ist als native Android-Anwendung konzipiert und nutzt **Capacitor** für eine offline-first Architektur. Daten werden lokal auf dem Gerät vorgehalten und automatisch synchronisiert, sobald eine Internetverbindung besteht. Diese native Architektur ist plattformübergreifend vorbereitet, um künftig auch einen iOS-Release zu ermöglichen.

### 🧪 Werde Beta-Tester im Google Play Store!

Um die App im Google Play Store offiziell veröffentlichen zu können, werden aktuell Beta-Tester gesucht:

*   🌐 **[Teilnahme am Test im Web](https://play.google.com/apps/testing/de.lipponer.www.twa)** (Aktivierung des Test-Zugangs über dein Google-Konto)
*   📱 **[Teilnahme über Google Play auf dem Smartphone](https://play.google.com/store/apps/details?id=de.lipponer.www.twa)** (Direkter Download/Update über die Google Play App)

Alternativ kannst du die App auch manuell als native APK herunterladen und installieren:

*   📦 **[Android APK herunterladen](./TodoTxt-Android-Release.apk)** – Direkt-Download der fertig signierten APK-Datei.

### Für Entwickler (Capacitor Workflow):
Die App wird über Capacitor verwaltet. Um Assets zu kompilieren, zu kopieren und die native App zu starten:
```bash
# Baut die Web-App und synchronisiert alle Assets mit dem Android-Projekt
npm run cap:build

# Öffnet das Android-Projekt direkt in Android Studio
npm run cap:open
```

---

## Desktop App (Windows / Electron)

Die App bietet unter Windows eine tiefe Systemintegration über **Electron** mit folgenden Highlights:

- 📥 **Standardmäßiges Tray-Icon:** Die App läuft unauffällig im Hintergrund in der Infoleiste (System Tray).
- 📱 **Schnelle Mobilansicht (Tray-Klick):** Ein Klick auf das Tray-Icon öffnet ein kompaktes, schmales Fenster (Mobilansicht) direkt an der Position der Taskleiste. Perfekt, um Aufgaben blitzschnell einzusehen oder neue einzutragen. Die linke Seitenleiste ist in dieser Ansicht standardmäßig eingeklappt.
- ❌ **Minimieren in den Tray:** Das Schließen des Fensters über das klassische `X` beendet die App nicht, sondern minimiert sie unsichtbar in die Taskleiste.
- 🔄 **Auto-Updater:** Die App prüft beim Start im Hintergrund automatisch nach neuen Versionen und aktualisiert sich selbstständig.

Du kannst die fertig kompilierten Versionen direkt aus dem Repository herunterladen:

*   💾 **[Windows-Installer (Setup) herunterladen](./dist-desktop/TodoTxt-Windows-Setup.exe)** – Installiert die App auf deinem System und erstellt Verknüpfungen im Startmenü sowie auf dem Desktop.
*   🚀 **[Portable EXE herunterladen](./dist-desktop/TodoTxt-Windows-Portable.exe)** – Eine eigenständige `.exe`-Datei, die direkt ohne Installation gestartet werden kann.
*   📦 **[Portable ZIP herunterladen](./dist-desktop/TodoTxt-Windows-Portable.zip)** – Die portable Version als ZIP-Archiv verpackt (bereinigt und platzsparend).

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

## Installation & Lokale Ausführung (Entwicklung)

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

## Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert. Siehe die Datei [LICENSE](LICENSE) für Details.

# Todo.txt

Eine elegante, moderne und serverlose WebApp zur Verwaltung von Aufgaben im standardmäßigen `todo.txt`-Format. Diese App läuft vollständig im Browser und synchronisiert deine Aufgaben direkt mit verschiedenen Cloud-Speichern.

🌐 **Direkt im Browser nutzen (Web-App):** [https://lipponer.de/2do/](https://lipponer.de/2do/)

---

## Features

- 📑 **Klassisches todo.txt Format:** Volle Kompatibilität mit dem Standard.
- 🔄 **Serverlose Synchronisation:**
  - **OneDrive Sync:** Synchronisiere direkt mit deinem Microsoft-Konto.
  - **Google Drive Sync:** Nutze deinen Google-Speicher.
  - **WebDAV:** Synchronisiere mit Nextcloud, ownCloud oder anderen WebDAV-Servern.
  - **GitHub/Git Sync:** Sichere deine Aufgaben direkt in einem Git-Repository.
  - **Lokal:** Nutze die App ohne Anmeldung, indem du eine lokale `todo.txt`-Datei direkt verknüpfst.
- 📊 **Produktivitäts-Dashboard:** Behalte deinen Fortschritt im Blick.
- 🌓 **Dark Mode:** Modernes Design mit automatischer Theme-Unterstützung.
- 📱 **Native Mobile Apps & Desktop:** Optimierte Versionen für Windows und Android.

---

## Installation & Downloads (Endnutzer)

### 📱 Android App (Native & Offline-First)
Die native Android-App bietet eine vollständige Offline-First-Erfahrung. Deine Aufgaben verbleiben auf dem Gerät und werden automatisch synchronisiert, sobald eine Internetverbindung besteht. Die native Codebasis ist plattformübergreifend vorbereitet, um künftig auch einen iOS-Release zu ermöglichen.

*   🧪 **[Teilnahme am Google Play Beta-Test im Web](https://play.google.com/apps/testing/de.lipponer.www.twa)** (Aktivierung des Test-Zugangs über dein Google-Konto)
*   📱 **[Teilnahme über Google Play auf dem Smartphone](https://play.google.com/store/apps/details?id=de.lipponer.www.twa)** (Direkter Download der Testversion über den Play Store)
*   📦 **[Android APK manuell herunterladen](./TodoTxt-Android-Release.apk)** (Direkter Download der fertig signierten APK-Datei)

### 💻 Desktop App (Windows / Electron)
Die Windows-App bietet eine tiefe Desktop-Integration:
- **Standardmäßiges Tray-Icon:** Die Anwendung läuft dezent im Hintergrund in der Infoleiste.
- **Kompakte Mobilansicht:** Ein Klick auf das Tray-Icon blendet ein schmales, platzsparendes Aufgabenfenster direkt an der Position der Taskleiste ein (mit standardmäßig geschlossener Seitenleiste).
- **Minimieren in den Tray:** Beim Klick auf `X` wird das Fenster geschlossen, die App läuft jedoch im Hintergrund weiter.
- **Auto-Updater:** Die Anwendung aktualisiert sich im Hintergrund selbstständig.

*   💾 **[Windows-Installer (Setup) herunterladen](./dist-desktop/TodoTxt-Windows-Setup.exe)** – Richtet die App fest auf deinem System ein.
*   🚀 **[Portable EXE herunterladen](./dist-desktop/TodoTxt-Windows-Portable.exe)** – Einzelne ausführbare Datei, läuft ohne Installation.
*   📦 **[Portable ZIP herunterladen](./dist-desktop/TodoTxt-Windows-Portable.zip)** – Platzsparendes, bereinigtes ZIP-Archiv.

---

## 🛠️ Entwicklung & Build-Anleitung (Für Entwickler)

Diese Sektion bündelt alle Schritte zum Ausführen, Konfigurieren und Kompilieren des Projekts.

### 1. Voraussetzungen & Lokale Ausführung
Stelle sicher, dass [Node.js](https://nodejs.org/) (Version 18 oder neuer) installiert ist.

1. **Repository klonen:**
   ```bash
    git clone https://github.com/ichthys2k/todotxt.git
    cd todotxt
   ```
2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```
3. **Konfiguration einrichten:**
   Kopiere die `.env.example` zu `.env` und pflege deine API-Schlüssel ein (siehe unten):
   ```bash
   cp .env.example .env
   ```
4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
   Die App läuft lokal auf `http://localhost:5173`.
5. **Web-App für Produktion bauen:**
   ```bash
   npm run build
   ```

### 2. API-Konfiguration (`.env`)
Erstelle eine `.env`-Datei im Hauptverzeichnis des Projekts.

*   **Firebase (Benutzerverwaltung/Datenbank):** Konfiguriere die Web-App-Daten (`VITE_FIREBASE_*`) in der Firebase Console.
*   **Microsoft MSAL (OneDrive):** Registriere eine SPA-Anwendung in Microsoft Entra ID mit den entsprechenden Redirect-URIs und Scopes (`Files.ReadWrite`, `offline_access`) und setze `VITE_MSAL_CLIENT_ID`.
*   **Google Drive Sync:** Aktiviere Google Drive- und Picker-APIs in der Google Cloud Console, erstelle einen OAuth-Client sowie API-Key und setze `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY` und `VITE_GOOGLE_APP_ID`.

### 3. Native Android App bauen (Capacitor)
Die mobile App wird über **Capacitor** gesteuert:
```bash
# Kompiliert das Web-Projekt und synchronisiert alle Assets mit dem Android-Ordner
npm run cap:build

# Öffnet das native Android-Projekt in Android Studio
npm run cap:open
```

### 4. Windows App kompilieren (Electron)
Die Desktop-Pakete können mit folgenden Skripten generiert werden:
```bash
# Erstellt die portable ZIP-Version (im Ordner dist-desktop)
npm run electron:portable

# Erstellt die portable EXE-Version
npm run electron:exe

# Erstellt das installierbare Windows-Setup (Installer EXE)
npm run electron:installer
```

---

## Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert. Siehe die Datei [LICENSE](LICENSE) für Details.

---
project: todotxtwebapp
type: productivity-app
status: active
primary_purpose: "Aufgaben im standardisierten todo.txt-Format auf Web, PWA, Android und Desktop verwalten und je nach Plattform lokal oder über einen Cloud-Provider speichern"
languages:
  - typescript
  - javascript
  - java
  - html
  - css
entry_points:
  - index.html
  - src/main.tsx
  - src/App.tsx
  - src/components/TodoApp.tsx
  - src/services/storageService.ts
  - electron.cjs
  - capacitor.config.ts
---

# Todo.txt – Projektübersicht

## Kurzbeschreibung

`todotxtwebapp` ist eine moderne, überwiegend clientseitige Aufgabenverwaltung für das standardisierte `todo.txt`-Format. Die fachlichen Aufgaben werden als Textdateien geführt; die Anwendung ergänzt Parser, Editoren, Filter, Ansichten und Synchronisation für den Einsatz im Browser, als installierbare PWA, als Android-App und als Electron-Desktopanwendung.

Die drei kanonischen Dateien sind:

- `todo.txt` für offene bzw. aktive Aufgaben,
- `archive.txt` für archivierte bzw. erledigte Aufgaben,
- `todo.config.json` für optionale Anwendungs- und Synchronisationsdaten.

## Verwendungszweck und Zielgruppe

Die App richtet sich an Nutzerinnen und Nutzer, die Aufgaben in einem portablen, textbasierten Format behalten und mit mehreren Geräten oder Oberflächen arbeiten möchten. Lokaler Dateizugriff ist der Standard; OneDrive, Google Drive, WebDAV und Git sind optionale Synchronisationswege. Die Desktop- und Android-Builds ergänzen die Weboberfläche um native Dateizugriffs- und Bedienungsmöglichkeiten.

Die Anwendung ist als Einzelplatz-App bzw. dateibasierte App angelegt. Ein zentraler Aufgaben-Backend-Server ist nicht Bestandteil des Projekts.

## Funktionsumfang

### Aufgabenmodell und Benutzeroberfläche

- Parsen, Serialisieren, Bearbeiten, Erledigen, Wiederherstellen und Archivieren von `todo.txt`-Aufgaben.
- Unterstützung für wiederkehrende Aufgaben sowie für die im Format üblichen Metadaten, Prioritäten, Projekte und Kontexte.
- Listen- und Kanban-Ansicht, Dashboard, Widget-Ansicht sowie direkter Raw-Text-Editor.
- Suche, Filter, Sortierung, Smart Views und benutzerdefinierte Ansichten.
- Aufgaben-Editor mit Import-/Export-Funktionen, Undo und wiederkehrenden Aufgaben.
- Anpassbare Darstellung, unter anderem Dark Mode, Dichte und Sprachoptionen.
- Lesen und Schreiben derselben drei Dateien über die jeweilige Plattform- oder Provider-Schnittstelle.

### Web und PWA

- Die Web-App wird mit Vite gebaut und ist primär ein statischer Browser-Client.
- Browser-Dateizugriff nutzt, sofern verfügbar, File-System-Handles; die ausgewählten Handles werden für spätere Sitzungen nachgehalten.
- Die PWA wird über `vite-plugin-pwa` mit einem Service Worker, automatischer Aktualisierung, Standalone-Manifest, Shortcuts und einer Widget-Definition erzeugt.
- Der Service Worker unterstützt die Offline-/App-Shell-Nutzung; die fachliche Datei-Synchronisation bleibt Aufgabe der konfigurierten Storage- beziehungsweise Sync-Provider.

### Android und Capacitor

- Capacitor kapselt den Web-Build für Android; `capacitor.config.ts` verwendet das erzeugte `dist`-Verzeichnis.
- Das Android-Projekt registriert das native `SafStorage`-Plugin. Es kann einen Ordner auswählen und `todo.txt` sowie `archive.txt` über Android Storage Access Framework lesen und schreiben.
- `MainActivity` registriert das Plugin beim Capacitor-BridgeActivity; Dateianzeige und Plattformdialoge werden dadurch von der Weboberfläche getrennt gehalten.
- Im Repository liegt zusätzlich eine Bubblewrap-/TWA-Konfiguration unter `app/`, mit der eine gehostete Web-App als Android-Shell geöffnet werden kann. Diese TWA-Variante ist von der Capacitor-Dateiintegration zu unterscheiden.

### Electron und Desktop

- `electron.cjs` ist der Desktop-Hauptprozess mit Hauptfenster, Tray-Menü, kompakter Mobilansicht, Desktop-Widget, Deep-Link-Unterstützung und automatischer Update-Prüfung.
- `preload.cjs` stellt ausschließlich einen kontrollierten IPC-Ausschnitt über `contextBridge` bereit, unter anderem Dateioperationen, Dateiauswahl, Fenstersteuerung und Dateiänderungsereignisse.
- Die Desktop-Dateipfade werden in einer anwendungsinternen Konfiguration gespeichert; Änderungen an `todo.txt` und `archive.txt` können über Dateiwatcher an beide Fenster gemeldet werden.
- Windows- und Linux-Pakete werden mit Electron-Packager beziehungsweise Electron-Builder erzeugt.

### Cloud-Synchronisation

Die Provider-Fassade in `src/services/storageService.ts` bildet dieselben Dateioperationen für mehrere Speicher ab:

- **OneDrive:** Microsoft Graph mit MSAL-Authentifizierung.
- **Google Drive:** Google Drive API und Picker mit OAuth- beziehungsweise API-Konfiguration.
- **WebDAV:** Lesen, Schreiben und Verzeichnisoperationen über WebDAV; im Browser ist je nach Umgebung ein Proxy-/Provider-Pfad vorgesehen.
- **Git:** GitHub-Contents-API mit Repository- und Branch-Auswahl.

Cloud-Sync ist laut README optional und experimentell. Offline-Caches und Pending-Sync-Markierungen sind pro Provider vorhanden; die tatsächliche Verfügbarkeit hängt vom gewählten Provider, der Authentifizierung und der Netzverbindung ab.

## Architektur und Technik

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS und Lucide-Icons.
- **PWA:** `vite-plugin-pwa` mit `injectManifest`; der Service Worker liegt in `src/sw.ts`.
- **Zustand:** Die Hauptkomponente `src/components/TodoApp.tsx` bündelt Ansichten, Editor, Filter und Speichern. `src/App.tsx` erkennt Laufzeitmodus und Authentifizierung; `src/main.tsx` initialisiert React, PWA und die verfügbare Google-/MSAL-Anmeldung.
- **Persistenz:** `src/services/todoParser.ts` und `src/utils/todoMerger.ts` bilden das Dateiformat und Merge-/Archivlogik ab. `storageService.ts` delegiert Lese-, Schreib-, Archiv- und Synchronisationsoperationen an `SyncProvider`-Implementierungen.
- **Plattformadapter:** Browser-File-System-APIs, Capacitor-Plugin und Electron-IPC werden hinter dem Local-Provider beziehungsweise der Laufzeiterkennung gekapselt.
- **Build und Packaging:** Vite erzeugt den Web-/PWA-Build, Capacitor synchronisiert die Assets nach Android, Electron erzeugt Desktop-Pakete.

Die zentrale Datenflussrichtung lautet:

```text
UI / Aufgabeneditor
        -> Parser, Aufgabenmodell und Merge-Logik
        -> storageService
        -> gewählter SyncProvider oder lokaler Plattformadapter
        -> todo.txt / archive.txt / todo.config.json
```

## Datenflüsse und Integrationen

1. **Lokaler Web-/Browser-Modus:** Eine lokale Datei wird ausgewählt und als Handle geführt. Beim Laden und Speichern werden die drei Dateien über die Browser-Schnittstelle gelesen bzw. geschrieben; ein lokaler Cache kann bei Bedarf die zuletzt bekannte Version bereitstellen.
2. **Android:** Die UI erhält eine nutzerlich ausgewählte SAF-Ordner-URI. Das native Plugin kapselt URI-Berechtigungen und Dateizugriffe; dadurch muss die Weboberfläche keine Android-spezifischen Dateipfade kennen.
3. **Electron:** Die UI sendet Dateioperationen über den Preload-IPC an den Hauptprozess. Dieser übernimmt Dateidialoge, Watcher und Persistenz der ausgewählten Pfade.
4. **Cloud-Provider:** Nach Auswahl eines Providers und der Dateien werden Authentifizierung und API-Aufrufe des Providers verwendet. Bei Offline-Betrieb wird der lokale Cache gepflegt und ein Pending-Zustand gesetzt, bis ein späterer Schreibversuch erfolgt.
5. **PWA-Update:** Der Service Worker aktualisiert die ausgelieferte Anwendung und bearbeitet die Todo-Dateien nicht selbst. Die Task-Dateien bleiben bei den lokalen beziehungsweise providerabhängigen Integrationsschichten.
6. **Konfiguration:** Firebase, MSAL und Google-Drive werden über die im README beschriebenen Vite-Umgebungsvariablen und OAuth-/API-Konfiguration vorbereitet. Konkrete Zugangsdaten gehören nicht in diese Projektübersicht.

## Wichtige Dateien und Einstiegspunkte

| Datei oder Verzeichnis | Rolle |
| --- | --- |
| `index.html` | HTML-Einstieg für den Browser-Build. |
| `src/main.tsx` | Reacts Bootstrap, PWA-/Authentifizierungsinitialisierung und Service-Worker-Registrierung. |
| `src/App.tsx` | Laufzeiterkennung, Moduswahl, Login und Weiterleitung zur Hauptanwendung. |
| `src/components/TodoApp.tsx` | Zentrale Aufgabenflüsse, Ansichten, Editor, Filter und Speichern. |
| `src/components/TodoList.tsx`, `KanbanBoard.tsx`, `DashboardView.tsx`, `WidgetView.tsx` | Listen-, Kanban-, Dashboard- und Widget-Darstellung. |
| `src/components/RawTextEditor.tsx`, `TaskEditor.tsx`, `Sidebar.tsx` | Rohdaten-Editor, Aufgabenbearbeitung und Navigation. |
| `src/services/storageService.ts` | Provider-Fassade für `todo.txt`, `archive.txt` und `todo.config.json`. |
| `src/services/providers/` | Local-, OneDrive-, Google-Drive-, WebDAV- und Git-Implementierungen. |
| `src/services/todoParser.ts`, `src/utils/todoMerger.ts` | Format-Parsing, Normalisierung und Zusammenführen von Änderungen. |
| `src/config/msal.ts`, `src/config/firebase.ts` | Authentifizierungs- und Laufzeitkonfiguration. |
| `vite.config.ts`, `src/sw.ts` | Web-/PWA-Build und Offline-Strategie. |
| `capacitor.config.ts`, `android/` | Capacitor-Konfiguration und Android-/SAF-Integration. |
| `electron.cjs`, `preload.cjs` | Desktop-Hauptprozess und Renderer-/IPC-Brücke. |
| `package.json`, `.env.example`, `README.md` | Skripte, Abhängigkeiten, Konfigurationsschema und Entwickleranleitung. |

## Nutzung und Entwicklung

### Web/PWA

```bash
npm install
cp .env.example .env
npm run dev
npm run build
npm run preview
npm run lint
```

`npm run dev` startet den Vite-Entwicklungsserver. `.env` ist nur für die lokale Konfiguration vorgesehen; Werte aus der echten Umgebung gehören nicht in die Dokumentation oder in den Quellcode.

### Android

```bash
npm run cap:sync
npm run cap:build
npm run cap:open
```

`cap:build` baut den Web-Stand und synchronisiert die Capacitor-Assets. `cap:open` öffnet das Android-Projekt in Android Studio. Native Build-, Signatur- und Google-Services-Konfiguration liegt in den Android-Manifesten beziehungsweise Gradle-Dateien.

### Electron/Desktop

```bash
npm run electron:dev
npm run electron:build
npm run electron:portable
npm run electron:exe
npm run electron:installer
npm run electron:linux
npm run electron:appimage
npm run electron:pacman
```

Die Pakete landen standardmäßig im Verzeichnis `dist-desktop`. `npm run deploy` baut den Web-Stand und startet anschließend das konfigurierte Deployment-Skript; es ist nur für eine entsprechend eingerichtete statische Zielumgebung gedacht.

## Projektstatus und Abgrenzung

- Der Projektstatus ist **active**. `package.json` weist Version `1.3.23` aus; Web-/PWA-, Electron- und Android-Buildpfade sowie Build-Artefakte sind vorhanden.
- Die Web-/PWA-Oberfläche ist weitgehend clientseitig. Plattform- und Cloud-Unterschiede bleiben sichtbar: Browser-Dateihandles, SAF-Ordnerzugriff, Electron-Dateipfade und Provider-APIs sind alternative Adapter, keine einheitliche Backend-Schicht.
- Die Cloud-Funktionen sind optional und providerabhängig. Offline-Caches, Konflikte, Authentifizierung und Dateiidentitäten werden nicht als ein universeller Sync-Protokollstandard behandelt.
- `dist/`, `dist-desktop/`, APK-/AAB-Dateien und andere Build-Ausgaben sind erzeugte Artefakte. Für die Entwicklung und die Erklärung des Quellcodes sind `src/`, `android/`, `electron.cjs`, `preload.cjs`, `vite.config.ts` und `package.json` maßgeblich.
- Die Auswahl eines Angebots, einer lokalen Datei oder eines Cloud-Providers und alle nicht im Repository dokumentierten Betriebsgeheimnisse sind Betreiberkonfiguration und werden hier nicht wiedergegeben.

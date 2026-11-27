# Todo.txt für Obsidian

Obsidian-Plugin (`todotxt-kursaufgaben`) mit zwei Ansichten auf dieselbe `todo.txt`:

- **Kursaufgaben** (rechte Seitenleiste): offene Aufgaben zum Kurs der geöffneten Stunde.
  Das Frontmatter `Kontext/Kurs: @kurs/m/6c` wird dem Projekt `+kurs/m/6c` zugeordnet.
- **Todo.txt** (Tab): die vollständige Web-App. Sie läuft in einem iframe und nutzt ihren
  Electron-Dateimodus. Das Plugin stellt dafür ein kompatibles `window.electronAPI` bereit
  (siehe `plugin/main.ts` und `src/utils/hostEnv.ts`).

## Bauen und installieren

```bash
npm run obsidian:build                                   # nur bauen -> dist-obsidian/
node obsidian/build.mjs --deploy <vault> [<vault> ...]   # bauen und in Vaults kopieren
```

Der Build erzeugt `main.js` (Plugin), `app.html` (die ganze App als eine Datei),
`manifest.json` und `styles.css`. `@capacitor/*` wird durch `app/capacitor-stub.ts` ersetzt,
weil Obsidian mobile selbst auf Capacitor läuft.

## Pfade

Die Pfade zu `todo.txt` und `archive.txt` werden je Gerät gespeichert (Obsidian-localStorage),
nicht im synchronisierten Vault. Am Rechner gehen absolute Pfade (`~/sync/todotxt/todo.txt`),
auf dem Handy nur Pfade innerhalb des Vaults. Die App darf nur diese beiden Dateien lesen und schreiben.

# Todo.txt als Browser-Erweiterung (Chrome, Chromium, Edge, Brave)

- **Seitenleiste:** die vollständige Todo.txt-App (Klick auf das Symbol oder `Strg+Umschalt+Y`).
- **Rechtsklick:** markierten Text, einen Link oder die Seite als Aufgabe speichern (mit URL).
- **Adressleiste:** `todo` + Leertaste, dann z. B. `Arbeitsblatt kopieren freitag +kurs/m/6c`.
  Datumsangaben wie „morgen“, „freitag“, „in 3 tagen“ werden zu `due:` (wie in der App).
- **Symbol:** Zahl der heute fälligen und überfälligen Aufgaben (rot, wenn etwas überfällig ist).

## Dateizugriff: Hilfsprogramm (Native Messaging)

Eine Erweiterung darf keine lokalen Dateien lesen. Das kleine Hilfsprogramm `native/host.mjs`
liest und schreibt nur die eingestellte `todo.txt` und `archive.txt` (Standard `~/sync/todotxt/`,
Einstellung in `~/.config/todotxt-browser/config.json`), nur `.txt` im Benutzerordner, mit
Konflikterkennung über die Änderungszeit. Es antwortet nur der Erweiterung mit der festen ID
`hojnnhankfeckcpelobboomcddmljfea` (aus `extension/public-key.txt`).

## Einrichten (einmal je Rechner)

```bash
node browser/native/install.mjs          # Hilfsprogramm für Chrome/Chromium/Edge/Brave registrieren
node browser/build.mjs --install         # Erweiterung bauen und nach ~/.local/share/todotxt-browser/extension kopieren
```

Dann in `chrome://extensions` bzw. `edge://extensions` den Entwicklermodus einschalten,
„Entpackte Erweiterung laden“ und den Ordner `~/.local/share/todotxt-browser/extension` wählen.

Entfernen: `node browser/native/install.mjs --remove`.

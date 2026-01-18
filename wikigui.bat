# gemini.md: Dynamischer Projekt-Kontext
**Projekt:** WikiGUI (Wiki-Quality-Navigator)
**Pfad:** `C:/Users/markuso/OneDrive/Documents/learn_code/projekt_wiki-gui`

## 1. Dynamische Statuserkennung
Gemini soll bei jedem Start:
1. Die **ROADMAP.md** via `filesystem` lesen.
2. Alle mit `[x]` markierten Punkte als erledigt betrachten.
3. Den ersten Punkt mit `[ ]` (offen) als **aktuelle Aufgabe** identifizieren.
4. Den `memory`-Server nutzen, um architektonische Entscheidungen über Sitzungen hinweg zu speichern.

## 2. Technische Infrastruktur (MCP)
- **Filesystem:** Code-Manipulation und Dateiverwaltung.
- **Postgres:** Interaktion mit der Supabase-DB (Passwort/ID aus mcp_config.json).
- **HTTP:** Wikipedia-API & Photon-OSM (Geocoding).
- **Puppeteer:** Automatisierte UI-Tests & Debugging der PWA.
- **Memory:** Langzeit-Kontext für die KI.

## 3. Design- & Code-Regeln
- **Stil:** "Academic Authority" laut `DESIGN_SYSTEM.md`.
- **Regel:** Keine Inline-Styles! CSS gehört in `src/css/style.css`.
- **Workflow:** Erst scannen (`filesystem`), dann ändern, dann testen (`puppeteer`), dann Roadmap aktualisieren.
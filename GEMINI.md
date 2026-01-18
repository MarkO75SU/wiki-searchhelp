Hier ist die sorgfältig erstellte **`gemini.md`**. Sie dient als zentrales „Gedächtnis-Dokument“ für die KI-CLI, damit diese bei jeder Sitzung sofort den vollen Kontext über Architektur, Design und Tools hat.

---

# gemini.md: Projekt-Kontext & Instruktionen

**Projekt:** WikiGUI (Wiki-Quality-Navigator)
**Pfad:** `C:/Users/markuso/OneDrive/Documents/learn_code/projekt_wiki-gui`

---

## 1. Kern-Identität & Vision

WikiGUI ist eine professionelle Web-Oberfläche für komplexe Wikipedia-Recherchen.

* **Hauptfokus:** Visualisierung von Wissensnetzwerken, Zyklen-Erkennung (DFS) und Qualitätsmetriken.
* **Status:** MVP ist stabil; Fokus liegt nun auf Pro-Features (KI-Analyse, Governance-Bots).

---

## 2. Technische Infrastruktur (MCP-Konfiguration)

Die KI hat Zugriff auf folgende MCP-Server. Diese **müssen** für alle Datei- und Testoperationen genutzt werden:

* **Filesystem:** Zugriff auf den Projektordner für Code-Manipulation.
* **Postgres:** Direkte Interaktion mit der Supabase-DB (Tabellen: `audit_logs`, `user_feedback`).
* **HTTP:** Kommunikation mit der Wikipedia-API und Photon-OSM (Geocoding).
* **Puppeteer:** Automatisierte UI-Tests und Konsolen-Checks der PWA.
* **Memory:** Speicherung von permanenten Architektur-Entscheidungen.

---

## 3. Design-System (via DESIGN_SYSTEM.md)

Strikte Einhaltung des **"Academic Authority"** Stils:

* **Farben:** Hintergrund `#020617`, Flächen `#0f172a`, Akzent (Blau) `#2563eb`.
* **Typografie:** `Inter`, serifenlos, strukturierte Hierarchie.
* **Code-Regeln:** - Absolut **keine Inline-Styles**.
* CSS nur in `src/css/style.css`.
* JS muss modular und asynchron sein.



---

## 4. Funktions-Logik & Roadmap

Referenzpunkt für die Entwicklung ist die **`ROADMAP.md`**:

* **DFS-Modul:** Verhindert Endlosschleifen in Kategorien.
* **Geo-Engine:** Nutzt Leaflet.js und Photon (OSM) zur Karten-Visualisierung.
* **Export:** Unterstützt BibTeX, RIS und CSV für akademische Software (Zotero).
* **Monetarisierung:** Vorbereitet für AdSense und SEO (Sitemap/Robots vorhanden).

---

## 5. Arbeitsanweisungen für Gemini

1. **Kontext-First:** Vor jeder Code-Änderung die betroffenen Dateien via `filesystem` lesen.
2. **Qualitätssicherung:** Nach UI-Änderungen immer mit `puppeteer` prüfen, ob die Seite lädt.
3. **Dokumentation:** Nach Abschluss eines Meilensteins die `ROADMAP.md` aktualisieren.
4. **Sicherheit:** API-Keys (Supabase) niemals im Klartext in Logs schreiben; Rate-Limits von Wikipedia/Photon beachten.


# Wiki-Quality-Navigator 2026: Master Roadmap (PRO-Version)
**Status:** Definitives Lastenheft | Integration von ROADMAP, roadmap2 & High-End-Spec

## 1. Fundament & Core-Funktionen (Status: Implementiert)
Diese Basisfunktionen bilden das Rückgrat der App und sind für maximale Performance optimiert.

* **PWA-Architektur:** Vollständig offline-fähige Progressive Web App (Service Worker, Manifest, Caching-Strategien).
* **Navigations-Engine:** Hochgeschwindigkeits-Anbindung an die Wikipedia-API mit Echtzeit-Breadcrumbs zur Pfadverfolgung.
* **Zyklen-Sperre (DFS):** Mathematisch-algorithmische Absicherung mittels Deep First Search; verhindert Endlosschleifen durch Tracking besuchter `page_ids`.
* **UI/UX Framework:** Mobile-First Design mit dynamischer Filterung ("In-Result Filtering") und Smart-Sorting nach Relevanz.
* **Supabase-Kern:** Zentrales Nutzersystem, OAuth 2.0 (Wiki), Row Level Security (RLS) und Feedback-Management-System.

## 2. Analyse- & Visualisierungs-Layer (Legacy Integration)
Übernahme der bewährten Daten-Visualisierungen aus der ursprünglichen Roadmap.

* **Timeline View:** Visualisierung der Artikel-Aktualität zur Identifikation historischer Trends.
* **Interactive Knowledge Map:** Integration von Leaflet-Karten zur Anzeige der geografischen Verteilung (Geo-Search).
* **Category Heatmap:** Treemap-Darstellung der Artikelverteilung zur schnellen Identifikation von Forschungsschwerpunkten.
* **Akademischer Export:** Volle Unterstützung für BibTeX, RIS und CSV (optimiert für Zotero/Mendeley).

## 3. Redaktions-Suite & AI-Intelligence (Premium-Standard)
Die "Killer-Features", die das Tool zum Marktführer für Wiki-Redakteure machen.

* **Health-Score Engine:** Proaktive Bewertung von Kategorien basierend auf Belegquote, Metadaten-Vollständigkeit und Konsistenz.
* **Beleg-Radar:** Deep-Scan-Analyse der `<ref>`-Dichte zur Identifikation von Wartungsstau.
* **Semantic Drift Analysis:** KI-Vektoranalyse zur automatischen Markierung von Artikeln, die thematisch nicht in eine Kategorie passen.
* **Interwiki-Conflict-Detector:** Globaler Abgleich von Kategorien-Hierarchien (DE/EN/FR/Wikidata), um strukturelle Lücken oder Fehlübersetzungen aufzudecken.



## 4. Governance-Engine (System-Integration)
Die Brücke zur offiziellen Wikipedia-Verwaltung.

* **Semi-Bot-Interface:** Push-API zum direkten Setzen von Wartungsbausteinen (`{{Löschen}}`, `{{Überarbeiten}}`) und Verschiebeanträgen.
* **Verified Editor Hub:** Automatisierter Experten-Status-Sync via Edge Functions (Wikipedia-Editcount-Validierung > 5.000 Edits).
* **Cryptographic Audit Log:** Unveränderbares Protokoll (Timestamped) aller Prüfungen als Qualitätsnachweis für die Community.
* **EventStream Anbindung:** Echtzeit-Monitoring neu angelegter Kategorien zur sofortigen Qualitätsprüfung.

## 5. Zukunfts-Phasen & Deployment
1.  **Phase 1 (Legacy & Core):** Zyklen-Sperre, PWA, Visualisierungen (Timeline/Map). (Abgeschlossen)
2.  **Phase 2 (Editor Power):** Health-Score, Beleg-Radar & Supabase-Automatisierung.
3.  **Phase 3 (AI & Global):** Semantic Drift, Wikidata-Global-Check & Cross-Wiki-Sync.
4.  **Phase 4 (Total Governance):** Bot-Schnittstelle, Audit-Log & Live-EventStream.

---
**System-Umgebung:** Lokal: `npx serve` | Live: HTTPS/Vercel | Backend: Supabase (Deno Edge)


Um die `roadmap.md` präzise mit einer Gemini-CLI (oder einem KI-Agenten) umzusetzen, reicht ein allgemeiner Prompt nicht aus. Du musst das Projekt in logische, aufeinander aufbauende Arbeitsschritte zerlegen.

Hier ist die nummerierte Liste der exakten Prompts, die du nacheinander verwenden kannst, um die Roadmap Zeile für Zeile in Code zu verwandeln:

---

### **Prompts für die Umsetzung (Schritt-für-Schritt)**

1. **System-Kontext & Baseline:**
> „Analysiere den Inhalt meiner `roadmap.md`. Agiere als Senior Fullstack-Entwickler. Dein Ziel ist die Umsetzung von **Teil 1 (Fundament)**. Erstelle eine `index.html` und eine `app.js`, die die PWA-Architektur, die Wikipedia-API-Anbindung und die **Zyklen-Sperre (DFS)** mit `page_id`-Tracking enthalten. Verwende reines Vanilla JS.“


2. **Daten-Visualisierung (Legacy Integration):**
> „Basierend auf **Teil 2 der Roadmap**, integriere Leaflet.js in die `index.html`. Erstelle in `app.js` eine Funktion, die Koordinaten aus den Wikipedia-Ergebnissen extrahiert und auf der **Interactive Knowledge Map** anzeigt. Implementiere zusätzlich den **Timeline-View** (Sortierung nach letztem Bearbeitungsdatum).“


3. **Akademischer Export & Treemap:**
> „Erweitere das UI um ein Export-Menü gemäß **Teil 2**. Implementiere Funktionen zum Download der aktuellen Ergebnistabelle als **BibTeX, RIS und CSV**. Erstelle zudem eine einfache **Category Heatmap** (Treemap), die die Verteilung der Artikel auf die Oberkategorien visualisiert.“


4. **Supabase & Auth-Integration:**
> „Setze die Backend-Struktur aus **Teil 1** um. Konfiguriere die Anbindung an **Supabase**. Implementiere den Wikipedia-OAuth-Login in einer neuen `auth.js` und erstelle eine Edge Function, die den **Verified Editor Status** prüft (Editcount > 5.000).“


5. **Redaktions-Suite (Health-Score):**
> „Setze **Teil 3 (Redaktions-Suite)** um. Erstelle eine Logik in `app.js`, die für jede geladene Kategorie einen **Health-Score** berechnet. Kriterien: Anteil belegter Artikel (via API-Abfrage der `<ref>`-Tags) und Tiefe der Struktur. Zeige diesen Score visuell mit einer Ampel-Farbe an.“


6. **Semantic Drift Analysis (KI-Integration):**
> „Implementiere das **Semantic Drift Modul** aus **Teil 3**. Sende die Titel der Artikel einer Kategorie an die Gemini-API. Die KI soll prüfen, ob ein Artikel thematisch ein Ausreißer ist. Markiere diese Artikel im UI als 'potenzielle Fehlkategorisierung'.“


7. **Interwiki-Conflict-Detector:**
> „Setze den **Interwiki-Detector** aus **Teil 3** um. Frage für eine gegebene Kategorie via Wikidata die entsprechenden Kategorien in EN und FR ab. Vergleiche die Anzahl der Unterkategorien und gib eine Warnung aus, wenn die deutsche Struktur signifikant lückenhafter ist.“


8. **Governance-Engine (Bot-Interface):**
> „Setze **Teil 4 (Governance)** um. Füge jedem Artikel in der Liste einen Button 'Wartung' hinzu. Bei Klick soll ein Menü erscheinen, das über die Wikipedia-API (mit User-Token) direkt Wartungsbausteine wie `{{Löschen}}` oder `{{Überarbeiten}}` in den Quelltext des Artikels schreibt.“


9. **Audit-Log & EventStream:**
> „Implementiere das **Cryptographic Audit Log** aus **Teil 4**. Speichere jede durchgeführte Analyse mit einem Zeitstempel und der User-ID in einer Supabase-Tabelle `audit_logs`. Integriere zusätzlich einen einfachen Listener für den Wikipedia-EventStream, um neue Kategorien in Echtzeit anzuzeigen.“



---

### **Warum diese Methode funktioniert**

* **Modularität:** Du überforderst die KI nicht mit 1000 Zeilen Code auf einmal.
* **Fehlerkontrolle:** Du kannst nach jedem Schritt prüfen, ob die Funktion (z. B. der Export oder die Map) korrekt läuft.
* **Sicherheit:** Die sensiblen Bereiche (Auth/Supabase) werden in separaten Schritten sauber isoliert.

**Soll ich für einen dieser Prompts (z. B. das Bot-Interface oder den Health-Score) bereits den spezifischen Code-Entwurf vorbereiten?**

app.js änderung:
async function validateWithOSM(lat, lon) {
    // Photon API ist kostenlos und ohne Key nutzbar (Rate-Limit beachten)
    const url = `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.features[0]?.properties.name || "Unbekannter Ort";
    } catch (e) {
        console.error("OSM Validierung fehlgeschlagen", e);
    }
}

Ich verstehe, dass für eine so komplexe App 9 Prompts zu grob wirken können. Um die **roadmap.md** wirklich zeilengenau und ohne Logikfehler umzusetzen, habe ich die Schritte nun in **mikroskopische Arbeitspakete** zerlegt.

Hier ist die erweiterte, vollständige Liste mit **21 Präzisions-Prompts**.

### Teil 1: Infrastruktur & PWA (Phase 1)

1. **PWA-Setup:** „Erstelle das PWA-Grundgerüst: `manifest.json`, einen `sw.js` (Cache-First-Strategie) und die `index.html` mit Meta-Tags für Mobile-Fähigkeit.“
2. **DFS-Algorithmus:** „Implementiere in `app.js` die `checkCycles(pageId)`-Funktion mittels Depth First Search. Nutze ein `Set`, um besuchte IDs zu tracken und Loops sofort zu blockieren.“
3. **API-Service:** „Erstelle ein Modul `wikiApi.js`, das Batch-Abfragen an `action=query` optimiert, um die Rate-Limits der MediaWiki-API einzuhalten.“
4. **Breadcrumb-Logik:** „Baue ein UI-Element, das den Navigationspfad (Kategorie-Hierarchie) in Echtzeit mitschreibt und klickbar macht.“

### Teil 2: Visualisierung & OSM (Phase 1 & 2)

5. **Leaflet-Integration:** „Binde Leaflet.js ein. Erstelle eine Funktion `renderMap(data)`, die OpenStreetMap-Kacheln lädt und Marker für Artikel mit Koordinaten setzt.“
6. **Photon-Validierung:** „Implementiere `validateGeo(lat, lon)` via Photon-API. Wenn ein Ort in Wiki als 'Berlin' markiert ist, aber die Koordinate im Meer liegt, zeige eine Warnung.“
7. **Timeline-View:** „Erstelle eine d3.js oder CSS-basierte Timeline, die Artikel nach ihrem `timestamp` der letzten Änderung sortiert visualisiert.“
8. **Export-Modul:** „Schreibe einen `Exporter`, der das aktuelle Result-Set in BibTeX-Format (mit korrekten Feldern wie `author`, `title`, `url`) umwandelt.“

### Teil 3: Backend & Supabase (Phase 2)

9. **Auth-Flow:** „Konfiguriere `auth.js` für Wikipedia-OAuth über Supabase. Speichere das Access-Token sicher im Session-Storage.“
10. **RLS-Policies:** „Erstelle SQL-Befehle für Supabase, um Row Level Security für die Tabelle `user_feedback` zu aktivieren, sodass User nur eigene Einträge sehen.“
11. **Edit-Count-Check:** „Schreibe eine Edge-Function, die beim Login den globalen Edit-Count des Users via Wiki-API prüft und das Flag `is_expert` in der DB setzt.“

### Teil 4: Intelligence & Health-Score (Phase 3)

12. **Citation-Scanner:** „Erstelle eine Funktion, die für eine Kategorie alle Artikel-Inhalte nach `<ref>`-Tags scannt und die Beleg-Dichte berechnet.“
13. **Health-Score UI:** „Entwickle eine kreisförmige Fortschrittsanzeige (SVG), die den Health-Score (0-100) einer Kategorie visualisiert.“
14. **Semantic-Embedding:** „Implementiere den API-Call an Gemini, um für 10 Artikel-Teaser Embeddings zu generieren und die semantische Ähnlichkeit zu vergleichen.“
15. **Drift-Detector:** „Schreibe die Logik, die Artikel markiert, deren semantischer Vektor mehr als 30% vom Kategorien-Durchschnitt abweicht.“
16. **Interwiki-Linker:** „Nutze Wikidata-IDs, um zu prüfen, ob die deutsche Kategorie Entsprechungen in EN/FR hat, und liste fehlende Unterkategorien auf.“

### Teil 5: Governance & Bot-Interface (Phase 4)

17. **Maintenance-UI:** „Füge jedem Artikel eine 'Quality-Action'-Leiste hinzu (Buttons für: Beleg fehlt, Löschantrag, Verschieben).“
18. **Bot-Logic:** „Implementiere die `pushWikiEdit`-Funktion. Sie muss einen `csrf-token` holen und dann den Wartungsbaustein an den Anfang des Wiki-Quelltextes setzen.“
19. **Audit-Logger:** „Schreibe eine Funktion, die jede Bot-Aktion mit Zeitstempel, Diff-Link und User-ID kryptografisch signiert in Supabase loggt.“
20. **EventStream-Listener:** „Binde den `wikimedia-eventstreams` (SSE) ein, um Änderungen in beobachteten Kategorien als Desktop-Notification anzuzeigen.“
21. **Final Polish:** „Führe ein Refactoring durch: Optimiere die Performance durch Lazy-Loading der Map-Module und minimiere das CSS für den Production-Build.“

**Mit dieser Granularität verhinderst du, dass die KI "schlampt" oder wichtige Details überspringt. Welchen dieser 21 Schritte möchtest du als erstes generieren?**
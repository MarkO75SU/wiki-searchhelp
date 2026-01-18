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

* **Health-Score Engine:** Proaktive Bewertung von Kategorien basierend auf Belegquote, Metadaten-Vollständigkeit und Konsistenz. [x]
* **Beleg-Radar:** Deep-Scan-Analyse der `<ref>`-Dichte zur Identifikation von Wartungsstau. [x]
* **Semantic Drift Analysis:** KI-Vektoranalyse zur automatischen Markierung von Artikeln, die thematisch nicht in eine Kategorie passen. [x]
* **Interwiki-Conflict-Detector:** Globaler Abgleich von Kategorien-Hierarchien (DE/EN/FR/Wikidata), um strukturelle Lücken oder Fehlübersetzungen aufzudecken.



## 4. Governance-Engine (System-Integration)
Die Brücke zur offiziellen Wikipedia-Verwaltung.

* **Semi-Bot-Interface:** Push-API zum direkten Setzen von Wartungsbausteinen (`{{Löschen}}`, `{{Überarbeiten}}`) und Verschiebeanträgen. [x] (UI Implemented)
* **Verified Editor Hub:** Automatisierter Experten-Status-Sync via Edge Functions (Wikipedia-Editcount-Validierung > 5.000 Edits).
* **Cryptographic Audit Log:** Unveränderbares Protokoll (Timestamped) aller Prüfungen als Qualitätsnachweis für die Community.
* **EventStream Anbindung:** Echtzeit-Monitoring neu angelegter Kategorien zur sofortigen Qualitätsprüfung.

## 5. Zukunfts-Phasen & Deployment
1.  **Phase 1 (Legacy & Core):** Zyklen-Sperre, PWA, Visualisierungen (Timeline/Map). (Abgeschlossen)
2.  **Phase 2 (Editor Power):** Health-Score, Beleg-Radar & Supabase-Automatisierung.
3.  **Phase 3 (AI & Global):** Semantic Drift, Wikidata-Global-Check & Cross-Wiki-Sync.
4.  **Phase 4 (Total Governance):** Bot-Schnittstelle, Audit-Log & Live-EventStream.
5.  **Phase 5 (Performance):** Lazy-Loading für Map-Module & Assets. [x]

---
**System-Umgebung:** Lokal: `npx serve` | Live: HTTPS/Vercel | Backend: Supabase (Deno Edge)

## Nächste Session: Fokus & Prioritäten
*   **Supabase Integration:** Auth-System für Redakteure implementieren (Roadmap Punkt 9-11).
*   **AI-Real-Integration:** `ai_mock.js` durch echte API-Calls ersetzen (sofern API-Key verfügbar).
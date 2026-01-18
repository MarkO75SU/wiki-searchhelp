# WikiGUI Roadmap - Integrated Vision & Future Enhancements

This document outlines the current state of WikiGUI, along with its advanced architectural decisions and future development phases, aiming for a professional-grade toolset.

## I. Core Features (Completed)

These features represent the current stable state of WikiGUI, reflecting full implementation as per the initial roadmap.

### 1. Advanced Data Visualizations
- [x] **Timeline View:** A visual timeline of search results based on their last modification date to identify historical trends or recent topic updates.
- [x] **Interactive Knowledge Map:** Integration of a map (e.g., Leaflet) to show the geographical distribution of results when coordinates are available (from Geo Search).
- [x] **Category Heatmap:** A treemap or heatmap showing how results are distributed across different Wikipedia categories to help narrow research focus.

### 2. Result Set Refinement
- [x] **Smart Sorting:** Option to sort results by "Network Relevance" (calculated during analysis) rather than just Wikipedia’s default ranking.
- [x] **In-Result Filtering:** A quick filter bar to hide/show articles by keyword within the current result set without triggering a new API request.

### 3. Enhanced Network Analysis
- [x] **Connection Details:** Interactive nodes or table rows that show the specific **shared categories** or keywords that created the link.
- [x] **Analysis Depth Control:** Toggle between "Quick" (50 articles) and "Deep" (up to 500 articles) analysis with a visible progress bar.

### 4. Usability & Academic Export
- [x] **Citation Export:** Support for exporting results in **BibTeX**, **RIS**, or enhanced **CSV** formats for researchers using tools like Zotero or Mendeley.
- [x] **Search "Drill-down":** A "Find Similar" button on results that automatically populates the search form with that article's categories and keywords.
- [x] **Journal Sync:** Options to sync the Search Journal via local file or cloud-based storage (e.g., GitHub Gist).

### 5. "Discovery" Features
- [x] **Topic Explorer ("Surprise Me"):** A feature that generates a high-quality, complex search query for a random, well-documented niche topic to demonstrate the power of the tool.

### 6. Stability & Maintenance (Ongoing)
- [x] Centralize all API logic in `src/js/modules/api.js`.
- [x] Improve error handling with user-friendly toast notifications for network failures.
- [x] Standardize asynchronous patterns across all modules.

## II. Advanced Architecture & Future Vision

These items represent architectural decisions and future development phases for WikiGUI, aiming for a premium standard and professional toolset.

### System Architecture Foundations
* **Frontend:** Mobile-First PWA with offline capabilities.
* **Backend:** Supabase RLS, PostgreSQL, Deno Edge Functions for serverless logic.
* **Intelligence:** Semantic Mapping & Cross-Wiki-Conflict Detection for deeper analysis.

### Redaktions-Workflow & Governance
* **Audit:** Full traceability of all structural checks and analyses.
* **Action:** Direct API integration for mass edits and maintenance tag application.
* **Community:** Verified Editor Status via Wikipedia-OAuth for recognized contributors.

### Future Roadmap Phases
* **Phase 2:** Implement Health-Score and Beleg-Radar for editors to assess article and category quality.
* **Phase 3:** Global Wikidata alignment and AI-powered suggestion mechanisms for categorization and content improvement.
* **Phase 4:** Full integration into Wikipedia Governance processes (e.g., direct proposal submissions).

### Development & Deployment
* **Local Testing:** `npx serve` for development.
* **Live Environment:** HTTPS required for full PWA functionality (e.g., Vercel/Supabase).

### Core Functions (Relevant to Advanced Features)
* **Loop-Detection:** Advanced cycle detection in category navigation.
* **Geo-Engine:** Extraction and mapping of geographic data from Wikipedia categories.
* **Community-Sync:** Automated status assignment based on Wikipedia contributions (e.g., edit count).

### Wiki-Intelligence Hub
* Evolution towards an AI-driven knowledge management system that proactively suggests improvements and maintains global knowledge graph consistency.
* **Global Wiki-Graph:** Integration of Wikidata entities to harmonize category structures across languages and identify knowledge gaps.
* **Semantic Guard:** Analysis of article content to detect thematic drift or miscategorization.
* **Cryptographic Audit Log:** Timestamped, immutable records of analyses and corrections for verifiable quality assurance.

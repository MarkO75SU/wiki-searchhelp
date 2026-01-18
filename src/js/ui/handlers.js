// src/js/ui/handlers.js
import { getTranslation, getLanguage, getSearchMode, setLanguage, setTranslations, setActiveArticle, FLOW_PHASES } from '../core/state.js';
import { generateSearchString } from '../core/search.js';
import { performWikipediaSearch, fetchBatchedMetadata, fetchWikiData, fetchJson, fetchArticleWikitext, fetchQualityMetrics, fetchRefCounts } from '../services/wiki_service.js';
import { addJournalEntry } from '../core/journal.js';
import { showToast } from './toast.js';
import { renderResultsList, renderMap, renderHealthUI } from './renderer.js';
import { calculateHealthScore, identifyDriftOutliers } from '../core/analysis.js';
import { generateEmbeddings, cosineSimilarity } from '../services/ai_service.js';
import { analyzeGlobalRelevance } from '../core/interwiki.js';
import { storage } from '../core/storage.js';
import { presetCategories } from '../config/presets.js';
import { flow } from '../core/flow_manager.js';

let allSearchResults = [];

export function getAllSearchResults() { return allSearchResults; }

/**
 * Handles result list interactions
 */
export function setupResultHandlers(container) {
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const title = btn.dataset.title;
        
        if (btn.classList.contains('maintenance-btn')) {
            showToast(`Lade Editor für: ${title}...`);
            setActiveArticle(title);
            try {
                const wikitext = await fetchArticleWikitext(title, getLanguage());
                const preview = document.getElementById('article-preview');
                if (preview) {
                    preview.innerHTML = `
                        <div class="editor-header">
                            <h2>${title}</h2>
                            <span class="meta-badge">Wikitext Modus</span>
                        </div>
                        <div class="wikitext-scroll">
                            <pre>${wikitext.substring(0, 5000)}${wikitext.length > 5000 ? '...' : ''}</pre>
                        </div>
                    `;
                }
                flow.navigateTo(FLOW_PHASES.EDITOR);
                populateMaintenanceForm();
            } catch (err) {
                showToast('Fehler beim Laden des Wikitextes.', 'error');
            }
        }
    });
}

function populateMaintenanceForm() {
    const container = document.getElementById('maintenance-modal-inline');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-card">
            <h3>Wartungstools</h3>
            <form id="inline-maintenance-form">
                <div class="form-group">
                    <label>Baustein-Typ</label>
                    <select id="maint-type">
                        <option value="sources">{{Belege fehlen}}</option>
                        <option value="neutrality">{{Neutralität}}</option>
                        <option value="gap">{{Lückenhaft}}</option>
                        <option value="delete">{{Löschen}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Detail-Begründung</label>
                    <textarea id="maint-reason" rows="4" placeholder="Warum ist dieser Baustein notwendig?"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">An Wikipedia senden</button>
            </form>
        </div>
    `;
}

export async function handleSearchFormSubmit(event) {
    if (event) event.preventDefault();
    const { apiQuery, wikiSearchUrlParams, shareParams } = generateSearchString();
    const lang = document.getElementById('target-wiki-lang')?.value || getLanguage();

    if (!apiQuery) return;

    showToast('Suche läuft...');
    const apiResponse = await performWikipediaSearch(apiQuery, lang);
    const searchData = apiResponse?.query?.search || [];

    if (searchData.length > 0) {
        const titles = searchData.map(r => r.title);
        const metadata = await fetchBatchedMetadata(titles, lang);
        
        // Robust Metadata Mapping
        allSearchResults = searchData.map(result => {
            const page = Object.values(metadata).find(p => p.title === result.title);
            return {
                ...result,
                thumbUrl: page?.thumbnail?.source || null,
                summary: page?.extract || 'Keine Kurzbeschreibung verfügbar.',
                coords: page?.coordinates?.[0] || null,
                lastmod: page?.revisions?.[0]?.timestamp || null,
                categories: page?.categories || []
            };
        });

        // Update UI
        renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', apiResponse.query.searchinfo.totalhits, setupResultHandlers);
        
        // Trigger Auto-Analysis
        performHealthAnalysis(allSearchResults.slice(0, 10), 'health-score-container-normal');
        renderMap(allSearchResults.slice(0, 50), 'search-results-map');

        addJournalEntry(apiQuery, `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`, shareParams);
    } else {
        showToast('Keine Ergebnisse gefunden.', 'info');
    }
}

export async function performHealthAnalysis(results, containerId) {
    if (!results.length) return;
    const titles = results.map(r => r.title);
    const lang = getLanguage();
    
    try {
        const metrics = await fetchQualityMetrics(titles, lang);
        const refCounts = await fetchRefCounts(titles, lang);
        const stats = calculateHealthScore(results, metrics, refCounts); 
        renderHealthUI(containerId, stats);
        storage.logResult({ query: 'System Scan', healthScore: stats.score, resultsCount: results.length });
    } catch (e) {
        console.error('Health Analysis failed:', e);
    }
}

export async function performDriftAnalysis(results) {
    if (results.length < 3) {
        showToast('Mindestens 3 Artikel für Drift-Analyse benötigt.');
        return;
    }
    showToast('KI-Vektoranalyse gestartet...');
    const titles = results.map(r => r.title);
    const vectors = await generateEmbeddings(titles);
    
    if (vectors) {
        const driftData = identifyDriftOutliers(results, vectors, null, cosineSimilarity);
        allSearchResults = driftData.analyzed;
        renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', allSearchResults.length, setupResultHandlers);
        showToast('Analyse abgeschlossen: ' + driftData.outlierCount + ' Ausreißer gefunden.');
    }
}

// Stubs for remaining functions to keep exports clean
export function clearForm() { document.getElementById('search-form')?.reset(); }
export function applyTranslations() {}
export function addAccordionFunctionality() {}
export function populatePresetCategories() {}
export function populatePresets() {}
export function applyPreset() {}
export function setupResultFilter() {}
export function handleTripFormSubmit() {}
export function setupSortByRelevance() {}
export function exportCitations() {}
export async function triggerTopicExplorer() {
    const lang = getLanguage();
    const res = await fetchWikiData(lang, { action: 'query', list: 'random', rnnamespace: 0, rnlimit: 1 });
    const title = res?.query?.random?.[0]?.title;
    if (title) {
        document.getElementById('search-query').value = title;
        handleSearchFormSubmit();
    }
}
export function performGeoValidation() {}
export function downloadResults() {}

export { renderResultsList, renderMap, renderHealthUI };

// src/js/ui/handlers.js
import { getTranslation, getLanguage, getSearchMode } from '../core/state.js';
import { generateSearchString } from '../core/search.js';
import { performWikipediaSearch, fetchBatchedMetadata } from '../services/wiki_service.js';
import { addJournalEntry } from '../core/journal.js';
import { showToast } from './toast.js';
import { renderResultsList, renderMap, renderHealthUI } from './renderer.js';
import { calculateHealthScore, identifyDriftOutliers } from '../core/analysis.js';
import { generateEmbeddings, cosineSimilarity } from '../services/ai_service.js';
import { analyzeGlobalRelevance } from '../core/interwiki.js';
import { storage } from '../core/storage.js';

let allSearchResults = [];

export function getAllSearchResults() { return allSearchResults; }

export function clearForm() {
    const form = document.getElementById('search-form');
    if (form) form.reset();
    showToast(getTranslation('form-cleared') || 'Form cleared');
}

export async function handleSearchFormSubmit(event) {
    event.preventDefault();
    const { apiQuery, wikiSearchUrlParams, shareParams } = generateSearchString();
    const lang = document.getElementById('target-wiki-lang')?.value || getLanguage();

    if (!apiQuery) return;

    showToast(getTranslation('searching') || 'Searching...');
    const apiResponse = await performWikipediaSearch(apiQuery, lang);
    allSearchResults = apiResponse?.query?.search || [];

    if (allSearchResults.length > 0) {
        const titles = allSearchResults.map(r => r.title);
        const metadata = await fetchBatchedMetadata(titles, lang);
        
        // Enrich results
        allSearchResults = allSearchResults.map(result => {
            const page = Object.values(metadata).find(p => p.title === result.title);
            return {
                ...result,
                thumbUrl: page?.thumbnail?.source || null,
                summary: page?.extract || '',
                coords: page?.coordinates?.[0] || null,
                lastmod: page?.revisions?.[0]?.timestamp || null,
                categories: page?.categories || []
            };
        });

        renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', apiResponse.query.searchinfo.totalhits);
        addJournalEntry(apiQuery, `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`, shareParams);
    }
}

export async function performHealthAnalysis(results, containerId) {
    if (!results.length) return;
    const stats = calculateHealthScore(results, {}, {}); // Simplified for now
    renderHealthUI(containerId, stats);
    storage.logResult({ query: 'Health Scan', healthScore: stats.score, resultsCount: results.length });
}

export async function performDriftAnalysis(results) {
    if (results.length < 3) return;
    const titles = results.map(r => r.title);
    const vectors = await generateEmbeddings(titles);
    const driftData = identifyDriftOutliers(results, vectors, null, cosineSimilarity);
    
    // Update results with drift data and re-render
    allSearchResults = driftData.analyzed;
    renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', 0);
}

export async function performInterwikiCheck(results) {
    showToast('Checking Interwiki Relevance...');
}

export function addAccordionFunctionality() { /* ... */ }
export function populatePresetCategories() { /* ... */ }
export function populatePresets() { /* ... */ }
export function applyPreset() { /* ... */ }
export function setupResultFilter() { /* ... */ }
export function handleTripFormSubmit() { /* ... */ }
export function setupSortByRelevance() { /* ... */ }
export function exportCitations() { /* ... */ }
export function triggerTopicExplorer() { /* ... */ }
export function performGeoValidation() { /* ... */ }
export function applyTranslations() { /* ... */ }

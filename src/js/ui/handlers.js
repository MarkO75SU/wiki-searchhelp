// src/js/ui/handlers.js
import { getTranslation, getLanguage, getSearchMode, setLanguage, setTranslations, setActiveArticle, FLOW_PHASES } from '../core/state.js';
import { generateSearchString } from '../core/search.js';
import { performWikipediaSearch, fetchBatchedMetadata, fetchWikiData, fetchJson, fetchArticleWikitext } from '../services/wiki_service.js';
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
 * Handles all clicks on result list items (Similar, Maintenance, etc.)
 */
export function setupResultHandlers(container) {
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const title = btn.dataset.title;
        
        if (btn.classList.contains('maintenance-btn')) {
            showToast(`Lade Editor für: ${title}...`);
            setActiveArticle(title);
            const wikitext = await fetchArticleWikitext(title, getLanguage());
            
            // Populate Editor Phase
            const preview = document.getElementById('article-preview');
            if (preview) preview.innerHTML = `<h2>${title}</h2><pre style="white-space: pre-wrap; font-size: 0.8rem; margin-top: 1rem;">${wikitext.substring(0, 2000)}...</pre>`;
            
            flow.navigateTo(FLOW_PHASES.EDITOR);
            populateMaintenanceForm();
        }
    });
}

function populateMaintenanceForm() {
    const container = document.getElementById('maintenance-modal-inline');
    if (!container) return;

    container.innerHTML = `
        <form id="inline-maintenance-form" class="settings-card">
            <div class="form-group">
                <label>Baustein-Typ</label>
                <select id="maint-type">
                    <option value="sources">{{Belege fehlen}}</option>
                    <option value="neutrality">{{Neutralität}}</option>
                    <option value="gap">{{Lückenhaft}}</option>
                </select>
            </div>
            <div class="form-group">
                <label>Begründung</label>
                <textarea id="maint-reason" rows="4" style="width:100%; background: var(--bg-input); border: 1px solid var(--border-color); color: #fff; border-radius: 4px; padding: 0.5rem;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Wiki-Sync starten</button>
        </form>
    `;
}

export function clearForm() {
    const form = document.getElementById('search-form');
    if (form) form.reset();
    showToast(getTranslation('form-cleared') || 'Form cleared');
}

export async function handleSearchFormSubmit(event) {
    if (event) event.preventDefault();
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

        renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', apiResponse.query.searchinfo.totalhits, setupResultHandlers);
        addJournalEntry(apiQuery, `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`, shareParams);
    }
}

export function applyTranslations() {
    const lang = getLanguage();
    document.documentElement.lang = lang;

    document.querySelectorAll('[id]').forEach(element => {
        const key = element.id;
        const translation = getTranslation(key);
        if (translation && translation !== key) {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                let textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                if (textNode) textNode.textContent = translation;
                else if (element.children.length === 0) element.textContent = translation;
            }
        }
    });
}

export function addAccordionFunctionality() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.search-group');
            if (group) group.classList.toggle('active');
        });
    });
}

export function populatePresetCategories(categorySelectElement) {
    if (!categorySelectElement) return;
    categorySelectElement.innerHTML = `<option value="">${getTranslation('placeholder-preset-category')}</option>`;
    for (const key in presetCategories) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = presetCategories[key][`name_${getLanguage()}`] || presetCategories[key].name_en;
        categorySelectElement.appendChild(option);
    }
}

export function populatePresets(categorySelectElement, presetSelectElement) {
    if (!categorySelectElement || !presetSelectElement) return;
    presetSelectElement.innerHTML = `<option value="">${getTranslation('placeholder-select-preset')}</option>`;
    const selectedCategoryKey = categorySelectElement.value;
    if (selectedCategoryKey && presetCategories[selectedCategoryKey]) {
        const categoryPresets = presetCategories[selectedCategoryKey].presets;
        for (const key in categoryPresets) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = getTranslation(categoryPresets[key].display_name_key);
            presetSelectElement.appendChild(option);
        }
    }
}

export function applyPreset(preset) {
    for (const key in preset) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') element.checked = preset[key];
            else element.value = preset[key];
        }
    }
    generateSearchString();
}

export function setupResultFilter() {
    const filterInput = document.getElementById('result-filter-input-normal');
    if (!filterInput) return;
    filterInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allSearchResults.filter(r => r.title.toLowerCase().includes(term));
        renderResultsList(filtered.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', filtered.length, setupResultHandlers);
    });
}

export async function performHealthAnalysis(results, containerId) {
    if (!results.length) return;
    showToast('Analyzing quality...');
    const stats = calculateHealthScore(results, {}, {}); 
    renderHealthUI(containerId, stats);
    storage.logResult({ query: 'Health Scan', healthScore: stats.score, resultsCount: results.length });
}

export async function performDriftAnalysis(results) {
    if (results.length < 3) return;
    showToast('Analyzing semantic drift...');
    const titles = results.map(r => r.title);
    const vectors = await generateEmbeddings(titles);
    const driftData = identifyDriftOutliers(results, vectors, null, cosineSimilarity);
    allSearchResults = driftData.analyzed;
    renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', 0, setupResultHandlers);
}

export async function performInterwikiCheck(results) {
    if (!results.length) return;
    showToast('Checking global relevance...');
    const titles = results.map(r => r.title);
    const relevance = await analyzeGlobalRelevance(titles, getLanguage());
}

export function setupSortByRelevance() {}
export function exportCitations() {}
export async function triggerTopicExplorer() {
    showToast('Searching for a random topic...');
    try {
        const lang = getLanguage();
        const response = await fetchWikiData(lang, { action: 'query', list: 'random', rnnamespace: 0, rnlimit: 1 });
        const randomArticle = response?.query?.random?.[0];
        if (randomArticle) {
            const queryInput = document.getElementById('search-query');
            if (queryInput) {
                queryInput.value = randomArticle.title;
                const form = document.getElementById('search-form');
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        }
    } catch (e) {
        showToast('Random topic fetch failed', 'error');
    }
}
export function performGeoValidation() {}
export function handleTripFormSubmit() {}
export function downloadResults() {}

export { renderResultsList, renderMap, renderHealthUI };

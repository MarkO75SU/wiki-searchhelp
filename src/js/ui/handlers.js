// src/js/ui/handlers.js
import { getTranslation, getLanguage, setSearchMode, setActiveArticle, FLOW_PHASES, USER_TIERS, getTier } from '../core/state.js';
import { generateSearchString } from '../core/search.js';
import { performWikipediaSearch, fetchBatchedMetadata, fetchWikiData, fetchArticleWikitext, fetchQualityMetrics, fetchRefCounts } from '../services/wiki_service.js';
import { addJournalEntry } from '../core/journal.js';
import { showToast } from './toast.js';
import { renderResultsList, renderMap, renderHealthUI } from './renderer.js';
import { calculateHealthScore, identifyDriftOutliers } from '../core/analysis.js';
import { performNetworkAnalysis } from '../core/network.js';
import { flow } from '../core/flow_manager.js';

let allSearchResults = [];

/**
 * Restores global event listeners for the cleaned layout
 */
export function setupGlobalHandlers() {
    // 1. Pro-Parameter Toggle
    const toggleBtn = document.getElementById('toggle-advanced-btn');
    const advancedArea = document.getElementById('advanced-settings-area');
    if (toggleBtn && advancedArea) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = advancedArea.style.display === 'none';
            advancedArea.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? getTranslation('btn-pro-params-close', '🔼 Pro-Parameter verbergen') : getTranslation('btn-pro-params', '⚙️ Erweiterte Pro-Parameter');
        });
    }

    // 2. Mode Selector Tabs
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            setSearchMode(tab.dataset.mode);
            showToast(`${getTranslation('toast-mode-active', 'Modus aktiv')}: ${tab.textContent}`);
        });
    });

    // 3. Network Graph Trigger (Free Feature)
    const networkBtn = document.getElementById('analyze-network-button-normal');
    if (networkBtn) {
        networkBtn.addEventListener('click', async () => {
            if (allSearchResults.length === 0) {
                showToast(getTranslation('alert-analyze-first', 'Zuerst eine Suche starten.'), 'info');
                return;
            }
            showToast(getTranslation('network-loading', 'Analyse läuft...'));
            await performNetworkAnalysis(allSearchResults);
        });
    }
}

/**
 * Handles the main Search Form submission
 */
export async function handleSearchFormSubmit(event) {
    if (event) event.preventDefault();
    const query = document.getElementById('search-query')?.value;
    const lang = document.getElementById('target-wiki-lang')?.value || getLanguage();

    if (!query) {
        showToast(getTranslation('error-empty-query', 'Suchbegriff fehlt!'), 'error');
        return;
    }

    showToast(getTranslation('toast-scan-running', 'Scan läuft...'));
    const { apiQuery, wikiSearchUrlParams, shareParams } = generateSearchString();
    
    try {
        const apiResponse = await performWikipediaSearch(apiQuery, lang);
        const searchData = apiResponse?.query?.search || [];

        if (searchData.length > 0) {
            const metadata = await fetchBatchedMetadata(searchData.map(r => r.title), lang);
            
            allSearchResults = searchData.map(result => {
                const page = Object.values(metadata).find(p => p.title === result.title);
                return {
                    ...result,
                    thumbUrl: page?.thumbnail?.source || null,
                    summary: page?.extract || 'Keine Kurzbeschreibung.',
                    coords: page?.coordinates?.[0] || null
                };
            });

            // Update UI & Step to Phase 2
            renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', null, 'search-results-heading-normal', apiResponse.query.searchinfo.totalhits, setupResultHandlers);
            renderMap(allSearchResults.slice(0, 50), 'search-results-map');
            
            flow.navigateTo(FLOW_PHASES.ANALYSIS);
            addJournalEntry(apiQuery, `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`, shareParams);
        } else {
            showToast(getTranslation('no-results-found', 'Keine Artikel gefunden.'), 'info');
        }
    } catch (err) {
        console.error('Search failure:', err);
        showToast(getTranslation('error-api-fetch', 'API Fehler.'), 'error');
    }
}

/**
 * Attaches handlers to result cards
 */
export function setupResultHandlers(container) {
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const title = btn.dataset.title;
        
        if (btn.classList.contains('maintenance-btn')) {
            showToast(`${getTranslation('loading-editor', 'Lade Editor')}...`);
            setActiveArticle(title);
            const wikitext = await fetchArticleWikitext(title, getLanguage());
            document.getElementById('article-preview').innerHTML = `
                <div class="editor-header"><h2>${title}</h2><span class="meta-badge">Enterprise Editor</span></div>
                <div class="wikitext-scroll"><pre>${wikitext.substring(0, 10000)}</pre></div>
            `;
            flow.navigateTo(FLOW_PHASES.EDITOR);
        }
    });
}

// ... Additional exports for main.js compatibility
export function applyTranslations() {
    const el = document.querySelectorAll('[data-i18n]');
    el.forEach(item => {
        const key = item.dataset.i18n;
        item.textContent = getTranslation(key, item.textContent);
    });
}
export function clearForm() { document.getElementById('search-form')?.reset(); }
export async function triggerTopicExplorer() {
    const lang = getLanguage();
    const res = await fetchWikiData(lang, { action: 'query', list: 'random', rnnamespace: 0, rnlimit: 1 });
    const title = res?.query?.random?.[0]?.title;
    if (title) {
        document.getElementById('search-query').value = title;
        handleSearchFormSubmit();
    }
}
export { renderResultsList, renderMap, renderHealthUI };

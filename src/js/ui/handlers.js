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
 * Initializes global event handlers for the Enterprise Suite
 */
export function setupGlobalHandlers() {
    // 1. Pro-Parameter Toggle
    const toggleBtn = document.getElementById('toggle-advanced-btn');
    const advancedArea = document.getElementById('advanced-settings-area');
    if (toggleBtn && advancedArea) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = advancedArea.style.display === 'none';
            advancedArea.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '🔼 Pro-Parameter verbergen' : '⚙️ Erweiterte Pro-Parameter';
        });
    }

    // 2. Search Mode Tabs
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            setSearchMode(tab.dataset.mode);
            showToast(`Modus aktiviert: ${tab.textContent}`);
        });
    });

    // 3. Network Analysis Trigger
    const networkBtn = document.getElementById('analyze-network-button-normal');
    if (networkBtn) {
        networkBtn.addEventListener('click', async () => {
            if (allSearchResults.length === 0) {
                showToast('Bitte führen Sie zuerst einen Scan durch.', 'info');
                return;
            }
            showToast('Netzwerk-Analyse gestartet...');
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
        showToast('Suchbegriff fehlt!', 'error');
        return;
    }

    showToast('Scan initialisiert...');
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
                    summary: page?.extract || 'Keine Beschreibung vorhanden.',
                    coords: page?.coordinates?.[0] || null
                };
            });

            // Populate Results & Maps
            renderResultsList(allSearchResults.slice(0, 10), 'simulated-search-results-normal', null, 'search-results-heading-normal', apiResponse.query.searchinfo.totalhits, setupResultHandlers);
            renderMap(allSearchResults.slice(0, 50), 'search-results-map');
            
            // Advance to Analysis Phase
            flow.navigateTo(FLOW_PHASES.ANALYSIS);
            
            // Log to journal
            addJournalEntry(apiQuery, `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`, shareParams);
        } else {
            showToast('Keine Wikipedia-Einträge gefunden.', 'info');
        }
    } catch (err) {
        console.error('Search failure:', err);
        showToast('Fehler bei der Kommunikation mit Wikipedia.', 'error');
    }
}

/**
 * Attaches handlers to rendered result items
 */
export function setupResultHandlers(container) {
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const title = btn.dataset.title;
        if (btn.classList.contains('maintenance-btn')) {
            showToast(`Vorbereitung: ${title}`);
            setActiveArticle(title);
            const wikitext = await fetchArticleWikitext(title, getLanguage());
            
            document.getElementById('article-preview').innerHTML = `
                <div class="editor-header">
                    <h2>${title}</h2>
                    <span class="meta-badge">Enterprise Editor</span>
                </div>
                <div class="wikitext-scroll">
                    <pre>${wikitext.substring(0, 8000)}</pre>
                </div>
            `;
            flow.navigateTo(FLOW_PHASES.EDITOR);
        }
    });
}

// Stubs for PWA/Admin compatibility
export function applyTranslations() {}
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
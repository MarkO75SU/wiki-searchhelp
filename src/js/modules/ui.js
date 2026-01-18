// src/js/modules/ui.js
import { getTranslation, getLanguage, getSearchMode } from './state.js';
import { generateSearchString } from './search.js';
import { performWikipediaSearch, fetchArticleSummary, fetchArticlesInfo, fetchArticlesSummaries, fetchArticleModificationDates, fetchArticleCoordinates, fetchArticlesCategories, fetchQualityMetrics, validateWithOSM, fetchInterwikiLinks, fetchRefCounts } from './api.js';
import { presetCategories } from './presets.js';
import { addJournalEntry } from './journal.js';
import { showToast } from './toast.js';
import { loadLeaflet } from './utils.js';
import { generateEmbeddings, calculateCentroid, cosineSimilarity } from './ai_service.js';
import { analyzeGlobalRelevance } from './interwiki.js';
import { saveTestReport } from './database.js';

let allSearchResults = []; // Store full search results for downloading

export function getAllSearchResults() {
    return allSearchResults;
}

const wikipediaSearchHelpUrls = {
    'de': 'https://de.wikipedia.org/wiki/Hilfe:Suche',
    'en': 'https://en.wikipedia.org/wiki/Help:Searching',
    'fr': 'https://fr.wikipedia.org/wiki/Aide:Recherche',
    'es': 'https://es.wikipedia.org/wiki/Ayuda:Búsqueda',
    'zh': 'https://zh.wikipedia.org/wiki/Help:Search',
    'hi': 'https://hi.wikipedia.org/wiki/Help:Search',
    'ar': 'https://ar.wikipedia.org/wiki/Help:Search',
    'ru': 'https://ru.wikipedia.org/wiki/Help:Search',
    'pt': 'https://pt.wikipedia.org/wiki/Ajuda:Pesquisa'
};

export function populatePresets(categorySelectElement, presetSelectElement) {
    presetSelectElement.innerHTML = `<option value="">${getTranslation('placeholder-select-preset')}</option>`;
    const selectedCategoryKey = categorySelectElement.value;
    if (selectedCategoryKey && presetCategories[selectedCategoryKey]) {
        const categoryPresets = presetCategories[selectedCategoryKey].presets;
        for (const key in categoryPresets) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = getTranslation(categoryPresets[key].display_name_key); // Use display_name_key
            presetSelectElement.appendChild(option);
        }
    }
}

export function populatePresetCategories(categorySelectElement, presetSelectElement) {
    categorySelectElement.innerHTML = `<option value="">${getTranslation('placeholder-preset-category')}</option>`;
    for (const key in presetCategories) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = presetCategories[key][`name_${getLanguage()}`] || presetCategories[key].name_en;
        categorySelectElement.appendChild(option);
    }
}

export function applyPreset(preset) {
    clearForm(); // Clear all form fields first

    const targetLangSelect = document.getElementById('target-wiki-lang');
    if(targetLangSelect) {
        targetLangSelect.value = getLanguage();
    }

    for (const key in preset) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = preset[key];
            } else {
                const presetValue = preset[key];
                let valueToSet = presetValue;
                if (typeof presetValue === 'string' && presetValue.startsWith('preset-')) {
                    valueToSet = getTranslation(presetValue, presetValue);
                }
                element.value = valueToSet;
            }
        }
    }
    generateSearchString();
}

export function applyTranslations() {
    const lang = getLanguage();
    document.documentElement.lang = lang;

    // Update Meta Description
    const metaDescription = document.getElementById('meta-description');
    if (metaDescription) {
        metaDescription.content = getTranslation('seo-description');
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = getTranslation('page-title');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = getTranslation('seo-description');

    // Populate new footer disclaimers
    const footerDisclaimerMain = document.getElementById('footer-disclaimer-main');
    if (footerDisclaimerMain) {
        footerDisclaimerMain.textContent = getTranslation('main-heading-disclaimer');
    }
    const footerDisclaimerInfo = document.getElementById('footer-disclaimer-info');
    if (footerDisclaimerInfo) {
        footerDisclaimerInfo.textContent = getTranslation('search-info-text');
    }

    document.querySelectorAll('[id]').forEach(element => {
        const key = element.id;
        // Skip advanced-mode-description as its content is managed dynamically by updateAdvancedModeDescription
        if (key === 'advanced-mode-description') {
            return;
        }
        const translation = getTranslation(key);
        if (translation && translation !== key) {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                // Preserving child elements (icons, arrows) by only updating the text node or prepending
                let textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                if (textNode) {
                    textNode.textContent = translation;
                } else if (element.children.length > 0) {
                    // If no text node but has children, we might need to add the text at the start
                    const newTextNode = document.createTextNode(translation);
                    element.insertBefore(newTextNode, element.firstChild);
                } else {
                    element.textContent = translation;
                }
            }
        }
        
        const titleTranslation = getTranslation(key + '-title');
        if (titleTranslation && titleTranslation !== (key + '-title')) {
            element.title = titleTranslation;
        }
    });

    // Translate Tooltips for Info Icons (using data-info-id)
    document.querySelectorAll('.info-icon[data-info-id]').forEach(element => {
        const infoKey = element.getAttribute('data-info-id');
        const translation = getTranslation(infoKey);
        if (translation) {
            element.setAttribute('title', translation);
        }
    });

    const saveSearchCommentInput = document.getElementById('save-search-comment');
    if (saveSearchCommentInput) {
        saveSearchCommentInput.placeholder = getTranslation('save-search-comment-placeholder');
    }

    const searchQueryInput = document.getElementById('search-query');
    if (searchQueryInput) {
        searchQueryInput.placeholder = getTranslation('search-query-placeholder');
    }

    const searchQueryAdvInput = document.getElementById('search-query-adv');
    if (searchQueryAdvInput) {
        searchQueryAdvInput.placeholder = getTranslation('search-query-placeholder');
    }

    const exactPhraseInput = document.getElementById('exact-phrase');
    if (exactPhraseInput) {
        exactPhraseInput.placeholder = getTranslation('exact-phrase-placeholder');
    }

    const withoutWordsInput = document.getElementById('without-words');
    if (withoutWordsInput) {
        withoutWordsInput.placeholder = getTranslation('without-words-placeholder');
    }

    const anyWordsInput = document.getElementById('any-words');
    if (anyWordsInput) {
        anyWordsInput.placeholder = getTranslation('any-words-placeholder');
    }

    const prefixValueInput = document.getElementById('prefix-value');
    if (prefixValueInput) {
        prefixValueInput.placeholder = getTranslation('prefix-placeholder');
    }

    const incategoryValueInput = document.getElementById('incategory-value');
    if (incategoryValueInput) {
        incategoryValueInput.placeholder = getTranslation('incategory-placeholder');
    }

    const deepcatValueInput = document.getElementById('deepcat-value');
    if (deepcatValueInput) {
        deepcatValueInput.placeholder = getTranslation('deepcat-placeholder');
    }

    const linkfromValueInput = document.getElementById('linkfrom-value');
    if (linkfromValueInput) {
        linkfromValueInput.placeholder = getTranslation('linkfrom-placeholder');
    }

    const hastemplateValueInput = document.getElementById('hastemplate-value');
    if (hastemplateValueInput) {
        hastemplateValueInput.placeholder = getTranslation('hastemplate-placeholder');
    }

    const filesizeMinInput = document.getElementById('filesize-min');
    if (filesizeMinInput) {
        filesizeMinInput.placeholder = getTranslation('filesize-min-placeholder');
    }

    const filesizeMaxInput = document.getElementById('filesize-max');
    if (filesizeMaxInput) {
        filesizeMaxInput.placeholder = getTranslation('filesize-max-placeholder');
    }

    const insourceValueInput = document.getElementById('insource-value');
    if (insourceValueInput) {
        insourceValueInput.placeholder = getTranslation('insource-placeholder');
    }

    const resultFilterInput = document.getElementById('result-filter-input');
    if (resultFilterInput) {
        resultFilterInput.placeholder = getTranslation('filter-results-placeholder');
    }
    
    // Translate preset category and preset select labels
    const presetCategorySelect = document.getElementById('preset-category-select');
    const presetSelect = document.getElementById('preset-select');
    if (presetCategorySelect && presetSelect) {
        const currentCategory = presetCategorySelect.value;
        const currentPreset = presetSelect.value;
        
        populatePresetCategories(presetCategorySelect, presetSelect);
        
        if (currentCategory) {
            presetCategorySelect.value = currentCategory;
            populatePresets(presetCategorySelect, presetSelect);
            if (currentPreset) {
                presetSelect.value = currentPreset;
            }
        }
    }

    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        populateCategoryOptions(categorySelect);
    }


    const officialDocLink = document.getElementById('official-doc-link');
    if (officialDocLink) {
        officialDocLink.href = wikipediaSearchHelpUrls[lang] || wikipediaSearchHelpUrls['en'];
    }

    const targetLangSelect = document.getElementById('target-wiki-lang');
    if (targetLangSelect) {
        populateLanguageOptions(targetLangSelect); // Call the new function
        // targetLangSelect.value = lang; // This line is now redundant as it's set in populateLanguageOptions
    }
    
    // Update footer links
    const footerLinkIds = ['link-license-agreement', 'link-terms-of-use', 'link-non-commercial-use', 'link-impressum', 'link-privacy-policy', 'link-faq', 'link-blog', 'link-help', 'link-report-issue'];
    footerLinkIds.forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            const originalHref = link.getAttribute('href').replace('_de.html', '.html');
            if (lang === 'de') {
                link.href = originalHref.replace('.html', '_de.html');
            } else {
                link.href = originalHref;
            }
            link.textContent = getTranslation(id); // Add this line to translate the link text
        }
    });

    const copyUrlButton = document.getElementById('copy-url-button');
    if (copyUrlButton) {
        copyUrlButton.title = getTranslation('copy-url-button-title');
    }

    // Explicitly translate language switch buttons
    const langDeButton = document.getElementById('lang-de');
    const langEnButton = document.getElementById('lang-en');
}

export function clearForm() {
    // Clear normal search form
    const normalSearchForm = document.getElementById('search-form');
    if (normalSearchForm) {
        normalSearchForm.reset();
        document.querySelectorAll('#filetype-options input').forEach(cb => cb.checked = false);
    }
    // Clear network search form
    const networkSearchForm = document.getElementById('network-search-form');
    if (networkSearchForm) {
        networkSearchForm.reset();
    }

    // Clear results for normal search
    const resultsActionsNormal = document.getElementById('results-actions-container-normal');
    if (resultsActionsNormal) resultsActionsNormal.style.display = 'none';
    const resultsContainerNormal = document.getElementById('simulated-search-results-normal');
    if (resultsContainerNormal) resultsContainerNormal.innerHTML = '';
    const filterInputNormal = document.getElementById('result-filter-input-normal');
    if (filterInputNormal) filterInputNormal.value = '';

    // Clear results for network search (original IDs)
    const resultsActionsNetwork = document.getElementById('results-actions-container'); 
    if (resultsActionsNetwork) resultsActionsNetwork.style.display = 'none';
    const resultsContainerNetwork = document.getElementById('simulated-search-results'); 
    if (resultsContainerNetwork) resultsContainerNetwork.innerHTML = '';
    const filterInputNetwork = document.getElementById('result-filter-input'); 
    if (filterInputNetwork) filterInputNetwork.value = '';
    
    // Clear saved form state from sessionStorage
    sessionStorage.removeItem('wikiGuiFormState');
    
    generateSearchString();
}

export async function handleSearchFormSubmit(event) {
    event.preventDefault();
    const currentMode = getSearchMode();

    let langElement;
    let apiQuery;
    let wikiSearchUrlParams;
    let shareParams;

    // Determine which form to use for generating the search string
    if (currentMode === 'normal') {
        langElement = document.getElementById('target-wiki-lang');
        ({ apiQuery, wikiSearchUrlParams, shareParams } = generateSearchString()); // generateSearchString reads from normal form inputs
    } else if (currentMode === 'network') {
        langElement = document.getElementById('network-target-wiki-lang');
        // For network mode, generateSearchString needs to read from the network form's specific inputs
        // This might require modifying generateSearchString to accept a scope or specific elements,
        // or ensure it reads from the currently active form. Assuming it reads relevant inputs from network form.
        ({ apiQuery, wikiSearchUrlParams, shareParams } = generateSearchString()); 
    } else {
        console.error("Unknown search mode:", currentMode);
        return;
    }

    const lang = langElement?.value;

    if (!apiQuery || !lang) return;

    // Select the correct result display elements based on the current mode
    const resultsContainer = document.getElementById(currentMode === 'normal' ? 'simulated-search-results-normal' : 'simulated-search-results');
    const searchResultsHeadingDisplay = document.getElementById(currentMode === 'normal' ? 'search-results-heading-normal' : 'search-results-heading');
    const resultsActions = document.getElementById(currentMode === 'normal' ? 'results-actions-container-normal' : 'results-actions-container');
    const resultsTableSection = document.getElementById(currentMode === 'normal' ? 'results-table-section-normal' : 'results-table-section');

    if (!resultsContainer || !searchResultsHeadingDisplay || !resultsActions || !resultsTableSection) {
        console.error("Missing result display elements for mode:", currentMode);
        return;
    }

    // Skeleton Loading State
    resultsContainer.innerHTML = Array(3).fill(0).map(() => `
        <li class="result-item">
            <div class="result-thumbnail skeleton"></div>
            <div class="result-content">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton" style="width: 80%"></div>
            </div>
        </li>
    `).join('');
    
    const apiResponse = await performWikipediaSearch(apiQuery, lang, 500);
    allSearchResults = apiResponse?.query?.search || []; // This variable is global
    const topResults = allSearchResults.slice(0, 10);
    const totalHits = apiResponse?.query?.searchinfo?.totalhits || 0;

    if (searchResultsHeadingDisplay) {
        searchResultsHeadingDisplay.textContent = getTranslation('search-results-heading', '', { totalResults: totalHits });
    }

    resultsContainer.innerHTML = '';

    if (allSearchResults.length === 0) {
        resultsContainer.innerHTML = `<li>${getTranslation('no-results-found')}</li>`;
        resultsActions.style.display = 'none';
        return;
    }

    resultsActions.style.display = 'block';

    // Auto-expand the results table section when results are displayed
    resultsTableSection.classList.add('active');

    // Fetch images, summaries, modification dates, coordinates, and categories for results
    const titles = allSearchResults.map(r => r.title); // Use allSearchResults titles for modification dates
    const [infoResponse, summariesPages, modificationDatesResponse, coordinatesResponse, categoriesResponse] = await Promise.all([
        fetchArticlesInfo(titles, lang),
        fetchArticlesSummaries(titles, lang),
        fetchArticleModificationDates(titles, lang),
        fetchArticleCoordinates(titles, lang),
        fetchArticlesCategories(titles, lang) // Fetch categories
    ]);
    
    const pagesInfo = infoResponse?.query?.pages || {};
    const modificationDates = modificationDatesResponse || {};
    const coordinates = coordinatesResponse || {};
    const categoriesData = categoriesResponse || {};

    // Integrate modification dates, coordinates, and categories into allSearchResults
    allSearchResults = allSearchResults.map(result => {
        // Find categories for this specific title
        const pageId = Object.keys(categoriesData).find(id => categoriesData[id].title === result.title);
        const cats = categoriesData[pageId]?.categories || null;

        // Find summary
        const summaryPageId = Object.keys(summariesPages).find(id => summariesPages[id].title === result.title);
        const summary = summariesPages[summaryPageId]?.extract || getTranslation('no-summary-available', 'Keine Zusammenfassung verfügbar.');
        
        // Find thumbnail
        const infoPageId = Object.keys(pagesInfo).find(id => pagesInfo[id].title === result.title);
        const thumbUrl = pagesInfo[infoPageId]?.thumbnail?.source || null;

        return {
            ...result,
            lastmod: modificationDates[result.title] || null,
            coords: coordinates[result.title] || null,
            categories: cats,
            summary: summary,
            thumbUrl: thumbUrl
        };
    });

    // Render results using the new function
    renderResultsList(
        allSearchResults.slice(0, 10), 
        currentMode === 'normal' ? 'simulated-search-results-normal' : 'simulated-search-results',
        currentMode === 'normal' ? 'results-actions-container-normal' : 'results-actions-container',
        currentMode === 'normal' ? 'search-results-heading-normal' : 'search-results-heading',
        totalHits
    );

    // Save to journal AFTER rendering to ensure clean flow
    const targetUrl = `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`;
    addJournalEntry(apiQuery, targetUrl, shareParams); 
    showToast(getTranslation('toast-search-complete') || 'Suche abgeschlossen.');

    // Render Timeline
    renderTimeline(allSearchResults, 'timeline-chart');

    // Render Map
    renderMap(allSearchResults, 'search-results-map');

    // Render Heatmap
    renderCategoryHeatmap(allSearchResults, 'category-heatmap');
}

export function downloadResults() {
    if (allSearchResults.length === 0) return;

    let content = 'Wikipedia Search Results\n';
    content += 'Generated by WikiGUI\n';
    content += `Total results found: ${allSearchResults.length} (showing max 500 in this file)\n`;
    content += '------------------------\n\n';

    const lang = document.getElementById('target-wiki-lang').value;

    allSearchResults.forEach(result => {
        const title = result.title;
        const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
        content += `${title}: ${url}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wikipedia-results-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function drillDownSearch(title, categories) {
    clearForm();
    const queryInput = document.getElementById('search-query');
    const incategoryInput = document.getElementById('incategory-value');

    if (queryInput) queryInput.value = title;
    if (incategoryInput && categories) {
        // Use up to 3 categories, pipe-separated
        const catTitles = categories.slice(0, 3).map(c => c.title.replace(/^Category:/i, ''));
        incategoryInput.value = catTitles.join('|');
    }

    // Trigger the search
    const form = document.getElementById('search-form');
    if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
}

export function exportCitations(format) {
    if (allSearchResults.length === 0) return;

    const lang = document.getElementById('target-wiki-lang')?.value || getLanguage();
    let content = '';
    const filename = `wikipedia-citations-${new Date().toISOString().slice(0,10)}.${format === 'bibtex' ? 'bib' : 'ris'}`;

    allSearchResults.forEach((result, index) => {
        const title = result.title;
        const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
        const year = new Date().getFullYear(); // Simplified for now

        if (format === 'bibtex') {
            content += `@misc{wiki:${title.replace(/\s+/g, '_').toLowerCase()}_${index},\n`;
            content += `  author = {Wikipedia contributors},\n`;
            content += `  title = {${title} --- {W}ikipedia{,} The Free Encyclopedia},\n`;
            content += `  year = {${year}},\n`;
            content += `  url = {${url}},\n`;
            content += `  note = {[Online; accessed ${new Date().toISOString().slice(0,10)}]}\n`;
            content += `}\n\n`;
        } else if (format === 'ris') {
            content += `TY  - ELEC\n`;
            content += `TI  - ${title}\n`;
            content += `AU  - Wikipedia contributors\n`;
            content += `PY  - ${year}\n`;
            content += `UR  - ${url}\n`;
            content += `DB  - Wikipedia\n`;
            content += `ER  - \n\n`;
        }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function addAccordionFunctionality() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        const group = header.closest('.search-group');
        if (!group) return; // Ensure there's a parent group

        const content = header.nextElementSibling; // Assuming content is the direct sibling
        if (!content || !content.id) {
            console.warn("Accordion header does not have a valid content element with an ID.", header);
            return;
        }

        // Setup ARIA attributes
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-controls', content.id);

        // Initial state
        const isActive = group.classList.contains('active');
        header.setAttribute('aria-expanded', isActive);

        // Click event listener
        header.addEventListener('click', () => {
            group.classList.toggle('active');
            const newIsActive = group.classList.contains('active');
            header.setAttribute('aria-expanded', newIsActive);
        });

        // Keydown event listener for Enter key
        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent default scroll for spacebar
                group.classList.toggle('active');
                const newIsActive = group.classList.contains('active');
                header.setAttribute('aria-expanded', newIsActive);
            }
        });
    });

    // Open the first accordion by default (if it's an accordion)
    const firstGroup = document.getElementById('group-main-query');
    if(firstGroup && firstGroup.querySelector('.accordion-header')) { // Check if it's actually an accordion
        firstGroup.classList.add('active');
        // Manually set aria-expanded for the first accordion header
        const firstHeader = firstGroup.querySelector('.accordion-header');
        if(firstHeader) {
            firstHeader.setAttribute('aria-expanded', 'true');
        }
    }
}

// New function to populate language options dynamically
export function populateLanguageOptions(selectElement) {
    selectElement.innerHTML = ''; // Clear existing options
    const languages = [
        { code: 'de', flag: '🇩🇪' },
        { code: 'en', flag: '🇬🇧' },
        { code: 'fr', flag: '🇫🇷' },
        { code: 'es', flag: '🇪🇸' },
        { code: 'zh', flag: '🇨🇳' },
        { code: 'hi', flag: '🇮🇳' },
        { code: 'ar', flag: '🇦🇪' },
        { code: 'ru', flag: '🇷🇺' },
        { code: 'pt', flag: '🇵🇹' }
    ];

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        const label = getTranslation(`lang-${lang.code}-option`);
        // Remove existing flags from translation if present to avoid duplicates
        const cleanLabel = label.replace(/[^\w\s\(\)]/g, '').trim(); 
        option.textContent = `${lang.flag} ${cleanLabel}`;
        selectElement.appendChild(option);
    });
    selectElement.value = getLanguage(); // Set selected language
}

// New function to populate category options dynamically
export function populateCategoryOptions(selectElement) {
    selectElement.innerHTML = `<option value="">${getTranslation('placeholder-category-dropdown')}</option>`; // Default placeholder
    const categories = [
        { value: 'Science', key: 'category-Science' },
        { value: 'History', key: 'category-History' },
        { value: 'Art', key: 'category-Art' },
        { value: 'Technology', key: 'category-Technology' },
        { value: 'Geography', key: 'category-Geography' },
        { value: 'Philosophy', key: 'category-Philosophy' },
        { value: 'Religion', key: 'category-Religion' },
        { value: 'Society', key: 'category-Society' },
        { value: 'Health', key: 'category-Health' },
        { value: 'Mathematics', key: 'category-Mathematics' },
        { value: 'Nature', key: 'category-Nature' },
        { value: 'Culture', key: 'category-Culture' },
        { value: 'People', key: 'category-People' },
        { value: 'Politics', key: 'category-Politics' },
        { value: 'Sport', key: 'category-Sport' },
        { value: 'Music', key: 'category-Music' },
        { value: 'Literature', key: 'category-Literature' },
        { value: 'Law', key: 'category-Law' },
        { value: 'Economy', key: 'category-Economy' },
        { value: 'Education', key: 'category-Education' }
    ];

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = getTranslation(cat.key);
        selectElement.appendChild(option);
    });
}

export function setupResultFilter() {
    const handleFilterInput = (event) => {
        const filterText = event.target.value.toLowerCase();
        const filteredResults = allSearchResults.filter(result => 
            result.title.toLowerCase().includes(filterText) || 
            (result.summary && result.summary.toLowerCase().includes(filterText))
        );

        const currentMode = getSearchMode();
        renderResultsList(
            filteredResults.slice(0, 10), 
            currentMode === 'normal' ? 'simulated-search-results-normal' : 'simulated-search-results',
            currentMode === 'normal' ? 'results-actions-container-normal' : 'results-actions-container',
            currentMode === 'normal' ? 'search-results-heading-normal' : 'search-results-heading',
            filteredResults.length
        );
    };

    const filterInputNormal = document.getElementById('result-filter-input-normal');
    if (filterInputNormal) {
        filterInputNormal.addEventListener('input', handleFilterInput);
    }

    const filterInputNetwork = document.getElementById('result-filter-input');
    if (filterInputNetwork) {
        filterInputNetwork.addEventListener('input', handleFilterInput);
    }
}

// Parameter explanation modal and setup
export function setupParameterExplanation() {
    const explainBtn = document.getElementById('explain-params-button');
    const modal = document.getElementById('params-explanation-modal');
    const modalTitle = document.getElementById('params-modal-title');
    const modalBody = document.getElementById('params-modal-body');
    const closeBtn = document.getElementById('params-modal-close');

    if (!modal || !explainBtn || !modalBody) return;

    explainBtn.textContent = getTranslation('explain-params-button') || 'Explain parameters';
    modalTitle.textContent = getTranslation('params-modal-title') || 'Parameter explanations';
    closeBtn && (closeBtn.title = getTranslation('params-modal-close') || 'Close');

    explainBtn.addEventListener('click', () => {
        const { wikiSearchUrlParams } = generateSearchString();
        const searchUrl = wikiSearchUrlParams ? `https://${getLanguage()}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}` : '';
        modalBody.innerHTML = buildParamsContent(searchUrl);
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
    });

    closeBtn?.addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
    });

    function closeModal() {
        modal.setAttribute('aria-hidden','true');
        document.body.style.overflow = '';
    }

    function buildParamsContent(searchUrl) {
        const params = [
            { key: 'search', title: getTranslation('label-search-query'), desc: getTranslation('param-search-desc'), example: 'search=Mars' },
            { key: 'exact', title: getTranslation('label-exact-phrase'), desc: getTranslation('param-exact-desc'), example: 'search="red planet"' },
            { key: 'without', title: getTranslation('label-without-words'), desc: getTranslation('param-without-desc'), example: 'search=-rover' },
            { key: 'any', title: getTranslation('label-any-words'), desc: getTranslation('param-any-desc'), example: 'search=(exploration OR mission)' },
            { key: 'intitle', title: getTranslation('label-intitle'), desc: getTranslation('param-intitle-desc'), example: 'intitle=Mars' },
            { key: 'incategory', title: getTranslation('label-incategory'), desc: getTranslation('param-incategory-desc'), example: 'incategory=Space+travel' },
            { key: 'deepcat', title: getTranslation('label-deepcat'), desc: getTranslation('param-deepcat-desc'), example: 'deepcat=Biology' },
            { key: 'prefix', title: getTranslation('label-prefix-value'), desc: getTranslation('param-prefix-desc'), example: 'prefix=Science:' },
            { key: 'linkfrom', title: getTranslation('label-linkfrom'), desc: getTranslation('param-linkfrom-desc'), example: 'linkfrom=Albert+Einstein' },
            { key: 'insource', title: getTranslation('label-insource'), desc: getTranslation('param-insource-desc'), example: 'insource:/regex/' },
            { key: 'hastemplate', title: getTranslation('label-hastemplate'), desc: getTranslation('param-hastemplate-desc'), example: 'hastemplate=Infobox+Scientist' },
            { key: 'filetype', title: getTranslation('label-filetype'), desc: getTranslation('param-filetype-desc'), example: 'filetype=pdf|jpg' },
            { key: 'filesize', title: getTranslation('label-filesize'), desc: getTranslation('param-filesize-desc'), example: 'search=filesize:>=1024' },
            { key: 'dateafter', title: getTranslation('label-dateafter'), desc: getTranslation('param-date-desc'), example: 'dateafter=2020-01-01' },
            { key: 'datebefore', title: getTranslation('label-datebefore'), desc: getTranslation('param-date-desc'), example: 'datebefore=2021-12-31' },
            { key: 'namespaces', title: getTranslation('label-namespaces'), desc: getTranslation('param-ns-desc'), example: 'ns0=1 (main namespace)' }
        ];

        let html = '';
        if (searchUrl) {
            html += `<p>${getTranslation('params-modal-current-example') || 'Example generated Special:Search URL:'}</p><div class="example">${searchUrl}</div>`;
            // Also parse the querystring and show a breakdown
            try {
                const u = new URL(searchUrl);
                const qp = u.searchParams;
                html += '<h4>' + (getTranslation('params-modal-breakdown-heading') || 'Breakdown of parameters') + '</h4>';
                html += '<ul>';
                // For each unique param, list its values
                const visited = new Set();
                for (const [k, v] of qp.entries()) {
                    if (visited.has(k)) continue; // we'll list duplicates in getAll
                    const values = qp.getAll(k);
                    visited.add(k);
                    html += `<li><strong>${k}</strong>: ` + values.map(val => `<span class="example">${decodeURIComponent(val)}</span>`).join(' ');
                    // add human-friendly short explanation if available
                    const mapping = params.find(p => p.key === k.replace(/^ns\d+$/,'namespaces') || p.key === k);
                    if (mapping && mapping.desc) {
                        html += `<div style="margin-top:6px;color:var(--secondary-color);">${mapping.desc}</div>`;
                    }
                    html += '</li>';
                }
                html += '</ul>';
            } catch (err) {
                // ignore parsing errors
            }
        } else {
            html += `<p>${getTranslation('params-modal-intro') || 'This panel explains all parameters you can use with Special:Search (the Wikipedia search page). You can paste a Special:Search URL to see a breakdown, or generate one with the form and click here.'}</p>`;
        }

        html += '<div class="params-list">';
        params.forEach(p => {
            html += `<div class="params-param"><h4>${p.title}</h4><p>${p.desc}</p><div class="example">${p.example}</div></div>`;
        });
        html += '</div>';
        return html;
    }
}

export function renderTimeline(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous timeline
    container.innerHTML = '';

    // Filter out results without a modification date
    const resultsWithDates = results.filter(r => r.lastmod);

    if (resultsWithDates.length === 0) {
        container.innerHTML = `<p>${getTranslation('timeline-no-data') || 'No date information available for these results.'}</p>`;
        return;
    }

    // Sort results by modification date (newest first)
    resultsWithDates.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));

    const timelineUl = document.createElement('ul');
    timelineUl.className = 'timeline-list';

    // Group results by year
    const years = {};
    resultsWithDates.forEach(result => {
        const date = new Date(result.lastmod);
        const year = date.getFullYear();
        if (!years[year]) {
            years[year] = [];
        }
        years[year].push(result);
    });

    // Create timeline elements
    for (const year in years) {
        const yearLi = document.createElement('li');
        yearLi.className = 'timeline-year';
        yearLi.innerHTML = `<h4>${year}</h4>`;

        const yearUl = document.createElement('ul');
        yearUl.className = 'timeline-events';

        years[year].forEach(result => {
            const eventLi = document.createElement('li');
            eventLi.className = 'timeline-event';
            const date = new Date(result.lastmod);
            eventLi.innerHTML = `
                <span class="timeline-date">${date.toLocaleDateString()}</span>
                <a href="https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">${result.title}</a>
            `;
            yearUl.appendChild(eventLi);
        });
        yearLi.appendChild(yearUl);
        timelineUl.appendChild(yearLi);
    }

    container.appendChild(timelineUl);
}

let searchMap = null; // Track Leaflet map instance

export async function renderMap(results, mapContainerId) {
    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Filter out results without coordinates
    const resultsWithCoords = results.filter(r => r.coords);

    if (resultsWithCoords.length === 0) {
        container.innerHTML = `<p style="padding: 1rem;">${getTranslation('map-no-data') || 'No geographical information available for these results.'}</p>`;
        return;
    }

    // Lazy Load Leaflet
    if (!window.L) {
        container.innerHTML = '<p>Loading Map...</p>';
        try {
            await loadLeaflet();
        } catch (e) {
            container.innerHTML = `<p>Error loading map: ${e.message}</p>`;
            return;
        }
    }

    // Reset container if it contains a message
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }

    // Initialize map if it doesn't exist
    if (!searchMap) {
        searchMap = L.map(mapContainerId).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(searchMap);
    } else {
        // Clear existing markers
        searchMap.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                searchMap.removeLayer(layer);
            }
        });
    }

    const markers = [];
    resultsWithCoords.forEach(result => {
        const marker = L.marker([result.coords.lat, result.coords.lon])
            .bindPopup(`
                <strong>${result.title}</strong><br>
                <a href="https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">View on Wikipedia</a>
            `);
        marker.addTo(searchMap);
        markers.push(marker);
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        searchMap.fitBounds(group.getBounds().pad(0.1));
    }
}

export async function handleTripFormSubmit(event) {
    event.preventDefault();
    const locationInput = document.getElementById('trip-location-input');
    const location = locationInput?.value.trim();
    if (!location) return;

    const lang = getLanguage();
    const resultsContainer = document.getElementById('trip-results-container');
    const tripInfoList = document.getElementById('trip-info-list');
    const tripHeading = document.getElementById('trip-results-heading');

    if (!resultsContainer || !tripInfoList) return;

    resultsContainer.style.display = 'block';
    tripInfoList.innerHTML = '<div class="skeleton-text skeleton"></div>';
    if (tripHeading) tripHeading.textContent = getTranslation('trip-results-heading', '', { location });

    // Perform search for tourist-relevant topics
    const searchQuery = `${location} tourism attractions history landmarks`;
    const apiResponse = await performWikipediaSearch(searchQuery, lang, 15);
    const results = apiResponse?.query?.search || [];

    if (results.length === 0) {
        tripInfoList.innerHTML = `<p>${getTranslation('no-results-found')}</p>`;
        return;
    }

    // Fetch details
    const titles = results.map(r => r.title);
    const [infoResponse, summariesPages, modificationDatesResponse, coordinatesResponse] = await Promise.all([
        fetchArticlesInfo(titles, lang),
        fetchArticlesSummaries(titles, lang),
        fetchArticleModificationDates(titles, lang),
        fetchArticleCoordinates(titles, lang)
    ]);

    const pagesInfo = infoResponse?.query?.pages || {};
    const modificationDates = modificationDatesResponse || {};
    const coordinates = coordinatesResponse || {};

    const enrichedResults = results.map(result => ({
        ...result,
        lastmod: modificationDates[result.title] || null,
        coords: coordinates[result.title] || null,
        summary: summariesPages[Object.keys(summariesPages).find(id => summariesPages[id].title === result.title)]?.extract || '',
        thumbUrl: pagesInfo[Object.keys(pagesInfo).find(id => pagesInfo[id].title === result.title)]?.thumbnail?.source
    }));

    // Render Info List
    tripInfoList.innerHTML = enrichedResults.map(res => `
        <div class="result-item">
            ${res.thumbUrl ? `<img src="${res.thumbUrl}" class="result-thumbnail" alt="${res.title}">` : '<div class="result-thumbnail" style="display:flex; align-items:center; justify-content:center; background:var(--bg-element); font-size:2rem;">📍</div>'}
            <div class="result-content">
                <a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(res.title)}" target="_blank">
                    <strong>${res.title}</strong>
                </a>
                <p>${res.summary}</p>
            </div>
        </div>
    `).join('');

    // Render Map
    renderMap(enrichedResults, 'trip-map');
}

export function renderCategoryHeatmap(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const categoryCounts = {};
    results.forEach(result => {
        if (result.categories) {
            result.categories.forEach(cat => {
                const title = cat.title.replace(/^Category:/, ''); // Remove prefix
                categoryCounts[title] = (categoryCounts[title] || 0) + 1;
            });
        }
    });

    const entries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        container.innerHTML = `<p>${getTranslation('heatmap-no-data') || 'No category data available for these results.'}</p>`;
        return;
    }

    const maxCount = entries[0][1];
    const cloudDiv = document.createElement('div');
    cloudDiv.className = 'category-cloud';

    entries.slice(0, 30).forEach(([name, count]) => {
        const span = document.createElement('span');
        span.className = 'category-chip';
        const weight = count / maxCount;
        span.style.fontSize = `${0.8 + weight * 1.2}rem`;
        span.style.opacity = 0.5 + weight * 0.5;
        span.textContent = `${name} (${count})`;
        cloudDiv.appendChild(span);
    });

    container.appendChild(cloudDiv);
}

export function renderResultsList(results, containerId, actionsId, headingId, totalHits) {
    const resultsContainer = document.getElementById(containerId);
    const resultsActions = document.getElementById(actionsId);
    const searchResultsHeadingDisplay = document.getElementById(headingId);

    if (!resultsContainer) return;

    if (searchResultsHeadingDisplay) {
        searchResultsHeadingDisplay.textContent = getTranslation('search-results-heading', '', { totalResults: totalHits });
    }

    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = `<li>${getTranslation('no-results-found')}</li>`;
        if (resultsActions) resultsActions.style.display = 'none';
        return;
    }

    if (resultsActions) resultsActions.style.display = 'block';

    results.forEach(result => {
        const listItem = document.createElement('li');
        listItem.className = 'result-item';
        const lang = getLanguage();
        
        // Find thumbnail URL from results if available (enriched already in handleSearchFormSubmit)
        const thumbUrl = result.thumbUrl || null; 

        listItem.innerHTML = `
            ${thumbUrl ? `<img src="${thumbUrl}" class="result-thumbnail" alt="${result.title}">` : '<div class="result-thumbnail" style="display:flex; align-items:center; justify-content:center; background:var(--bg-element); font-size:2rem;">📄</div>'}
            <div class="result-content">
                <a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">
                    <strong>${result.title}</strong>
                </a>
                <p>${result.summary || ''}</p>
                ${result.relevanceScore ? `<small style="display:block; margin-top:0.5rem; color:var(--primary);">Relevance: ${result.relevanceScore} (${result.relevanceConnections} connections)</small>` : ''}
                <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-tertiary drill-down-btn" data-title="${result.title}" data-categories='${btoa(JSON.stringify(result.categories || []))}'>
                        🔍 ${getTranslation('btn-find-similar') || 'Find Similar'}
                    </button>
                    <button class="btn btn-tertiary maintenance-btn" data-title="${result.title}">
                        🛠️ ${getTranslation('btn-maintenance') || 'Wartung'}
                    </button>
                    <div id="global-score-${result.pageid || result.title.replace(/\W/g, '')}" class="global-score-container" style="display:inline-flex;">
                        <button class="btn btn-tertiary global-check-btn" data-title="${result.title}" data-id="global-score-${result.pageid || result.title.replace(/\W/g, '')}" title="Check Global Relevance">
                            🌐
                        </button>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(listItem);
    });

    // Attach event listeners to drill-down buttons
    resultsContainer.querySelectorAll('.drill-down-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.dataset.title;
            const categories = JSON.parse(atob(btn.dataset.categories));
            drillDownSearch(title, categories);
        });
    });

    // Attach event listeners to maintenance buttons
    resultsContainer.querySelectorAll('.maintenance-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openMaintenanceEdit(btn.dataset.title);
        });
    });

    // Attach event listeners to global check buttons
    resultsContainer.querySelectorAll('.global-check-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const title = btn.dataset.title;
            const containerId = btn.dataset.id;
            handleGlobalRelevanceCheck(title, containerId);
        });
    });
}

export function openMaintenanceEdit(title) {
    const modal = document.getElementById('maintenance-modal');
    if (!modal) return; // Should exist in index.html

    // Elements
    const modalTitle = document.getElementById('maintenance-article-title');
    const typeSelect = document.getElementById('maintenance-type');
    const reasonInput = document.getElementById('maintenance-reason');
    const previewCode = document.getElementById('maintenance-preview');
    const form = document.getElementById('maintenance-form');
    const closeBtn = document.getElementById('maintenance-modal-close');
    const cancelBtn = document.getElementById('maintenance-cancel-btn');

    // Reset Form
    modalTitle.textContent = title;
    typeSelect.selectedIndex = 0;
    reasonInput.value = '';
    updatePreview();

    // Show Modal
    modal.setAttribute('aria-hidden', 'false');

    // Live Preview Update
    function updatePreview() {
        const type = typeSelect.value;
        const reason = reasonInput.value.trim();
        let tag = "";

        switch(type) {
            case "sources": tag = `{{Belege fehlen${reason ? '|Begründung=' + reason : ''}}}`; break;
            case "gap": tag = `{{Lückenhaft${reason ? '|Begründung=' + reason : ''}}}`; break;
            case "neutrality": tag = `{{Neutralität${reason ? '|Begründung=' + reason : ''}}}`; break;
            case "delete": tag = `{{Löschen|Begründung=${reason || '...'}}}`; break;
            case "custom": tag = reason ? `{{${reason}}}` : "{{...}}"; break;
        }
        previewCode.textContent = tag;
    }

    typeSelect.onchange = updatePreview;
    reasonInput.oninput = updatePreview;

    // Handle Submit
    form.onsubmit = (e) => {
        e.preventDefault();
        const tag = previewCode.textContent;
        const lang = getLanguage();
        
        // Generate summary based on type
        const typeLabels = {
            sources: "Belege fehlen",
            gap: "Lückenhaft",
            neutrality: "Neutralität",
            delete: "Löschantrag",
            custom: "Wartungsbaustein"
        };
        const summary = `Wartung: ${typeLabels[typeSelect.value] || 'Baustein'} hinzugefügt via WikiGUI`;

        // Direct to visual editor or source editor? Source editor usually safer for prepending.
        const url = `https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=edit&section=0&summary=${encodeURIComponent(summary)}&prependtext=${encodeURIComponent(tag + '\n')}`;
        
        window.open(url, '_blank');
        closeModal();
    };

    // Close Logic
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        // Clean up events to prevent duplicates if function called again
        form.onsubmit = null;
        typeSelect.onchange = null;
        reasonInput.oninput = null;
    }

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
}

export function setupSortByRelevance(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        const hasScores = allSearchResults.some(r => r.relevanceScore);
        if (!hasScores) {
            showToast(getTranslation('alert-analyze-first') || 'Please run Network Analysis first to calculate relevance scores.');
            return;
        }

        allSearchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        
        const currentMode = getSearchMode();
        if (currentMode === 'normal') {
            renderResultsList(
                allSearchResults.slice(0, 10), 
                'simulated-search-results-normal', 
                'results-actions-container-normal', 
                'search-results-heading-normal', 
                allSearchResults.length
            );
        }
    });
}

export function triggerTopicExplorer() {
    // Collect all presets into a flat array
    const allPresets = [];
    for (const catKey in presetCategories) {
        const cat = presetCategories[catKey];
        for (const presetKey in cat.presets) {
            allPresets.push(cat.presets[presetKey]);
        }
    }

    if (allPresets.length === 0) return;

    // Pick a random one
    const randomPreset = allPresets[Math.floor(Math.random() * allPresets.length)];
    
    // Apply it
    applyPreset(randomPreset);
    showToast(getTranslation('toast-surprise-me') || 'Surprise! A random topic has been selected.');
}

export async function performHealthAnalysis(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container || results.length === 0) return;

    container.innerHTML = `<p><em>Analysiere Qualität für ${results.length} Artikel (Deep Scan &lt;ref&gt;)...</em></p>`;
    
    const titles = results.map(r => r.title);
    
    // Parallel fetching of basic metrics and deep ref counts
    const [metrics, refCounts] = await Promise.all([
        fetchQualityMetrics(titles, getLanguage()),
        fetchRefCounts(titles, getLanguage())
    ]);
    
    let totalRefs = 0; // Real <ref> tags
    let totalExtLinks = 0; // External links (often just 'Weelinks')
    let articlesWithImages = 0;

    results.forEach(result => {
        const pageId = Object.keys(metrics).find(id => metrics[id].title === result.title);
        const data = metrics[pageId];
        
        // Count from Deep Scan
        const count = refCounts[result.title] || 0;
        totalRefs += count;

        if (data) {
            totalExtLinks += (data.extlinks ? data.extlinks.length : 0);
            if (data.pageimage || (data.thumbnail)) articlesWithImages++;
        }
    });

    const avgRefs = totalRefs / results.length;
    const avgExtLinks = totalExtLinks / results.length;
    const imageRate = (articlesWithImages / results.length) * 100;
    
    // New Score Logic:
    // 1. References are king. 10 Refs = 100% Subscore.
    const refScore = Math.min((avgRefs / 10) * 100, 100);
    
    // 2. Images are important for UX.
    const imgScore = imageRate; // 0-100

    // Weighted Total Score: 70% Content Verification (Refs), 30% Presentation (Images)
    const score = Math.round((refScore * 0.7) + (imgScore * 0.3));

    const color = score > 80 ? '#22c55e' : (score > 50 ? '#eab308' : '#ef4444');

    container.innerHTML = `
        <div style="padding: 1rem; border-left: 4px solid ${color}; background: rgba(255,255,255,0.02); border-radius: var(--radius); margin-top: 1rem;">
            <h4 style="color: ${color}; margin-bottom: 0.5rem;">Category Health Score: ${score}/100</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                <div>
                    <strong>Belege (<span style="font-family: monospace;">&lt;ref&gt;</span>):</strong><br>
                    Ø ${avgRefs.toFixed(1)} pro Artikel
                </div>
                <div>
                    <strong>Bebilderung:</strong><br>
                    ${imageRate.toFixed(0)}% der Artikel
                </div>
                <div style="grid-column: span 2; margin-top: 0.25rem; font-size: 0.75rem; opacity: 0.7;">
                    (Ø Externe Links gesamt: ${avgExtLinks.toFixed(1)})
                </div>
            </div>
        </div>
    `;

    // Save report to database
    const query = document.getElementById('search-query')?.value || 'N/A';
    saveTestReport({
        query: query,
        driftScore: 0, // Health analysis doesn't calculate drift
        healthScore: score,
        globalScore: 0,
        resultsCount: results.length
    });
}

export async function performGeoValidation(results) {
    const geoResults = results.filter(r => r.coords);
    if (geoResults.length === 0) {
        showToast("Keine Geodaten zum Validieren gefunden.");
        return;
    }

    showToast(`Validierung von ${geoResults.length} Standorten via OSM/Photon...`);

    for (const res of geoResults) {
        const osmName = await validateWithOSM(res.coords.lat, res.coords.lon);
        if (osmName) {
            console.log(`Wiki: ${res.title} -> OSM: ${osmName}`);
            // Check if title words match OSM name
            const wikiWords = res.title.toLowerCase().split(/\s+/);
            const osmWords = osmName.toLowerCase().split(/[,\s]+/);
            const match = wikiWords.some(w => osmWords.includes(w)) || osmWords.some(w => wikiWords.includes(w));
            
            if (!match) {
                showToast(`Warnung: Standort-Abweichung bei "${res.title}"? OSM sagt: ${osmName}`, "warning");
            }
        }
    }
    showToast("Geo-Validierung abgeschlossen.");
}

export async function performInterwikiCheck(results) {
    if (results.length === 0) return; 
    
    showToast(`Sprach-Abgleich für ${results.length} Artikel wird gestartet...`);
    
    const titles = results.map(r => r.title);
    const data = await fetchInterwikiLinks(titles, getLanguage());
    
    let missingInEn = 0;
    let totalFound = 0;

    results.forEach(result => {
        const pageId = Object.keys(data).find(id => data[id].title === result.title);
        const entry = data[pageId];
        
        if (entry) {
            totalFound++;
            const hasEn = entry.langlinks && entry.langlinks.some(ll => ll.lang === 'en');
            if (!hasEn) {
                missingInEn++;
                console.log(`Missing in EN: ${result.title}`);
            }
        }
    });

    const rate = ((totalFound - missingInEn) / totalFound) * 100;
    
    alert(`Interwiki-Check Ergebnis:\n\n` + 
          `Geprüfte Artikel: ${totalFound}\n` + 
          `Davon in EN vorhanden: ${totalFound - missingInEn}\n` + 
          `Fehlend in EN: ${missingInEn}\n\n` + 
          `Globalisierungs-Index: ${rate.toFixed(1)}%`);
}

export async function performDriftAnalysis(results) {
    if (results.length < 3) {
        showToast("Zu wenige Artikel für Drift-Analyse (min. 3).");
        return;
    }

    showToast("Analysiere semantischen Drift (AI Simulation)...");

    const titles = results.map(r => r.title);
    
    // 1. Generate Embeddings (Mock or Real)
    const vectors = await generateEmbeddings(titles);
    
    // 2. Calculate Centroid (The "Main Topic" of this list)
    const centroid = calculateCentroid(vectors);

    // 3. Measure Distance of each article to Centroid
    let outlierCount = 0;
    const outlierThreshold = 0.85; // Similarity below 85% = Drift
    let totalSimilarity = 0;

    const enrichedResults = results.map((res, i) => {
        const similarity = cosineSimilarity(vectors[i], centroid);
        totalSimilarity += similarity;
        const isOutlier = similarity < outlierThreshold;
        if (isOutlier) outlierCount++;
        return { ...res, semanticScore: similarity, isOutlier };
    });

    const avgSimilarity = totalSimilarity / results.length;

    // 4. Visual Feedback
    const container = document.getElementById('simulated-search-results-normal'); 
    if (!container) return; 
    
    const listItems = container.querySelectorAll('li.result-item');
    enrichedResults.forEach((res, index) => {
        if (res.isOutlier) {
            const li = listItems[index];
            if (li) {
                li.style.borderLeft = "4px solid #ef4444";
                li.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
                
                if (!li.querySelector('.drift-warning')) {
                    const badge = document.createElement('div');
                    badge.className = 'drift-warning';
                    badge.style.color = '#ef4444';
                    badge.style.fontSize = '0.75rem';
                    badge.style.marginTop = '0.5rem';
                    badge.innerHTML = `⚠️ <strong>Themen-Drift erkannt!</strong> (Sim: ${(res.semanticScore * 100).toFixed(0)}%)<br>Dieser Artikel passt semantisch evtl. nicht in diese Liste.`;
                    li.querySelector('.result-content').appendChild(badge);
                }
            }
        }
    });

    showToast(`Drift-Analyse fertig: ${outlierCount} potenzielle Ausreißer gefunden.`);

    // Save report to database
    const query = document.getElementById('search-query')?.value || 'N/A';
    saveTestReport({
        query: query,
        driftScore: avgSimilarity,
        healthScore: 0, // Drift analysis doesn't calculate health
        globalScore: 0,
        resultsCount: results.length
    });
}

async function handleGlobalRelevanceCheck(title, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<span class="loading-spinner">⏳</span>'; // Simple loading state

    try {
        const results = await analyzeGlobalRelevance([title], getLanguage());
        const data = results[title];

        if (!data) {
            container.innerHTML = '<span title="Daten nicht verfügbar">❌</span>';
            return;
        }

        // Color coding for score
        let color = '#94a3b8'; // Grey
        if (data.score > 70) color = '#22c55e'; // Green
        else if (data.score > 40) color = '#eab308'; // Yellow
        else if (data.score < 20) color = '#ef4444'; // Red

        // Create Badge
        container.innerHTML = `
            <span class="global-badge" style="
                background: ${color}20; 
                color: ${color};
                border: 1px solid ${color};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: bold;
                cursor: help;"
                title="Global Score: ${data.score}/100\nSprachen: ${data.totalLanguages}\nEnthält Englisch: ${data.hasEnglish ? 'Ja' : 'Nein'}">
                Global: ${data.score}
            </span>
        `;
    } catch (e) {
        console.error("Global check failed", e);
        container.innerHTML = '<span title="Fehler bei Prüfung">⚠️</span>';
    }
}

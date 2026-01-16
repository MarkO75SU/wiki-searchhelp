// src/js/modules/ui.js
import { getTranslation, getLanguage, getSearchMode } from './state.js';
import { generateSearchString } from './search.js';
import { performWikipediaSearch, fetchArticleSummary, fetchArticlesInfo, fetchArticlesSummaries } from './api.js';
import { presetCategories } from './presets.js';
import { addJournalEntry } from './journal.js';
import { showToast } from './toast.js';

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

    // Fetch images and summaries for top 10 results at once
    const titles = topResults.map(r => r.title);
    const [infoResponse, summariesPages] = await Promise.all([
        fetchArticlesInfo(titles, lang),
        fetchArticlesSummaries(titles, lang)
    ]);
    
    const pagesInfo = infoResponse?.query?.pages || {};

    for (const result of topResults) {
        // Find summary
        const summaryPageId = Object.keys(summariesPages).find(id => summariesPages[id].title === result.title);
        const summary = summariesPages[summaryPageId]?.extract || getTranslation('no-summary-available', 'Keine Zusammenfassung verfügbar.');
        
        // Find thumbnail
        const pageId = Object.keys(pagesInfo).find(id => pagesInfo[id].title === result.title);
        const thumbUrl = pagesInfo[pageId]?.thumbnail?.source;

        const listItem = document.createElement('li');
        listItem.className = 'result-item';
        listItem.innerHTML = `
            ${thumbUrl ? `<img src="${thumbUrl}" class="result-thumbnail" alt="${result.title}">` : '<div class="result-thumbnail" style="display:flex; align-items:center; justify-content:center; background:var(--slate-100); color:var(--slate-400); font-size:2rem;">📄</div>'}
            <div class="result-content">
                <a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">
                    <strong>${result.title}</strong>
                </a>
                <p>${summary}</p>
            </div>
        `;
        resultsContainer.appendChild(listItem);
    }

    // Save to journal AFTER rendering to ensure clean flow
    const targetUrl = `https://${lang}.wikipedia.org/wiki/Special:Search?${wikiSearchUrlParams}`;
    addJournalEntry(apiQuery, targetUrl, shareParams); 
    showToast(getTranslation('toast-search-complete') || 'Suche abgeschlossen.');
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
    // Setup for normal search results
    const filterInputNormal = document.getElementById('result-filter-input-normal');
    const resultsListNormal = document.getElementById('simulated-search-results-normal');
    if (filterInputNormal && resultsListNormal) {
        filterInputNormal.addEventListener('input', () => {
            const filterText = filterInputNormal.value.toLowerCase();
            const listItems = resultsListNormal.children;
            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                const textContent = item.textContent ? item.textContent.toLowerCase() : '';
                if (textContent.includes(filterText)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    // Setup for network search results (original IDs)
    const filterInputNetwork = document.getElementById('result-filter-input');
    const resultsListNetwork = document.getElementById('simulated-search-results');
    if (filterInputNetwork && resultsListNetwork) {
        filterInputNetwork.addEventListener('input', () => {
            const filterText = filterInputNetwork.value.toLowerCase();
            const listItems = resultsListNetwork.children;
            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                const textContent = item.textContent ? item.textContent.toLowerCase() : '';
                if (textContent.includes(filterText)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });
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

// src/js/main.js
import { setLanguage, setTranslations, getLanguage, getTranslation, setSearchMode, getSearchMode } from './core/state.js';
import { applyTranslations, clearForm, handleSearchFormSubmit, addAccordionFunctionality, populatePresetCategories, populatePresets, applyPreset as applyPresetToForm, downloadResults, getAllSearchResults, setupResultFilter, handleTripFormSubmit, renderResultsList, setupSortByRelevance, exportCitations, triggerTopicExplorer, performHealthAnalysis, performGeoValidation, performInterwikiCheck, performDriftAnalysis } from './ui/handlers.js';
import { generateSearchString } from './core/search.js';
import { presetCategories } from './config/presets.js';
import { renderJournal, clearJournal, deleteSelectedEntries, exportJournal, importJournal, syncJournalToGist } from './core/journal.js';
import { setupCategoryAutocomplete } from './ui/autocomplete.js';
import { performNetworkAnalysis, exportNetworkAsJSON } from './core/network.js';
import { showToast } from './ui/toast.js';
import { loadHeader } from './ui/headerLoader.js';
import { initializeCookieBanner } from './ui/cookie.js';
import { fetchJson } from './services/wiki_service.js';
import { getCurrentPosition } from './core/utils.js';
import { supabase } from './services/database.js';

const SAVE_STATE_KEY = 'wikiGuiFormState';

async function updateUserStatusBadge() {
    const badge = document.getElementById('user-status-badge');
    if (!badge) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            badge.textContent = `User: ${session.user.email.split('@')[0]}`;
            badge.style.display = 'inline-flex';
            badge.title = `Logged in as ${session.user.email}`;
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error('Error updating user status badge:', err);
        badge.style.display = 'none';
    }
}

function saveFormState() {
    const form = document.getElementById('search-form');
    if (!form) return;

    const state = {};
    form.querySelectorAll('input, select, textarea').forEach(element => {
        if (element.id) {
            if (element.type === 'checkbox') {
                state[element.id] = element.checked;
            } else {
                state[element.id] = element.value;
            }
        }
    });
    sessionStorage.setItem(SAVE_STATE_KEY, JSON.stringify(state));
}

function loadFormState() {
    const savedState = sessionStorage.getItem(SAVE_STATE_KEY);
    if (!savedState) return;

    const state = JSON.parse(savedState);
    const form = document.getElementById('search-form');
    if (!form) return;

    for (const id in state) {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = state[id];
            } else {
                element.value = state[id];
            }
        }
    }
}

async function initializeApp() {
    await loadHeader('header-placeholder', 'src/html/header.html');
    initializeCookieBanner();
    const initialLang = getLanguage();
    document.documentElement.lang = initialLang;

    updateUserStatusBadge();
    addAccordionFunctionality();
    renderJournal();
    loadFormState();
    setupSearchModeTabs();

    document.getElementById('delete-selected-btn')?.addEventListener('click', deleteSelectedEntries);
    document.getElementById('export-json-button')?.addEventListener('click', () => exportJournal('json'));
    document.getElementById('export-csv-button')?.addEventListener('click', () => exportJournal('csv'));

    const importBtn = document.getElementById('import-journal-button');
    const fileInput = document.getElementById('journal-file-input');
    importBtn?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            importJournal(file);
        }
    });
    document.getElementById('export-gist-button')?.addEventListener('click', syncJournalToGist);
    document.getElementById('surprise-me-button')?.addEventListener('click', triggerTopicExplorer);

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value === 'true';
            } else {
                element.value = value;
            }
        }
    });

    setupCategoryAutocomplete(document.getElementById('incategory-value'));

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    document.querySelectorAll('.lang-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const lang = event.target.dataset.lang;
            if (!lang) return;
            setLanguage(lang);
            clearForm();
            
            const targetWikiLangSelect = document.getElementById('target-wiki-lang');
            if (targetWikiLangSelect) {
                targetWikiLangSelect.value = lang;
            }

            try {
                const data = await fetchJson(`translations/${lang}.json?v=${Date.now()}`);
                if (!data) return;
                setTranslations(lang, data);
                applyTranslations();
                generateSearchString();
            } catch (error) {
                console.error(`Could not fetch translations for ${lang}:`, error);
            }
        });
    });

    const dateAfter = document.getElementById('dateafter-value');
    const dateBefore = document.getElementById('datebefore-value');
    const validateDates = () => {
        if (dateAfter.value && dateBefore.value && dateAfter.value > dateBefore.value) {
            showToast(getTranslation('alert-date-invalid') || 'Das Startdatum darf nicht nach dem Enddatum liegen.');
            dateAfter.value = '';
        }
    };
    dateAfter?.addEventListener('change', validateDates);
    dateBefore?.addEventListener('change', validateDates);

    const getLocationBtn = document.getElementById('get-location-btn');
    const geoCoordInput = document.getElementById('geo-coord');
    getLocationBtn?.addEventListener('click', async () => {
        try {
            const pos = await getCurrentPosition();
            geoCoordInput.value = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
            generateSearchString();
        } catch (err) {
            alert('Standort konnte nicht ermittelt werden.');
            console.error(err);
        }
    });

    const tripForm = document.getElementById('trip-search-form');
    if (tripForm) {
        tripForm.addEventListener('submit', handleTripFormSubmit);
    }
    const getTripLocationBtn = document.getElementById('get-trip-location-btn');
    const tripLocationInput = document.getElementById('trip-location-input');
    getTripLocationBtn?.addEventListener('click', async () => {
        try {
            const pos = await getCurrentPosition();
            if (tripLocationInput) {
                tripLocationInput.value = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
            }
        } catch (err) {
            alert('Standort konnte nicht ermittelt werden.');
            console.error(err);
        }
    });
    document.getElementById('trip-clear-button')?.addEventListener('click', () => {
        if (tripForm) tripForm.reset();
        document.getElementById('trip-results-container').style.display = 'none';
    });

    const downloadResultsBtn = document.getElementById('download-results-button');
    if (downloadResultsBtn) {
        downloadResultsBtn.addEventListener('click', downloadResults);
    }
    const downloadResultsBtnNormal = document.getElementById('download-results-button-normal');
    if (downloadResultsBtnNormal) {
        downloadResultsBtnNormal.addEventListener('click', downloadResults);
    }

    document.getElementById('export-bibtex-button-normal')?.addEventListener('click', () => exportCitations('bibtex'));
    document.getElementById('export-ris-button-normal')?.addEventListener('click', () => exportCitations('ris'));
    document.getElementById('export-bibtex-button')?.addEventListener('click', () => exportCitations('bibtex'));
    document.getElementById('export-ris-button')?.addEventListener('click', () => exportCitations('ris'));

    const analyzeNetworkBtn = document.getElementById('analyze-network-button');
    analyzeNetworkBtn?.addEventListener('click', async () => {
        const results = getAllSearchResults();
        const nodes = await performNetworkAnalysis(results);
        if (nodes) {
            const allResults = getAllSearchResults();
            allResults.forEach(r => {
                const node = nodes.find(n => n.title === r.title);
                if (node) {
                    r.relevanceScore = node.strength;
                    r.relevanceConnections = node.connections;
                }
            });
            renderResultsList(allResults.slice(0, 10), 'simulated-search-results', 'results-actions-container', 'search-results-heading', allResults.length);
        }
    });
    const analyzeNetworkBtnNormal = document.getElementById('analyze-network-button-normal');
    analyzeNetworkBtnNormal?.addEventListener('click', async () => {
        const results = getAllSearchResults();
        const nodes = await performNetworkAnalysis(results);
        if (nodes) {
            const allResults = getAllSearchResults();
            allResults.forEach(r => {
                const node = nodes.find(n => n.title === r.title);
                if (node) {
                    r.relevanceScore = node.strength;
                    r.relevanceConnections = node.connections;
                }
            });
            renderResultsList(allResults.slice(0, 10), 'simulated-search-results-normal', 'results-actions-container-normal', 'search-results-heading-normal', allResults.length);
        }
    });

    setupSortByRelevance('sort-relevance-button-normal');
    setupSortByRelevance('sort-relevance-button');

    document.getElementById('analyze-health-button-normal')?.addEventListener('click', () => {
        performHealthAnalysis(getAllSearchResults(), 'health-score-container-normal');
    });
    document.getElementById('analyze-health-button')?.addEventListener('click', () => {
        performHealthAnalysis(getAllSearchResults(), 'health-score-container');
    });
    document.getElementById('validate-geo-button-normal')?.addEventListener('click', () => {
        performGeoValidation(getAllSearchResults());
    });
    document.getElementById('validate-geo-button')?.addEventListener('click', () => {
        performGeoValidation(getAllSearchResults());
    });
    document.getElementById('interwiki-check-button-normal')?.addEventListener('click', () => {
        performInterwikiCheck(getAllSearchResults());
    });
    document.getElementById('interwiki-check-button')?.addEventListener('click', () => {
        performInterwikiCheck(getAllSearchResults());
    });
    document.getElementById('analyze-drift-button-normal')?.addEventListener('click', () => {
        performDriftAnalysis(getAllSearchResults());
    });

    const exportNetworkBtn = document.getElementById('export-network-button');
    exportNetworkBtn?.addEventListener('click', exportNetworkAsJSON);

    const searchForm = document.getElementById('search-form');
    if (searchForm) { searchForm.addEventListener('submit', handleSearchFormSubmit); }
    
    const clearJournalBtn = document.getElementById('clear-journal-btn');
    if (clearJournalBtn) { clearJournalBtn.addEventListener('click', clearJournal); }

    const clearFormBtn = document.getElementById('clear-form-button');
    if (clearFormBtn) { clearFormBtn.addEventListener('click', () => {
        clearForm();
        generateSearchString();
    }); }

    if (searchForm) {
        searchForm.addEventListener('input', () => {
            generateSearchString();
            saveFormState();
        });
    }
    const dateafterInput = document.getElementById('dateafter-value');
    if (dateafterInput) { dateafterInput.addEventListener('change', () => { generateSearchString(); saveFormState(); }); }
    const datebeforeInput = document.getElementById('datebefore-value');
    if (datebeforeInput) { datebeforeInput.addEventListener('change', () => { generateSearchString(); saveFormState(); }); }
    const targetLangSelectForCopy = document.getElementById('target-wiki-lang');
    if(targetLangSelectForCopy) {
        targetLangSelectForCopy.addEventListener('change', () => { generateSearchString(); saveFormState(); });
    }

    const generatedSearchStringDisplay = document.getElementById('generated-search-string-display');
    const copyUrlButton = document.getElementById('copy-url-button');
    if (copyUrlButton && generatedSearchStringDisplay) {
        copyUrlButton.addEventListener('click', async () => {
            const textToCopy = generatedSearchStringDisplay.value;
            if (!textToCopy || textToCopy === getTranslation('generated-string-placeholder')) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                copyUrlButton.classList.add('copied');
                const originalTitle = copyUrlButton.title;
                copyUrlButton.title = getTranslation('copy-success-title');
                setTimeout(() => {
                    copyUrlButton.classList.remove('copied');
                    copyUrlButton.title = originalTitle;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    }

    try {
        const data = await fetchJson(`translations/${initialLang}.json?v=${Date.now()}`);
        if (!data) throw new Error('No translation data loaded');
        setTranslations(initialLang, data);
        applyTranslations();
        setupResultFilter();
        generateSearchString();
    } catch (error) {
        console.error(`Could not fetch initial translations for ${initialLang}:`, error);
    }
}

function setupSearchModeTabs() {
    const tabButtons = document.querySelectorAll('.btn-tab');
    const normalSearchArea = document.getElementById('normal-search-area');
    const networkSearchArea = document.getElementById('network-search-area');
    const tripSearchArea = document.getElementById('trip-search-area');
    const searchInterface = document.querySelector('.search-interface');

    const initialMode = getSearchMode();
    if (searchInterface) {
        searchInterface.classList.add(`search-mode-${initialMode}`);
    }

    normalSearchArea.style.display = initialMode === 'normal' ? 'block' : 'none';
    networkSearchArea.style.display = initialMode === 'network' ? 'block' : 'none';
    tripSearchArea.style.display = initialMode === 'trip' ? 'block' : 'none';

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            setSearchMode(mode);
            tabButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            if (searchInterface) {
                searchInterface.classList.remove('search-mode-normal', 'search-mode-network', 'search-mode-trip');
                searchInterface.classList.add(`search-mode-${mode}`);
            }
            normalSearchArea.style.display = mode === 'normal' ? 'block' : 'none';
            networkSearchArea.style.display = mode === 'network' ? 'block' : 'none';
            tripSearchArea.style.display = mode === 'trip' ? 'block' : 'none';
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);

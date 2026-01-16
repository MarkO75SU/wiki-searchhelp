// src/js/main.js
import { setLanguage, setTranslations, getLanguage, getTranslation, setSearchMode, getSearchMode } from './modules/state.js';
import { applyTranslations, clearForm, handleSearchFormSubmit, addAccordionFunctionality, populatePresetCategories, populatePresets, applyPreset as applyPresetToForm, downloadResults, getAllSearchResults, setupResultFilter } from './modules/ui.js';
import { generateSearchString } from './modules/search.js';
import { presetCategories } from './modules/presets.js';
import { renderJournal, clearJournal, deleteSelectedEntries, exportJournal } from './modules/journal.js';
import { setupCategoryAutocomplete } from './modules/autocomplete.js';
import { performNetworkAnalysis, exportNetworkAsJSON } from './modules/network.js';
import { showToast } from './modules/toast.js';
import { loadHeader } from './modules/headerLoader.js'; // Added headerLoader import
import { initializeCookieBanner } from './modules/cookie.js';
import { fetchJson } from './modules/api.js';
import { getCurrentPosition } from './modules/utils.js';

const SAVE_STATE_KEY = 'wikiGuiFormState';

function saveFormState() {
    const form = document.getElementById('search-form');
    if (!form) return;

    const state = {};
    form.querySelectorAll('input, select, textarea').forEach(element => {
        if (element.id) { // Only save elements with an ID
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
    await loadHeader('header-placeholder', 'src/html/header.html'); // AWAIT the header load
    initializeCookieBanner();
    const initialLang = getLanguage();
    document.documentElement.lang = initialLang;

    addAccordionFunctionality();
    renderJournal();

    // Load saved form state from sessionStorage
    loadFormState();

    // Setup Search Mode Tabs
    setupSearchModeTabs();

    // Journal Actions
    document.getElementById('delete-selected-btn')?.addEventListener('click', deleteSelectedEntries);
    document.getElementById('export-json-button')?.addEventListener('click', () => exportJournal('json'));
    document.getElementById('export-csv-button')?.addEventListener('click', () => exportJournal('csv'));

    // Fill form from URL params (Shareable URL)
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

    // Setup Autocomplete
    setupCategoryAutocomplete(document.getElementById('incategory-value'));

    // Mobile Menu Toggle - Re-attach after header is loaded
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    // Language buttons - Re-attach after header is loaded
    document.querySelectorAll('.lang-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const lang = event.target.dataset.lang;
            if (!lang) return;
            setLanguage(lang);
            clearForm(); // Clear all fields on language switch
            
            // Explicitly set the target wiki language to match the UI language
            const targetWikiLangSelect = document.getElementById('target-wiki-lang');
            if (targetWikiLangSelect) {
                targetWikiLangSelect.value = lang;
            }

            try {
                const data = await fetchJson(`translations/${lang}.json?v=${Date.now()}`);
                if (!data) return;
                setTranslations(lang, data);
                applyTranslations();
                updateAdvancedModeDescription(); // Update description on language change
                generateSearchString(); // Update generated string for new language context
            } catch (error) {
                console.error(`Could not fetch translations for ${lang}:`, error);
            }
        });
    });

    // Date Validation
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

    // Geo Location Logic
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

    const downloadResultsBtn = document.getElementById('download-results-button'); // Network tab's download
    if (downloadResultsBtn) {
        downloadResultsBtn.addEventListener('click', downloadResults);
    }
    const downloadResultsBtnNormal = document.getElementById('download-results-button-normal'); // Normal tab's download
    if (downloadResultsBtnNormal) {
        downloadResultsBtnNormal.addEventListener('click', downloadResults);
    }

    const analyzeNetworkBtn = document.getElementById('analyze-network-button'); // Network tab's analyze
    analyzeNetworkBtn?.addEventListener('click', () => {
        const results = getAllSearchResults();
        performNetworkAnalysis(results);
    });
    const analyzeNetworkBtnNormal = document.getElementById('analyze-network-button-normal'); // Normal tab's analyze
    analyzeNetworkBtnNormal?.addEventListener('click', () => {
        const results = getAllSearchResults();
        performNetworkAnalysis(results);
    });

    const exportNetworkBtn = document.getElementById('export-network-button');
    exportNetworkBtn?.addEventListener('click', exportNetworkAsJSON);

    // Advanced mode toggle
    const advancedToggle = document.getElementById('advanced-mode-toggle');
    const searchFormContainer = document.querySelector('.search-form-container');
    const advancedModeDescription = document.getElementById('advanced-mode-description');
    const modeToggleContainer = document.querySelector('.mode-toggle-container'); // Get modeToggleContainer

    function updateAdvancedModeDescription() {
        if (!advancedToggle || !advancedModeDescription) return;

        const labelAdvancedMode = document.getElementById('label-advanced-mode');
        if (labelAdvancedMode) {
             labelAdvancedMode.textContent = getTranslation('label-advanced-mode');
        }

        if (advancedToggle.checked) {
            advancedModeDescription.textContent = getTranslation('advanced-mode-advanced-active');
        } else {
            const simpleActive = getTranslation('advanced-mode-simple-active');
            const hint = getTranslation('advanced-mode-hint');
            advancedModeDescription.textContent = simpleActive ? `${simpleActive} ${hint}` : hint;
        }
    }

    if (advancedToggle && searchFormContainer && advancedModeDescription && modeToggleContainer) { // Add modeToggleContainer to check
        advancedToggle.addEventListener('change', () => {
            if (advancedToggle.checked) {
                searchFormContainer.classList.add('advanced-view');
                modeToggleContainer.classList.add('advanced-mode-active'); // Add class
            } else {
                searchFormContainer.classList.remove('advanced-view');
                modeToggleContainer.classList.remove('advanced-mode-active'); // Remove class
            }
            updateAdvancedModeDescription();
        });
        updateAdvancedModeDescription(); // Initial call
        // Also update the class on initial load based on checkbox state
        if (advancedToggle.checked) {
            modeToggleContainer.classList.add('advanced-mode-active');
        } else {
            modeToggleContainer.classList.remove('advanced-mode-active');
        }
    }

    // New Preset Logic Setup
    const presetCategorySelect = document.getElementById('preset-category-select');
    const presetSelect = document.getElementById('preset-select');
    const applyPresetButton = document.getElementById('apply-preset-button');

    if (presetCategorySelect && presetSelect && applyPresetButton) {
        // Initial population and event listeners for presets
        presetCategorySelect.addEventListener('change', () => {
            populatePresets(presetCategorySelect, presetSelect);
            if (presetSelect.options.length > 1) {
                presetSelect.selectedIndex = 1;
                applyPresetButton.disabled = false;
            } else {
                applyPresetButton.disabled = true;
            }
            generateSearchString(); // Update query after category change and default preset selection
        });

        presetSelect.addEventListener('change', () => {
            if (presetSelect.value) {
                applyPresetButton.disabled = false;
            } else {
                applyPresetButton.disabled = true;
            }
            generateSearchString(); // Update query after preset selection
        });

        applyPresetButton.addEventListener('click', () => {
            const selectedCategory = presetCategorySelect.value;
            const selectedPreset = presetSelect.value;
            const presetToApply = presetCategories[selectedCategory]?.presets[selectedPreset];
            if (selectedCategory && selectedPreset && presetToApply) {
                applyPresetToForm(presetToApply);
            }
        });
    }

    // Event listeners for main form elements
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

    // Initial language fetch and UI update
    try {
        const data = await fetchJson(`translations/${initialLang}.json?v=${Date.now()}`);
        if (!data) throw new Error('No translation data loaded');
        setTranslations(initialLang, data);
        applyTranslations(); // Apply initial translations to all elements
        setupResultFilter(); // Initialize result filter functionality

        // Populate presets for the first time
        if (presetCategorySelect && presetSelect) {
            // Select the first category by default if available
            if (presetCategorySelect.options.length > 1) {
                presetCategorySelect.selectedIndex = 1; // Select the first actual category
                populatePresets(presetCategorySelect, presetSelect); // Populate presets for the selected category
            }
            // Select the first preset by default if available and enable button
            if (presetSelect.options.length > 1) {
                presetSelect.selectedIndex = 1; // Select the first actual preset
                applyPresetButton.disabled = false;
            }
        }
        generateSearchString(); // Generate string after everything else is set up
        updateAdvancedModeDescription(); // Initial call for description

    } catch (error) {
        console.error(`Could not fetch initial translations for ${initialLang}:`, error);
    }

}

function setupSearchModeTabs() {
    const tabButtons = document.querySelectorAll('.btn-tab'); // Updated selector
    const normalSearchArea = document.getElementById('normal-search-area');
    const networkSearchArea = document.getElementById('network-search-area');
    const searchInterface = document.querySelector('.search-interface');

    const initialMode = getSearchMode();
    if (searchInterface) {
        searchInterface.classList.add(`search-mode-${initialMode}`);
    }

    // Show correct area on init
    if (initialMode === 'normal') {
        normalSearchArea.style.display = 'block';
        networkSearchArea.style.display = 'none';
    } else {
        normalSearchArea.style.display = 'none';
        networkSearchArea.style.display = 'block';
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            setSearchMode(mode);

            // Update active tab
            tabButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            // Update area visibility
            if (searchInterface) {
                searchInterface.classList.remove('search-mode-normal', 'search-mode-network');
                searchInterface.classList.add(`search-mode-${mode}`);
            }

            // Show correct area
            if (mode === 'normal') {
                normalSearchArea.style.display = 'block';
                networkSearchArea.style.display = 'none';
            } else {
                normalSearchArea.style.display = 'none';
                networkSearchArea.style.display = 'block';
            }

            // No clearForm() or generateSearchString() here, state is persisted
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
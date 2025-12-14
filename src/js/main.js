// src/js/main.js
import { setLanguage, setTranslations, getLanguage } from './modules/state.js';
import { applyTranslations, clearForm, handleSearchFormSubmit, addAccordionFunctionality, populatePresetCategories, applyPreset as applyPresetToForm } from './modules/ui.js';
import { generateSearchString } from './modules/search.js';
import { saveCurrentSearch, loadSavedSearches, handleSavedSearchActions } from './modules/storage.js';
import { presetCategories } from './modules/presets.js';

async function initializeApp() {
    const initialLang = getLanguage();
    document.documentElement.lang = initialLang;

    try {
        const response = await fetch(`translations/${initialLang}.json`);
        const data = await response.json();
        setTranslations(initialLang, data);
        applyTranslations();
    } catch (error) {
        console.error(`Could not fetch initial translations for ${initialLang}:`, error);
    }

    addAccordionFunctionality();
    generateSearchString();
    loadSavedSearches();

    const advancedToggle = document.getElementById('advanced-mode-toggle');
    const searchFormContainer = document.querySelector('.search-form-container');
    advancedToggle.addEventListener('change', () => {
        if (advancedToggle.checked) {
            searchFormContainer.classList.add('advanced-view');
        } else {
            searchFormContainer.classList.remove('advanced-view');
        }
    });

    // New Preset Logic Setup
    const presetCategorySelect = document.getElementById('preset-category-select');
    const presetSelect = document.getElementById('preset-select');
    const applyPresetButton = document.getElementById('apply-preset-button');

    populatePresetCategories(presetCategorySelect, presetSelect);

    presetCategorySelect.addEventListener('change', () => {
        populatePresets(presetCategorySelect, presetSelect);
    });

    applyPresetButton.addEventListener('click', () => {
        const selectedCategory = presetCategorySelect.value;
        const selectedPreset = presetSelect.value;
        if (selectedCategory && selectedPreset && presetCategories[selectedCategory] && presetCategories[selectedCategory].presets[selectedPreset]) {
            applyPresetToForm(presetCategories[selectedCategory].presets[selectedPreset]);
        }
    });
    // End New Preset Logic

    document.getElementById('search-form').addEventListener('submit', handleSearchFormSubmit);
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('save-search-button').addEventListener('click', saveCurrentSearch);
    document.getElementById('saved-searches-list').addEventListener('click', handleSavedSearchActions);

    document.querySelectorAll('.lang-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const lang = event.target.dataset.lang;
            setLanguage(lang);
            try {
                const response = await fetch(`translations/${lang}.json`);
                const data = await response.json();
                setTranslations(lang, data);
                applyTranslations();
                populatePresetCategories(presetCategorySelect, presetSelect); // Re-populate presets on lang change
            } catch (error) {
                console.error(`Could not fetch translations for ${lang}:`, error);
            }
        });
    });

    document.getElementById('search-form').addEventListener('input', generateSearchString);

    // Watch for changes in date inputs to update search string
    document.getElementById('dateafter-value').addEventListener('change', generateSearchString);
    document.getElementById('datebefore-value').addEventListener('change', generateSearchString);
}

document.addEventListener('DOMContentLoaded', initializeApp);

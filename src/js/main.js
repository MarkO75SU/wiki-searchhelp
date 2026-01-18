// src/js/main.js
import { setLanguage, setTranslations, getLanguage, getTranslation, setSearchMode, getSearchMode } from './core/state.js';
import { applyTranslations, clearForm, handleSearchFormSubmit, addAccordionFunctionality, populatePresetCategories, populatePresets, applyPreset as applyPresetToForm, downloadResults, getAllSearchResults, setupResultFilter, handleTripFormSubmit, renderResultsList, setupSortByRelevance, exportCitations, triggerTopicExplorer, performHealthAnalysis, performGeoValidation, performInterwikiCheck, performDriftAnalysis } from './ui/handlers.js';
import { generateSearchString } from './core/search.js';
import { flow } from './core/flow_manager.js';
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
            badge.textContent = `Editor: ${session.user.email.split('@')[0]}`;
            badge.style.display = 'inline-flex';
            document.getElementById('login-btn').textContent = 'Logout';
        } else {
            badge.style.display = 'none';
            document.getElementById('login-btn').textContent = 'Login';
        }
    } catch (err) {
        badge.style.display = 'none';
    }
}

async function initializeApp() {
    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('[PWA] ServiceWorker registered'))
                .catch(err => console.warn('[PWA] ServiceWorker failed', err));
        });
    }

    await loadHeader('header-placeholder', 'src/html/header.html');
    initializeCookieBanner();
    
    // 2. Flow & State Initialization
    const initialLang = getLanguage();
    document.documentElement.lang = initialLang;
    updateUserStatusBadge();
    flow.updateUI(); // Set initial phase visibility

    addAccordionFunctionality();
    renderJournal();
    setupCategoryAutocomplete(document.getElementById('search-query'));

    // 3. Event Listeners
    document.getElementById('login-btn')?.addEventListener('click', () => {
        // Toggle Login Modal Logic
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex';
    });

    document.getElementById('search-form')?.addEventListener('submit', async (e) => {
        await handleSearchFormSubmit(e);
        flow.navigateTo('phase-analysis');
    });

    document.getElementById('delete-selected-btn')?.addEventListener('click', deleteSelectedEntries);
    document.getElementById('export-json-button')?.addEventListener('click', () => exportJournal('json'));
    document.getElementById('export-csv-button')?.addEventListener('click', () => exportJournal('csv'));
    document.getElementById('surprise-me-button')?.addEventListener('click', triggerTopicExplorer);

    // Initial Translation Load
    try {
        const data = await fetchJson(`translations/${initialLang}.json?v=${Date.now()}`);
        if (data) {
            setTranslations(initialLang, data);
            applyTranslations();
        }
    } catch (error) {
        console.error('Translation load error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
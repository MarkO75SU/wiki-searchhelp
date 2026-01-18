/**
 * main.js - Suite Entry Point
 */
import { state, setLanguage, setTranslations, FLOW_PHASES, USER_TIERS } from './core/state.js';
import { flow } from './core/flow_manager.js';
import { handleSearchFormSubmit, setupGlobalHandlers, applyTranslations } from './ui/handlers.js';
import { showToast } from './ui/toast.js';

async function initApp() {
    console.log("WikiGUI Suite 2026 Initializing...");

    // 1. Load Translations
    try {
        const lang = state.currentLang;
        const response = await fetch(`translations/${lang}.json`);
        const translations = await response.json();
        setTranslations(lang, translations);
        applyTranslations();
    } catch (e) {
        console.error("Failed to load translations:", e);
    }

    // 2. Setup UI Handlers
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchFormSubmit);
    }

    // Initialize the new global interactions (Toggles, Mode-Tabs)
    setupGlobalHandlers();

    // 3. Flow & Tier Setup
    flow.init();
    document.body.className = `tier-${state.userTier}`;

    // 4. Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log("SW failed:", err));
        });
    }

    console.log("WikiGUI Suite Ready.");
}

document.addEventListener('DOMContentLoaded', initApp);

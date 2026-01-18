/**
 * src/js/core/state.js
 * Central State Management for WikiGUI Enterprise
 */

const STORAGE_KEYS = {
    LANG: 'wikiGuiLanguage',
    MODE: 'wikiGuiSearchMode',
    TIER: 'wikiGuiUserTier',
    PHASE: 'wikiGuiCurrentPhase'
};

const USER_TIERS = {
    FREE: 'free',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
};

const FLOW_PHASES = {
    SEARCH: 'phase-search',
    ANALYSIS: 'phase-analysis',
    EDITOR: 'phase-editor'
};

const getSaved = (key, fallback) => localStorage.getItem(key) || fallback;

const state = {
    currentLang: getSaved(STORAGE_KEYS.LANG, 'de'),
    translations: {},
    searchMode: getSaved(STORAGE_KEYS.MODE, 'normal'),
    userTier: getSaved(STORAGE_KEYS.TIER, USER_TIERS.FREE),
    currentPhase: FLOW_PHASES.SEARCH,
    analysisResults: null,
    activeArticle: null
};

export function setLanguage(lang) {
    if (!['de', 'en'].includes(lang)) return;
    state.currentLang = lang;
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
}

export function getLanguage() { return state.currentLang; }

// Search Mode Management
export function setSearchMode(mode) {
    state.searchMode = mode;
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
}

export function getSearchMode() {
    return state.searchMode || 'normal';
}

export function setTranslations(lang, data) { state.translations[lang] = data; }

export function getTranslation(key, defaultValue = '', replacements = {}) {
    let str = (state.translations[state.currentLang] && state.translations[state.currentLang][key]) || defaultValue || key;
    for (const p in replacements) {
        str = str.replace(new RegExp(`{\s*${p}\s*}`, 'g'), replacements[p]);
    }
    return str;
}

export function setTier(tier) {
    if (Object.values(USER_TIERS).includes(tier)) {
        state.userTier = tier;
        localStorage.setItem(STORAGE_KEYS.TIER, tier);
    }
}

export function getTier() { return state.userTier; }

export function setPhase(phase) {
    if (Object.values(FLOW_PHASES).includes(phase)) {
        state.currentPhase = phase;
    }
}

export function getPhase() { return state.currentPhase; }

export function setAnalysisResults(results) { state.analysisResults = results; }
export function getAnalysisResults() { return state.analysisResults; }

export function setActiveArticle(article) { state.activeArticle = article; }
export function getActiveArticle() { return state.activeArticle; }

export { USER_TIERS, FLOW_PHASES };
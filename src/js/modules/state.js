// src/js/modules/state.js

const LANGUAGE_STORAGE_KEY = 'wikiGuiLanguage';
const SEARCH_MODE_KEY = 'wikiGuiSearchMode';

const getInitialLang = () => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['de', 'en'].includes(saved)) return saved;
    return 'de';
};

const getInitialSearchMode = () => {
    const saved = localStorage.getItem(SEARCH_MODE_KEY);
    if (saved && ['normal', 'network', 'trip'].includes(saved)) return saved;
    return 'normal';
};

const state = {
    currentLang: getInitialLang(),
    translations: {},
    searchMode: getInitialSearchMode(),
    normalSearchState: {},
    networkSearchState: {
        targetWikiLang: 'de',
        query: ''
    },
    tripSearchState: {
        location: ''
    }
};

export function setLanguage(lang) {
    if (!['de', 'en'].includes(lang)) return;
    state.currentLang = lang;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function getLanguage() {
    return state.currentLang || 'de';
}

export function setTranslations(lang, data) {
    state.translations[lang] = data;
}

export function getTranslation(key, defaultValue = '', replacements = {}) {
    if (!key) {
        console.warn("getTranslation called without key");
        return defaultValue;
    }
    let translatedString = defaultValue;
    if (state.translations[state.currentLang] && state.translations[state.currentLang][key]) {
        translatedString = state.translations[state.currentLang][key];
    } else {
        // console.log(`Missing translation for key: ${key} in lang: ${state.currentLang}`);
    }

    for (const placeholder in replacements) {
        const regex = new RegExp(`{\\s*${placeholder}\\s*}`, 'g');
        translatedString = translatedString.replace(regex, replacements[placeholder]);
    }

    return translatedString;
}

// Search Mode Management
export function setSearchMode(mode) {
    if (!['normal', 'network', 'trip'].includes(mode)) return;
    state.searchMode = mode;
    localStorage.setItem(SEARCH_MODE_KEY, mode);
}

export function getSearchMode() {
    return state.searchMode || 'normal';
}

export function setNormalSearchState(data) {
    state.normalSearchState = { ...state.normalSearchState, ...data };
}

export function getNormalSearchState() {
    return state.normalSearchState;
}

export function setNetworkSearchState(data) {
    state.networkSearchState = { ...state.networkSearchState, ...data };
}

export function getNetworkSearchState() {
    return state.networkSearchState;
}

export function getActiveSearchState() {
    return state.searchMode === 'network' ? state.networkSearchState : state.normalSearchState;
}

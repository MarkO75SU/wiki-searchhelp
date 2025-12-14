// src/js/modules/state.js

const state = {
    currentLang: 'de',
    translations: {}
};

export function setLanguage(lang) {
    state.currentLang = lang;
}

export function getLanguage() {
    return state.currentLang;
}

export function setTranslations(lang, data) {
    state.translations[lang] = data;
}

export function getTranslation(key, defaultValue = '', replacements = {}) {
    let translatedString = defaultValue;
    if (state.translations[state.currentLang] && state.translations[state.currentLang][key]) {
        translatedString = state.translations[state.currentLang][key];
    }

    for (const placeholder in replacements) {
        const regex = new RegExp(`{\s*${placeholder}\s*}`, 'g');
        translatedString = translatedString.replace(regex, replacements[placeholder]);
    }

    return translatedString;
}

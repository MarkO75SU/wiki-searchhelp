/**
 * src/js/config/constants.js
 * Centralized Enterprise Configuration
 */

export const DRIFT_CONFIG = {
    THRESHOLD: 0.85,
    MIN_ARTICLES: 3,
    OUTLIER_COLOR: '#ef4444',
    OUTLIER_BG: 'rgba(239, 68, 68, 0.05)'
};

export const HEALTH_CONFIG = {
    REF_TARGET: 10, // Average refs per article for 100% score
    WEIGHT_REFS: 0.7,
    WEIGHT_IMAGES: 0.3,
    COLORS: {
        HIGH: '#22c55e',
        MID: '#eab308',
        LOW: '#ef4444'
    }
};

export const INTERWIKI_CONFIG = {
    KEY_LANGUAGES: ['en', 'fr', 'es', 'zh', 'ru', 'ja'],
    RELEVANCE_TARGET: 50, // 50 languages = base 100%
    COLORS: {
        HIGH: '#22c55e',
        MID: '#eab308',
        LOW: '#ef4444',
        DEFAULT: '#94a3b8'
    }
};

export const API_CONFIG = {
    WIKI_HELP_URLS: {
        'de': 'https://de.wikipedia.org/wiki/Hilfe:Suche',
        'en': 'https://en.wikipedia.org/wiki/Help:Searching',
        'fr': 'https://fr.wikipedia.org/wiki/Aide:Recherche',
        'es': 'https://es.wikipedia.org/wiki/Ayuda:Búsqueda'
    },
    BATCH_SIZE: 50,
    THUMBNAIL_SIZE: 150
};

export const PERSISTENCE_CONFIG = {
    OFFLINE_QUEUE_KEY: 'wiki_gui_offline_logs',
    LOCAL_CACHE_PREFIX: 'wiki_cache_'
};

/**
 * src/js/services/wiki_service.js
 * Optimized Wikipedia API Wrapper
 */

import { API_CONFIG } from '../config/constants.js';

export async function fetchWikiData(lang, params) {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const queryParams = new URLSearchParams({ format: 'json', origin: '*', ...params });
    
    const response = await fetch(`${endpoint}?${queryParams}`);
    if (!response.ok) throw new Error(`Wiki API Status: ${response.status}`);
    return await response.json();
}

export async function performWikipediaSearch(query, lang, limit = 500) {
    return await fetchWikiData(lang, {
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: limit,
        prop: 'pageimages',
        piprop: 'thumbnail',
        pithumbsize: API_CONFIG.THUMBNAIL_SIZE
    });
}

/**
 * Batch-Fetches metadata for multiple articles.
 */
export async function fetchBatchedMetadata(titles, lang, props = 'pageimages|extracts|revisions|coordinates|categories') {
    const batchSize = API_CONFIG.BATCH_SIZE;
    const results = {};

    for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);
        const data = await fetchWikiData(lang, {
            action: 'query',
            titles: batch.join('|'),
            prop: props,
            // Add specific prop settings here if needed
            exlimit: batch.length,
            clshow: '!hidden'
        });
        if (data?.query?.pages) Object.assign(results, data.query.pages);
    }
    return results;
}

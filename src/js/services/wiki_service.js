/**
 * src/js/services/wiki_service.js
 * Optimized Wikipedia and Wikidata API Wrapper
 */

import { API_CONFIG } from '../config/constants.js';

export async function fetchWikiData(lang, params) {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const queryParams = new URLSearchParams({ format: 'json', origin: '*', ...params });
    
    const response = await fetch(`${endpoint}?${queryParams}`);
    if (!response.ok) throw new Error(`Wiki API Status: ${response.status}`);
    return await response.json();
}

/**
 * Fetches Wikitext for Deep-Scan Citation Radar
 */
export async function fetchArticleWikitext(title, lang) {
    const data = await fetchWikiData(lang, {
        action: 'query',
        prop: 'revisions',
        titles: title,
        rvprop: 'content',
        rvslots: 'main'
    });
    const page = Object.values(data.query.pages)[0];
    return page.revisions?.[0]?.slots?.main?.['*'] || '';
}

/**
 * Wikidata Entity Lookup for Interwiki Gaps
 */
export async function fetchWikidataEntity(title, lang) {
    // 1. Get QID from Wikipedia
    const data = await fetchWikiData(lang, {
        action: 'query',
        prop: 'pageprops',
        titles: title,
        ppprop: 'wikibase_item'
    });
    const page = Object.values(data.query.pages)[0];
    const qid = page.pageprops?.wikibase_item;
    if (!qid) return null;

    // 2. Fetch Entity from Wikidata
    const wbResponse = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&format=json&origin=*`);
    const wbData = await wbResponse.json();
    return wbData.entities[qid];
}

/**
 * Verifies Wikipedia Editor Status
 */
export async function fetchUserEditCount(username, lang = 'de') {
    const data = await fetchWikiData(lang, {
        action: 'query',
        list: 'users',
        ususers: username,
        usprop: 'editcount|groups'
    });
    return data.query.users[0]?.editcount || 0;
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

export async function fetchBatchedMetadata(titles, lang, props = 'pageimages|extracts|revisions|coordinates|categories') {
    const batchSize = API_CONFIG.BATCH_SIZE;
    const results = {};

    for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);
        const data = await fetchWikiData(lang, {
            action: 'query',
            titles: batch.join('|'),
            prop: props,
            exlimit: batch.length,
            clshow: '!hidden'
        });
        if (data?.query?.pages) Object.assign(results, data.query.pages);
    }
    return results;
}
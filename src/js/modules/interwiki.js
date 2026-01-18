/**
 * src/js/modules/interwiki.js
 * 
 * Module for Interwiki Conflict Detector & Global Relevance Analysis.
 * Checks if articles exist in other major languages to assess their global significance
 * and identify structural gaps (e.g. category exists in EN but not DE).
 */

import { fetchWikiData } from './api.js';

/**
 * Key languages to check for Global Relevance Score.
 */
const KEY_LANGUAGES = ['en', 'fr', 'es', 'zh', 'ru', 'ja'];

/**
 * Analyzes the global presence of a list of articles.
 * @param {string[]} titles - List of article titles in the source language.
 * @param {string} sourceLang - The source language code (e.g., 'de').
 * @returns {Promise<Object>} Map of title -> AnalysisResult
 */
export async function analyzeGlobalRelevance(titles, sourceLang = 'de') {
    console.log(`[Interwiki] Analyzing global relevance for ${titles.length} articles...`);
    
    // 1. Fetch Langlinks
    const langLinksMap = await fetchLangLinksBatch(titles, sourceLang);
    
    const results = {};

    for (const title of titles) {
        const links = langLinksMap[title] || [];
        const langCodes = links.map(l => l.lang);
        
        // 2. Calculate Metrics
        const totalLanguages = langCodes.length;
        const missingKeyLangs = KEY_LANGUAGES.filter(lang => 
            lang !== sourceLang && !langCodes.includes(lang)
        );
        
        // Simple Relevance Score (0-100)
        // Base: log scale of total languages (50 langs ~ 100%)
        // Penalty: missing key languages
        let score = Math.min((Math.log(totalLanguages + 1) / Math.log(50)) * 100, 100);
        
        // Boost if EN is present (as it's the largest)
        if (langCodes.includes('en')) score += 10;
        
        // Cap at 100
        score = Math.min(score, 100);

        results[title] = {
            totalLanguages,
            missingKeyLangs,
            score: Math.round(score),
            hasEnglish: langCodes.includes('en'),
            langLinks: links // full data if needed
        };
    }

    return results;
}

/**
 * Fetches language links for a batch of titles.
 * Uses 'lllimit' to get max links.
 */
async function fetchLangLinksBatch(titles, lang) {
    const batchSize = 50;
    const results = {};

    for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);
        
        const data = await fetchWikiData(lang, {
            action: 'query',
            titles: batch.join('|'),
            prop: 'langlinks',
            lllimit: 'max', // max allowed (usually 500 for normal users)
            llprop: 'url|langname|autonym'
        });

        if (data && data.query && data.query.pages) {
            for (const pageId in data.query.pages) {
                const page = data.query.pages[pageId];
                results[page.title] = page.langlinks || [];
            }
        }
    }

    return results;
}

/**
 * Checks for Category structural conflicts.
 * (Draft for Roadmap item: Interwiki-Conflict-Detector)
 * 
 * TODO: Implement Wikidata logic to compare category trees.
 * Currently returns a placeholder structure.
 */
export async function checkCategoryStructure(categoryTitle, sourceLang) {
    // This would require Wikidata API calls to find the "Q-Item" of the category
    // and then fetch linked categories in other languages.
    return {
        warning: "Deep Wikidata analysis not yet implemented.",
        category: categoryTitle
    };
}

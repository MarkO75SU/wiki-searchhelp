/**
 * src/js/core/analysis.js
 * Advanced Business Logic for Quality & Conflict Detection
 */

import { DRIFT_CONFIG, HEALTH_CONFIG, INTERWIKI_CONFIG } from '../config/constants.js';
import { fetchWikidataEntity } from '../services/wiki_service.js';

export function calculateHealthScore(results, metrics, refCounts) {
    let totalRefs = 0;
    let articlesWithImages = 0;

    results.forEach(result => {
        const pageId = Object.keys(metrics).find(id => metrics[id].title === result.title);
        const data = metrics[pageId];
        totalRefs += (refCounts[result.title] || 0);
        if (data && (data.pageimage || data.thumbnail)) articlesWithImages++;
    });

    const avgRefs = totalRefs / results.length;
    const imageRate = (articlesWithImages / results.length) * 100;
    const refScore = Math.min((avgRefs / HEALTH_CONFIG.REF_TARGET) * 100, 100);
    const score = Math.round((refScore * HEALTH_CONFIG.WEIGHT_REFS) + (imageRate * HEALTH_CONFIG.WEIGHT_IMAGES));

    return { score, avgRefs, imageRate };
}

/**
 * Wikidata Conflict Detection:
 * Compares current category entity with counterparts in EN/FR
 */
export async function detectInterwikiConflicts(title, lang) {
    const entity = await fetchWikidataEntity(title, lang);
    if (!entity) return null;

    const sitelinks = entity.sitelinks || {};
    const enTitle = sitelinks.enwiki?.title;
    const frTitle = sitelinks.frwiki?.title;

    return {
        qid: entity.id,
        availableLanguages: Object.keys(sitelinks).length,
        missingMajor: !enTitle || !frTitle,
        enTitle,
        frTitle
    };
}

export function identifyDriftOutliers(results, vectors, centroid, similarityFn) {
    let totalSimilarity = 0;
    const analyzed = results.map((res, i) => {
        const similarity = similarityFn(vectors[i], centroid);
        totalSimilarity += similarity;
        const isOutlier = similarity < DRIFT_CONFIG.THRESHOLD;
        return { ...res, semanticScore: similarity, isOutlier };
    });

    return {
        analyzed,
        avgSimilarity: totalSimilarity / results.length,
        outlierCount: analyzed.filter(a => a.isOutlier).length
    };
}

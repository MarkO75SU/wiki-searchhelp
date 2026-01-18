/**
 * src/js/core/analysis.js
 * Pure Business Logic for Quality Analysis
 */

import { DRIFT_CONFIG, HEALTH_CONFIG, INTERWIKI_CONFIG } from '../config/constants.js';

/**
 * Calculates category health based on references and images.
 */
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
 * Identifies semantic outliers in a set of vectors.
 * Note: Helpers like cosineSimilarity are imported in the service layer.
 */
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
/**
 * src/js/services/ai_service.js
 * Enterprise AI Service with Circuit Breaker & Backoff
 */

import { supabase } from './database.js';

let circuitBrokenUntil = 0;
const QUOTA_STATS = { success: 0, failed: 0 };

/**
 * Resilient wrapper for Edge Functions
 */
async function callAIWithResilience(payload, retries = 3, delay = 1000) {
    if (Date.now() < circuitBrokenUntil) {
        console.warn('[AI_SERVICE] Circuit Breaker active. Using emergency fallback.');
        return null; // Triggers fallback
    }

    try {
        const { data, error } = await supabase.functions.invoke('get-embeddings', { body: payload });

        if (error) {
            if (error.status === 429) {
                circuitBrokenUntil = Date.now() + 30000; // Break for 30s
                throw new Error('Rate limit exceeded');
            }
            throw error;
        }

        QUOTA_STATS.success++;
        return data;

    } catch (err) {
        if (retries > 0) {
            console.log(`[AI_SERVICE] Retry ${4-retries} in ${delay}ms...`);
            await new Promise(r => setTimeout(resolve, delay));
            return callAIWithResilience(payload, retries - 1, delay * 2);
        }
        
        QUOTA_STATS.failed++;
        console.error('[AI_SERVICE] Max retries reached:', err.message);
        return null;
    }
}

export async function generateEmbeddings(texts) {
    const data = await callAIWithResilience({ texts });
    
    // Fallback if AI fails or Circuit is broken
    if (!data || !data.embeddings) {
        return texts.map(() => generateMockVector());
    }

    return data.embeddings;
}

/**
 * Emergency Fallback Vector Generator
 */
function generateMockVector() {
    return Array.from({length: 768}, () => Math.random());
}

export function getQuotaStats() { return QUOTA_STATS; }

/**
 * Cosine Similarity (Logic layer moved to core, but helper kept here for API data)
 */
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || !vecA.length) return 0;
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return magA === 0 || magB === 0 ? 0 : dotProduct / (magA * magB);
}

export function calculateCentroid(vectors) {
    if (!vectors.length) return [];
    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);
    vectors.forEach(v => v.forEach((val, i) => centroid[i] += val));
    return centroid.map(v => v / vectors.length);
}

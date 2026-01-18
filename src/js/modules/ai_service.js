/**
 * src/js/modules/ai_service.js
 * 
 * Real AI Service using Supabase Edge Functions (proxying Google Gemini).
 * This keeps the API key secure on the server side.
 */

import { supabase } from './database.js';

/**
 * Generates embeddings for a list of texts using Supabase Edge Function.
 * @param {string[]} texts - Array of article titles or summaries.
 * @returns {Promise<Array<number[]>>} List of embedding vectors.
 */
export async function generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];

    console.log(`[AI_SERVICE] Generating embeddings for ${texts.length} items via Supabase Edge Function...`);
    
    try {
        const { data, error } = await supabase.functions.invoke('get-embeddings', {
            body: { texts }
        });

        if (error) throw error;

        return data.embeddings || [];

    } catch (error) {
        console.error("[AI_SERVICE] Error generating embeddings:", error);
        // Return empty arrays on error to prevent crash
        return texts.map(() => []); 
    }
}

/**
 * Calculates the Cosine Similarity between two vectors.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Similarity score (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

/**
 * Calculates the centroid (average vector) of a group of vectors.
 * @param {Array<number[]>} vectors 
 * @returns {number[]} The centroid vector
 */
export function calculateCentroid(vectors) {
    const validVectors = vectors.filter(v => v && v.length > 0);
    if (validVectors.length === 0) return [];
    
    const dim = validVectors[0].length;
    const centroid = new Array(dim).fill(0);

    for (const vec of validVectors) {
        for (let i = 0; i < dim; i++) {
            centroid[i] += vec[i];
        }
    }

    return centroid.map(val => val / validVectors.length);
}

/**
 * src/js/modules/ai_service.js
 * 
 * Real AI Service using Google Gemini API.
 * Replaces the ai_mock.js for generating semantic embeddings.
 */

import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';
import { CONFIG } from './config.js';

// Initialize the API
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

/**
 * Generates embeddings for a list of texts using Google Gemini.
 * @param {string[]} texts - Array of article titles or summaries.
 * @returns {Promise<Array<number[]>>} List of embedding vectors.
 */
export async function generateEmbeddings(texts) {
    if (!CONFIG.GEMINI_API_KEY) {
        console.error("Gemini API Key is missing!");
        return [];
    }

    console.log(`[AI_SERVICE] Generating embeddings for ${texts.length} items via Gemini...`);
    
    try {
        // The API supports batch embedding, but we should be careful with limits.
        const promises = texts.map(async (text) => {
            const result = await model.embedContent(text);
            return result.embedding.values;
        });

        const vectors = await Promise.all(promises);
        return vectors;

    } catch (error) {
        console.error("[AI_SERVICE] Error generating embeddings:", error);
        // Return empty arrays on error to prevent crash
        return texts.map(() => []); 
    }
}

/**
 * Calculates the Cosine Similarity between two vectors.
 * Essential for the Drift Detector.
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
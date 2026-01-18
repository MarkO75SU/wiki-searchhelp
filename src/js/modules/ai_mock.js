/**
 * src/js/modules/ai_mock.js
 * 
 * Mocks an AI Provider (like Google Gemini or OpenAI) for Semantic Analysis.
 * This allows testing the "Drift Detector" without active API credentials.
 * 
 * Logic:
 * It assigns semi-deterministic vectors based on keywords in the text.
 * This simulates "Semantic Clusters" so we can test if the UI correctly
 * identifies outliers (Drift).
 */

/**
 * Simulates an API call to generate embeddings for a list of texts.
 * @param {string[]} texts - Array of article titles or summaries.
 * @returns {Promise<Array<number[]>>} List of embedding vectors.
 */
export async function generateEmbeddings(texts) {
    console.log(`[AI_MOCK] Generating embeddings for ${texts.length} items...`);
    
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 600));

    return texts.map(text => {
        return getMockVector(text);
    });
}

/**
 * Generates a mock vector based on keywords.
 * Dimensions: 4 (simplified for easy debugging)
 * [Science, History, Art, Random/Drift]
 */
function getMockVector(text) {
    const t = text.toLowerCase();
    let vector = [0.1, 0.1, 0.1, 0.1]; // Default noise

    // 1. Science Cluster (High value in dim 0)
    if (t.match(/physik|science|chemie|atom|space|natur|biologie|math|tech/)) {
        vector = [0.9, 0.1, 0.05, 0.05];
    } 
    // 2. History/Society Cluster (High value in dim 1)
    else if (t.match(/geschichte|history|krieg|politik|staat|king|war|society|law/)) {
        vector = [0.1, 0.9, 0.05, 0.05];
    }
    // 3. Art/Culture Cluster (High value in dim 2)
    else if (t.match(/kunst|art|musik|kultur|film|literatur|buch|paint/)) {
        vector = [0.05, 0.05, 0.9, 0.1];
    }
    // 4. Potential "Drift" / Outliers (High value in dim 3)
    else {
        // Random drift for unknown topics
        vector = [0.2, 0.2, 0.2, 0.8];
    }

    // Add random noise so vectors aren't identical (realism)
    return vector.map(v => Math.min(1.0, v + (Math.random() * 0.1 - 0.05)));
}

/**
 * Calculates the Cosine Similarity between two vectors.
 * Essential for the Drift Detector.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Similarity score (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
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
    if (vectors.length === 0) return [];
    
    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);

    for (const vec of vectors) {
        for (let i = 0; i < dim; i++) {
            centroid[i] += vec[i];
        }
    }

    return centroid.map(val => val / vectors.length);
}

import { AIMock } from './ai_mock.js';

export const DriftDetector = {
    async analyzeResults(articles) {
        if (articles.length < 3) return articles;

        // 1. Embeddings für alle Artikel generieren
        const embeddings = await Promise.all(
            articles.map(a => AIMock.generateEmbedding(a.title + " " + a.snippet))
        );

        // 2. Centroid (Durchschnitts-Vektor) berechnen
        const dimension = embeddings[0].length;
        const centroid = new Array(dimension).fill(0);
        embeddings.forEach(vec => {
            vec.forEach((val, i) => centroid[i] += val / embeddings.length);
        });

        // 3. Abweichung für jeden Artikel prüfen
        return articles.map((article, i) => {
            const similarity = AIMock.calculateSimilarity(embeddings[i], centroid);
            return {
                ...article,
                semanticScore: similarity,
                isOutlier: similarity < 0.7 // Drift-Limit: 30%
            };
        });
    }
};
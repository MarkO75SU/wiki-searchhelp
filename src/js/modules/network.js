// src/js/modules/network.js
import { getLanguage } from './state.js';

export async function performNetworkAnalysis(articles) {
    const container = document.getElementById('network-analysis-container');
    const canvas = document.getElementById('network-canvas');
    if (!container || !canvas || !articles.length) return;

    container.style.display = 'block';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fetch categories for all articles
    const lang = getLanguage();
    const titles = articles.map(a => a.title);
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}&prop=categories&cllimit=20`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query.pages;
        
        // Map articles to their categories
        const articleData = articles.map(article => {
            const pageId = Object.keys(pages).find(id => pages[id].title === article.title);
            const categories = pages[pageId]?.categories?.map(c => c.title) || [];
            return {
                title: article.title,
                categories: categories,
                connections: 0,
                x: 100 + Math.random() * (canvas.width - 200),
                y: 50 + Math.random() * (canvas.height - 100)
            };
        });

        // Calculate connections (Shared Categories)
        const edges = [];
        for (let i = 0; i < articleData.length; i++) {
            for (let j = i + 1; j < articleData.length; j++) {
                const shared = articleData[i].categories.filter(cat => 
                    articleData[j].categories.includes(cat)
                );
                
                if (shared.length > 0) {
                    articleData[i].connections++;
                    articleData[j].connections++;
                    edges.push({ from: articleData[i], to: articleData[j], strength: shared.length });
                }
            }
        }

        // Draw Edges (Connections)
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)'; // Primary accent color
        edges.forEach(edge => {
            ctx.lineWidth = Math.min(edge.strength, 5); // Thicker lines for more shared categories
            ctx.beginPath();
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
            ctx.stroke();
        });

        // Draw Nodes
        articleData.forEach(node => {
            // Node size based on number of connections (minimum 5px, plus connections)
            const radius = 6 + (node.connections * 3);
            
            // Outer Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#2563eb';
            
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow for text
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            
            // Shorten label if too long
            const label = node.title.length > 15 ? node.title.slice(0, 12) + '...' : node.title;
            ctx.fillText(label, node.x, node.y + radius + 15);
            
            // Connection Count Badge
            if (node.connections > 0) {
                ctx.fillStyle = '#0ea5e9';
                ctx.font = '9px sans-serif';
                ctx.fillText(node.connections, node.x, node.y + 3);
            }
        });

    } catch (err) {
        console.error('Network analysis error:', err);
    }
}
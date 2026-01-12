// src/js/modules/network.js
import { getLanguage } from './state.js';

export async function performNetworkAnalysis(articles) {
    const container = document.getElementById('network-analysis-container');
    const canvas = document.getElementById('network-canvas');
    if (!container || !canvas || !articles.length) return;

    container.style.display = 'block';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fetch categories for all articles to find commonalities
    const lang = getLanguage();
    const titles = articles.map(a => a.title).join('|');
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(titles)}&prop=categories&cllimit=50`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query.pages;
        
        // Build nodes and edges
        const nodes = articles.map((a, i) => ({ 
            id: a.title, 
            x: 100 + Math.random() * 600, 
            y: 50 + Math.random() * 300, 
            label: a.title.slice(0, 15) + '...' 
        }));

        // Draw Nodes
        ctx.fillStyle = '#2563eb';
        ctx.textAlign = 'center';
        ctx.font = '10px sans-serif';

        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText(node.label, node.x, node.y + 15);
            ctx.fillStyle = '#2563eb';
        });

        // Simple relationship logic (e.g., share a category)
        // This is a placeholder for a more complex linking logic
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (Math.random() > 0.7) { // Placeholder connection
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

    } catch (err) {
        console.error('Network analysis error:', err);
    }
}

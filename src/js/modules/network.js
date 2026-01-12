// src/js/modules/network.js
import { getLanguage } from './state.js';

export async function performNetworkAnalysis(articles) {
    const container = document.getElementById('network-analysis-container');
    const canvas = document.getElementById('network-canvas');
    if (!container || !canvas || !articles.length) return;

    container.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    // Auflösung verbessern
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr;
    canvas.height = 500 * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lang = getLanguage();
    const titles = articles.map(a => a.title);
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}&prop=categories&cllimit=100`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query.pages;
        
        // 1. Daten aufbereiten
        const nodes = articles.map((article, i) => {
            const pageId = Object.keys(pages).find(id => pages[id].title === article.title);
            const categories = pages[pageId]?.categories?.map(c => c.title) || [];
            
            // Platzierung im Kreis für maximale Übersicht
            const angle = (i / articles.length) * Math.PI * 2;
            const radiusLayout = 150;
            return {
                title: article.title,
                categories: categories,
                x: 400 + Math.cos(angle) * radiusLayout,
                y: 250 + Math.sin(angle) * radiusLayout,
                totalStrength: 0,
                connectionCount: 0
            };
        });

        // 2. Verbindungen berechnen (Edges)
        const edges = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const shared = nodes[i].categories.filter(cat => nodes[j].categories.includes(cat));
                
                // Fallback: Schlagwort-Treffer im Titel (falls keine Kategorien gematcht werden)
                const wordsI = nodes[i].title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                const wordsJ = nodes[j].title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                const sharedWords = wordsI.filter(w => wordsJ.includes(w));

                const strength = shared.length + (sharedWords.length * 2);

                if (strength > 0) {
                    nodes[i].totalStrength += strength;
                    nodes[j].totalStrength += strength;
                    nodes[i].connectionCount++;
                    nodes[j].connectionCount++;
                    edges.push({ from: nodes[i], to: nodes[j], strength });
                }
            }
        }

        // 3. Zeichnen: Zuerst die Linien (hinter den Knoten)
        edges.forEach(edge => {
            // Farbe basierend auf Stärke (von Blau zu Gold)
            const hue = Math.min(200 + (edge.strength * 10), 260); 
            const opacity = 0.2 + Math.min(edge.strength * 0.1, 0.6);
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
            ctx.lineWidth = Math.min(edge.strength, 8); // Dicke spiegelt Häufigkeit wider
            
            ctx.beginPath();
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
            ctx.stroke();
        });

        // 4. Zeichnen: Die Knotenpunkte
        nodes.forEach(node => {
            // Größe basiert auf der Summe aller Verbindungs-Stärken
            const radius = 8 + Math.min(node.totalStrength * 1.5, 30);
            
            // Schatten/Glow Effekt
            ctx.shadowBlur = 10;
            ctx.shadowColor = node.totalStrength > 5 ? '#f59e0b' : '#2563eb';
            
            // Kreis zeichnen
            ctx.fillStyle = node.totalStrength > 0 ? '#2563eb' : '#64748b';
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Text-Label
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            const shortTitle = node.title.length > 15 ? node.title.slice(0, 13) + '..' : node.title;
            ctx.fillText(shortTitle, node.x, node.y + radius + 15);

            // Stärke-Indikator im Kreis
            if (node.totalStrength > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = '9px sans-serif';
                ctx.fillText(Math.round(node.totalStrength), node.x, node.y + 3);
            }
        });

    } catch (err) {
        console.error('Network analysis error:', err);
    }
}

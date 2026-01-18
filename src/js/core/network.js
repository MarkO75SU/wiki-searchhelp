// src/js/core/network.js
import { getLanguage, getTranslation } from './state.js';
import { fetchArticlesCategories } from '../services/api.js';

let lastAnalysisData = { nodes: [], edges: [] };

const VIZ_CONFIG = {
    canvasHeight: 600, // Reduced height for better fit
    nodeBaseRadius: 5,
    maxNodeExtraRadius: 15,
    repulsion: 2000,   // Force pushing nodes apart
    springLength: 100, // Ideal length of connections
    friction: 0.9,     // Movement dampening
    gravity: 0.05      // Pull towards center
};

export function exportNetworkAsJSON() {
    if (!lastAnalysisData.nodes.length) return;
    
    const data = JSON.stringify(lastAnalysisData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wiki-network-analysis-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function performNetworkAnalysis(allArticles) {
    const container = document.getElementById('network-analysis-container');
    const canvas = document.getElementById('network-canvas');
    const exportBtn = document.getElementById('export-network-button');
    const explanationEl = document.getElementById('network-explanation');
    const networkSection = document.getElementById('network-graph-section');
    const contentContainer = document.getElementById('content-network-graph-section'); // Ensure ID matches
    
    if (!container || !canvas || !allArticles.length) return;

    // Limit nodes for performance and clarity
    const depthSelect = document.getElementById('network-depth-select');
    const articleLimit = depthSelect ? parseInt(depthSelect.value) : 50;
    const articles = allArticles.slice(0, articleLimit);

    container.style.display = 'block';
    
    // Auto-expand
    if (networkSection && contentContainer) {
        networkSection.classList.add('active');
        contentContainer.style.display = 'block';
    }
    
    if (exportBtn) exportBtn.style.display = 'none';
    
    // Progress Bar Logic
    if (explanationEl) explanationEl.innerHTML = `<p><em>${getTranslation('network-loading', 'Analyse läuft...') }</em></p>`;
    const progressBar = document.getElementById('network-progress-bar');
    if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.value = 0;
    }

    try {
        const lang = getLanguage();
        // Fetch categories with progress update
        const pages = await fetchArticlesCategories(articles.map(a => a.title), lang, (current, total) => {
            if (explanationEl) {
                explanationEl.innerHTML = `<p><em>${getTranslation('network-loading-progress', 'Lade Daten...', { current, total })}</em></p>`;
            }
            if (progressBar) {
                progressBar.value = (current / total) * 100;
            }
        });

        if (progressBar) progressBar.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'inline-block';

        const nodes = prepareNodes(articles, pages);
        const edges = calculateEdges(nodes);
        
        // Filter nodes: Keep only those with connections OR top 20 by strength if disconnected
        // This cleans up "lonely" nodes that make the graph messy
        let visualNodes = nodes.filter(n => n.connectionCount > 0);
        if (visualNodes.length < 10) {
             // Fallback: Add some unconnected ones if graph is too empty
             const disconnected = nodes.filter(n => n.connectionCount === 0).sort((a,b) => b.totalStrength - a.totalStrength).slice(0, 10);
             visualNodes = [...visualNodes, ...disconnected];
        }

        // Run Force Simulation
        runForceSimulation(visualNodes, edges, canvas.getBoundingClientRect().width, VIZ_CONFIG.canvasHeight);
        
        // Draw
        drawNetwork(canvas, visualNodes, edges);

        lastAnalysisData = { 
            timestamp: new Date().toISOString(),
            query: document.getElementById('search-query')?.value || 'N/A',
            resultsCount: articles.length,
            nodes: nodes.map(n => ({ title: n.title, strength: n.totalStrength, connections: n.connectionCount, categories: n.categories })),
            edges: edges.map(e => ({ from: e.from.title, to: e.to.title, strength: e.strength }))
        };

        updateNetworkExplanation(nodes, edges, visualNodes);

        return nodes; // For smart sorting

    } catch (err) {
        console.error('Network analysis error:', err);
        if (explanationEl) explanationEl.textContent = "Fehler bei der Analyse.";
        return null;
    }
}

function prepareNodes(articles, pages) {
    return articles.map(article => {
        const pageId = Object.keys(pages).find(id => pages[id].title === article.title);
        const categories = pages[pageId]?.categories?.map(c => c.title) || [];
        return {
            title: article.title,
            categories: categories,
            totalStrength: 0,
            connectionCount: 0,
            x: Math.random() * 800, // Initial random pos
            y: Math.random() * 600,
            vx: 0,
            vy: 0
        };
    });
}

function calculateEdges(nodes) {
    const edges = [];
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
        const nodeI = nodes[i];
        const wordsI = nodeI.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        for (let j = i + 1; j < n; j++) {
            const nodeJ = nodes[j];
            
            // Connection Metric 1: Shared Categories
            const sharedCats = nodeI.categories.filter(cat => nodeJ.categories.includes(cat));
            
            // Connection Metric 2: Title Word Overlap (Simple Semantic Check)
            const wordsJ = nodeJ.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            const sharedWords = wordsI.filter(w => wordsJ.includes(w));

            const strength = sharedCats.length + (sharedWords.length * 2);

            if (strength > 0) {
                nodeI.totalStrength += strength;
                nodeJ.totalStrength += strength;
                nodeI.connectionCount++;
                nodeJ.connectionCount++;
                edges.push({ 
                    from: nodeI, 
                    to: nodeJ, 
                    strength,
                    sharedCategories: sharedCats.map(c => c.replace(/^Kategorie:/i, '').replace(/^Category:/i, '')),
                    sharedKeywords: sharedWords
                });
            }
        }
    }
    return edges;
}

/**
 * A simple Force-Directed Graph Layout algorithm.
 * Runs iterating physics simulation to position nodes.
 */
function runForceSimulation(nodes, edges, width, height) {
    const iterations = 150; // Number of physics steps
    const center = { x: width / 2, y: height / 2 };

    for (let k = 0; k < iterations; k++) {
        // 1. Repulsion (Nodes push apart)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                
                // Force formula
                const force = VIZ_CONFIG.repulsion / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                nodeA.vx -= fx;
                nodeA.vy -= fy;
                nodeB.vx += fx;
                nodeB.vy += fy;
            }
        }

        // 2. Attraction (Edges pull together)
        for (const edge of edges) {
            // Only calc if both nodes are in the visual set
            if (!nodes.includes(edge.from) || !nodes.includes(edge.to)) continue;

            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Spring force
            const force = (dist - VIZ_CONFIG.springLength) * 0.05; // Spring constant
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            edge.from.vx += fx;
            edge.from.vy += fy;
            edge.to.vx -= fx;
            edge.to.vy -= fy;
        }

        // 3. Gravity (Center pull) & Update Positions
        for (const node of nodes) {
            node.vx += (center.x - node.x) * VIZ_CONFIG.gravity;
            node.vy += (center.y - node.y) * VIZ_CONFIG.gravity;

            node.vx *= VIZ_CONFIG.friction;
            node.vy *= VIZ_CONFIG.friction;

            node.x += node.vx;
            node.y += node.vy;
        }
    }
}

function drawNetwork(canvas, visualNodes, allEdges) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = VIZ_CONFIG.canvasHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Edges
    const visualEdges = allEdges.filter(e => 
        visualNodes.includes(e.from) && visualNodes.includes(e.to)
    );

    visualEdges.forEach(edge => {
        const opacity = Math.min(0.1 + (edge.strength * 0.05), 0.6);
        ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`; // Light blue, transparent
        ctx.lineWidth = Math.min(edge.strength, 3);
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
        ctx.stroke();
    });

    // Draw Nodes
    visualNodes.forEach(node => {
        const radius = VIZ_CONFIG.nodeBaseRadius + Math.min(node.totalStrength, VIZ_CONFIG.maxNodeExtraRadius);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
        
        // Node Body
        ctx.fillStyle = '#2563eb'; // Primary blue
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset glow for text

        // Label Background (The fix for "unlabeled rectangles" perception - clear text area)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Dark background
        const label = node.title.length > 20 ? node.title.slice(0, 18) + '..' : node.title;
        const textWidth = ctx.measureText(label).width;
        
        // Text
        ctx.fillStyle = '#e2e8f0'; // Light text
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Optional: Draw a pill behind text if it's crowded, but simpler is better:
        // Draw text below node
        ctx.fillText(label, node.x, node.y + radius + 12);
    });
}

function showEdgeDetails(edge) {
    const categories = edge.sharedCategories.length > 0 ? edge.sharedCategories.join(', ') : 'None';
    const keywords = edge.sharedKeywords.length > 0 ? edge.sharedKeywords.join(', ') : 'None';
    
    alert(`Connection Details between:\n"${edge.from.title}" and "${edge.to.title}"\n\nShared Categories: ${categories}\nShared Keywords: ${keywords}`);
}

function updateNetworkExplanation(nodes, edges, visualNodes) {
    const explanationEl = document.getElementById('network-explanation');
    if (!explanationEl) return;

    const connectedNodes = nodes.filter(n => n.connectionCount > 0);
    const totalConnections = edges.length;
    
    // Find top categories
    const catCounts = {};
    nodes.forEach(n => {
        n.categories.forEach(c => {
            const cleanCat = c.replace(/^Kategorie:/i, '').replace(/^Category:/i, '');
            catCounts[cleanCat] = (catCounts[cleanCat] || 0) + 1;
        });
    });
    
    const topCats = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);

    // Strongest node overall
    const strongestNode = [...nodes].sort((a, b) => b.totalStrength - a.totalStrength)[0];

    const lang = getLanguage();
    const isDe = lang === 'de';
    
    const intro = getTranslation('network-explanation-intro', '', { total: nodes.length, connected: connectedNodes.length, edges: totalConnections });
    const interpretation = isDe ? "Die Visualisierung zeigt Cluster von verwandten Themen." : "The visualization shows clusters of related topics.";
    const central = getTranslation('network-explanation-central', '', { title: strongestNode?.title || 'N/A' });
    const categories = getTranslation('network-explanation-categories', '', { categories: topCats.join(', ') || 'N/A' });

    // Build Article Table
    let tableHtml = `
        <div style="margin-top: 2rem; overflow-x: auto;">
            <h4 style="margin-bottom: 1rem;">${isDe ? 'Top Artikel' : 'Top Articles'}</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2rem;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <th style="text-align: left; padding: 0.5rem;">${isDe ? 'Artikel' : 'Article'}</th>
                        <th style="text-align: right; padding: 0.5rem;">${isDe ? 'Verknüpfungen' : 'Connections'}</th>
                        <th style="text-align: right; padding: 0.5rem;">${isDe ? 'Relevanz' : 'Strength'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${nodes
                        .filter(n => n.connectionCount > 0 && n.totalStrength > 0)
                        .sort((a,b) => b.totalStrength - a.totalStrength)
                        .slice(0, 15)
                        .map(n => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.5rem;"><a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(n.title)}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600;">${n.title}</a></td>
                            <td style="text-align: right; padding: 0.5rem;">${n.connectionCount}</td>
                            <td style="text-align: right; padding: 0.5rem;">${n.totalStrength}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h4 style="margin-bottom: 1rem;">${isDe ? 'Stärkste Verbindungen' : 'Strongest Connections'}</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; color: var(--text-secondary);">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <th style="text-align: left; padding: 0.5rem;">${isDe ? 'Von' : 'From'}</th>
                        <th style="text-align: left; padding: 0.5rem;">${isDe ? 'Nach' : 'To'}</th>
                        <th style="text-align: right; padding: 0.5rem;">${isDe ? 'Stärke' : 'Strength'}</th>
                        <th style="text-align: center; padding: 0.5rem;">Info</th>
                    </tr>
                </thead>
                <tbody>
                    ${edges
                        .sort((a, b) => b.strength - a.strength)
                        .slice(0, 10)
                        .map((e, index) => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.5rem;">${e.from.title}</td>
                            <td style="padding: 0.5rem;">${e.to.title}</td>
                            <td style="text-align: right; padding: 0.5rem;">${e.strength}</td>
                            <td style="text-align: center; padding: 0.5rem;">
                                <button class="btn btn-tertiary edge-info-btn" data-index="${index}" style="padding: 2px 8px; min-height: 24px;">i</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    explanationEl.innerHTML = `
        <p><strong>${intro}</strong></p>
        <p>${interpretation}</p>
        <p style="margin-left: 2rem; margin-top: 0.5rem;">${central}</p>
        <p style="margin-left: 2rem; margin-top: 0.25rem;">${categories}</p>
        ${tableHtml}
    `;

    // Attach event listeners to edge info buttons
    const sortedEdges = [...edges].sort((a, b) => b.strength - a.strength).slice(0, 10);
    explanationEl.querySelectorAll('.edge-info-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showEdgeDetails(sortedEdges[index]);
        });
    });
}

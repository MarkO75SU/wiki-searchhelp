/**
 * src/js/ui/renderer.js
 * DOM Rendering and Visualizations (Enterprise Optimized)
 */

import { getTranslation, getLanguage } from '../core/state.js';
import { loadLeaflet } from '../core/utils.js';
import { HEALTH_CONFIG, DRIFT_CONFIG } from '../config/constants.js';

/**
 * Renders the main search results list into an Enterprise Card format.
 */
export function renderResultsList(results, containerId, actionsId, headingId, totalHits, handlers) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Update Heading
    const heading = document.getElementById(headingId);
    if (heading) heading.textContent = `${totalHits.toLocaleString()} Artikel identifiziert`;

    if (results.length === 0) {
        container.innerHTML = `<div class="empty-state">Keine Ergebnisse für die gewählten Parameter gefunden.</div>`;
        return;
    }

    container.innerHTML = '';
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-item';
        
        const hasCoords = result.coords ? '<span class="meta-badge">📍 Geo</span>' : '';
        const driftBadge = result.isOutlier ? `<span class="meta-badge drift" style="color: var(--accent-red)">⚠️ Drift</span>` : '';
        
        card.innerHTML = `
            <div class="result-thumbnail-container">
                ${result.thumbUrl ? `<img src="${result.thumbUrl}" alt="${result.title}" class="result-thumbnail">` : '<div class="thumb-placeholder">📄</div>'}
            </div>
            <div class="result-content">
                <div class="result-header">
                    <a href="https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank" class="result-title">
                        ${result.title}
                    </a>
                    <div class="result-badges">
                        ${hasCoords}
                        ${driftBadge}
                    </div>
                </div>
                <p class="result-snippet">${result.summary || 'Keine Kurzbeschreibung verfügbar.'}</p>
                <div class="result-actions">
                    <button class="btn btn-secondary btn-sm similar-btn" data-title="${result.title}">🔍 Ähnlich</button>
                    <button class="btn btn-primary btn-sm maintenance-btn" data-title="${result.title}">🛠️ Bearbeiten</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Attach interaction handlers if provided
    if (handlers) handlers(container);
}

/**
 * Renders the Health Score block.
 */
export function renderHealthUI(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const color = stats.score > 70 ? 'var(--accent-green)' : (stats.score > 40 ? '#eab308' : 'var(--accent-red)');

    container.innerHTML = `
        <div class="health-display">
            <div class="score-circle" style="border-color: ${color}">
                <span class="score-value">${stats.score}</span>
                <span class="score-label">Health</span>
            </div>
            <div class="health-details">
                <div class="stat-row"><span>Belege:</span> <strong>Ø ${stats.avgRefs.toFixed(1)}</strong></div>
                <div class="stat-row"><span>Bilder:</span> <strong>${stats.imageRate.toFixed(0)}%</strong></div>
            </div>
        </div>
    `;
}

/**
 * Lazy-loads Leaflet and renders the knowledge map.
 */
export async function renderMap(results, mapContainerId) {
    const container = document.getElementById(mapContainerId);
    if (!container) return;

    const resultsWithCoords = results.filter(r => r.coords);
    if (!resultsWithCoords.length) {
        container.innerHTML = `<div class="empty-state small">Keine Geodaten vorhanden.</div>`;
        return;
    }

    if (!window.L) {
        await loadLeaflet();
    }

    container.innerHTML = '';
    const map = L.map(mapContainerId, { zoomControl: false }).setView([0, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    const markers = resultsWithCoords.map(res => {
        return L.circleMarker([res.coords.lat, res.coords.lon], {
            radius: 6,
            fillColor: "var(--primary)",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`<strong>${res.title}</strong>`).addTo(map);
    });

    if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
}
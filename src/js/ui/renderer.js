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
        
        const summary = result.summary || 'Keine Kurzbeschreibung verfügbar.';
        const sentences = summary.match(/[^\.!\?]+[\.!\?]+/g) || [summary];
        const limitedSummary = sentences.slice(0, 4).join(' ');
        const wikiUrl = `https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(result.title)}`;

        const hasCoords = result.coords ? '<span class="meta-badge">📍 Knowledge-Map</span>' : '';
        const driftBadge = result.isOutlier ? `<span class="meta-badge drift" style="color: var(--accent-red)">⚠️ Drift</span>` : '';
        
        card.innerHTML = `
            <div class="result-thumbnail-container">
                ${result.thumbUrl ? `<img src="${result.thumbUrl}" alt="${result.title}" class="result-thumbnail">` : '<div class="thumb-placeholder">📄</div>'}
            </div>
            <div class="result-content">
                <div class="result-header">
                    <a href="${wikiUrl}" target="_blank" class="result-title">
                        ${result.title}
                    </a>
                    <div class="result-badges">
                        ${hasCoords}
                        ${driftBadge}
                    </div>
                </div>
                <p class="result-snippet">
                    ${limitedSummary}
                    <a href="${wikiUrl}" target="_blank" class="wiki-link-inline">Weiterlesen auf Wikipedia &raquo;</a>
                </p>
                <div class="result-actions">
                    <button class="btn btn-secondary btn-sm similar-btn" data-title="${result.title}">🔍 Ähnlich</button>
                    <button class="btn btn-primary btn-sm maintenance-btn" data-title="${result.title}">🛠️ Bearbeiten</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

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
        <div class="health-display" style="margin-top: 1rem;">
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
 * Optimized for geographical orientation with layered labels.
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
    
    // Switch to Voyager with Labels for better geographic context
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

    const markers = resultsWithCoords.map(res => {
        const wikiUrl = `https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(res.title)}`;
        const popupContent = `
            <div style="color: #fff; font-family: sans-serif;">
                <strong style="display:block; margin-bottom: 5px;">${res.title}</strong>
                <a href="${wikiUrl}" target="_blank" style="color: var(--primary); text-decoration: none; font-size: 0.8rem;">Artikel öffnen &raquo;</a>
            </div>
        `;

        const marker = L.circleMarker([res.coords.lat, res.coords.lon], {
            radius: 6,
            fillColor: "var(--primary)",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(popupContent);

        // Add permanent label (Tooltip) - visibility controlled by zoom
        marker.bindTooltip(res.title, {
            permanent: true,
            direction: 'right',
            className: 'map-article-label',
            offset: [10, 0],
            opacity: 0 // Hidden by default
        });

        return marker.addTo(map);
    });

    if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));

    // Adaptive Label Visibility
    map.on('zoomend', () => {
        const currentZoom = map.getZoom();
        const labels = document.querySelectorAll('.map-article-label');
        labels.forEach(el => {
            el.style.opacity = currentZoom > 9 ? '1' : '0';
        });
    });
}

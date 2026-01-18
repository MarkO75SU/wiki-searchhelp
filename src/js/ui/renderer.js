/**
 * src/js/ui/renderer.js
 * DOM Rendering and Visualizations (Lazy Loading enabled)
 */

import { getTranslation, getLanguage } from '../core/state.js';
import { loadLeaflet } from '../core/utils.js';
import { HEALTH_CONFIG, DRIFT_CONFIG, INTERWIKI_CONFIG } from '../config/constants.js';

/**
 * Renders the main search results list.
 */
export function renderResultsList(results, containerId, actionsId, headingId, totalHits, handlers) {
    const container = document.getElementById(containerId);
    const resultsActions = document.getElementById(actionsId);
    const heading = document.getElementById(headingId);

    if (!container) return;
    if (heading) heading.textContent = getTranslation('search-results-heading', '', { totalResults: totalHits });

    container.innerHTML = results.length ? '' : `<li>${getTranslation('no-results-found')}</li>`;
    if (resultsActions) resultsActions.style.display = results.length ? 'block' : 'none';

    results.forEach(result => {
        const li = document.createElement('li');
        li.className = 'result-item';
        const thumb = result.thumbUrl ? `<img src="${result.thumbUrl}" class="result-thumbnail" alt="${result.title}">` : '<div class="result-thumbnail">📄</div>';
        
        li.innerHTML = `
            ${thumb}
            <div class="result-content">
                <a href="https://${getLanguage()}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">
                    <strong>${result.title}</strong>
                </a>
                <p>${result.summary || ''}</p>
                <div class="result-meta" id="global-score-${result.pageid || result.title.replace(/\W/g, '')}">
                    <button class="btn btn-tertiary global-check-btn" data-title="${result.title}" data-id="global-score-${result.pageid || result.title.replace(/\W/g, '')}">🌐</button>
                </div>
                <div class="result-actions">
                    <button class="btn btn-tertiary drill-down-btn" data-title="${result.title}">🔍 Similar</button>
                    <button class="btn btn-tertiary maintenance-btn" data-title="${result.title}">🛠️ Maintenance</button>
                </div>
            </div>
        `;
        
        // Outlier Styling
        if (result.isOutlier) {
            li.style.borderLeft = `4px solid ${DRIFT_CONFIG.OUTLIER_COLOR}`;
            li.style.backgroundColor = DRIFT_CONFIG.OUTLIER_BG;
        }

        container.appendChild(li);
    });

    // Attach Handlers (passed from ui/handlers.js)
    if (handlers) handlers(container);
}

/**
 * Lazy-loads Leaflet and renders the knowledge map.
 */
export async function renderMap(results, mapContainerId) {
    const container = document.getElementById(mapContainerId);
    if (!container) return;

    const resultsWithCoords = results.filter(r => r.coords);
    if (!resultsWithCoords.length) {
        container.innerHTML = `<p>${getTranslation('map-no-data') || 'No geo data'}</p>`;
        return;
    }

    if (!window.L) {
        container.innerHTML = '<p>Loading Map Module...</p>';
        await loadLeaflet();
    }

    container.innerHTML = '';
    const map = L.map(mapContainerId).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const markers = resultsWithCoords.map(res => {
        return L.marker([res.coords.lat, res.coords.lon])
            .bindPopup(`<strong>${res.title}</strong>`)
            .addTo(map);
    });

    if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.1));
}

/**
 * Renders the Health Score block.
 */
export function renderHealthUI(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const color = stats.score > 70 ? HEALTH_CONFIG.COLORS.HIGH : (stats.score > 40 ? HEALTH_CONFIG.COLORS.MID : HEALTH_CONFIG.COLORS.LOW);

    container.innerHTML = `
        <div class="health-card" style="border-left: 4px solid ${color}">
            <h4 style="color: ${color}">Health Score: ${stats.score}/100</h4>
            <div class="health-stats">
                <span>Refs: Ø ${stats.avgRefs.toFixed(1)}</span>
                <span>Images: ${stats.imageRate.toFixed(0)}%</span>
            </div>
        </div>
    `;
}

import { getTestHistory } from './modules/database.js';

async function initAdmin() {
    const container = document.getElementById('history-container');
    
    // Fetch Data
    const history = await getTestHistory();
    
    if (!history || history.length === 0) {
        container.innerHTML = '<p>Keine Einträge gefunden oder Verbindung zur Datenbank fehlgeschlagen.</p>';
        return;
    }

    // Render Table
    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Zeitpunkt</th>
                    <th>Suchbegriff</th>
                    <th>Ergebnisse</th>
                    <th>Drift Score</th>
                    <th>Health Score</th>
                    <th>Global Score</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach(entry => {
        const date = new Date(entry.created_at).toLocaleString();
        
        const driftColor = entry.drift_score < 0.85 ? 'score-low' : 'score-high';
        const healthColor = entry.health_score > 70 ? 'score-high' : (entry.health_score > 40 ? 'score-mid' : 'score-low');
        
        html += `
            <tr>
                <td>${date}</td>
                <td><strong>${entry.search_query}</strong></td>
                <td>${entry.results_count}</td>
                <td><span class="score-badge ${driftColor}">${(entry.drift_score * 100).toFixed(0)}%</span></td>
                <td><span class="score-badge ${healthColor}">${entry.health_score}</span></td>
                <td>${entry.global_score || '-'}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initAdmin);

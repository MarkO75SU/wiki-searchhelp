import { getTestHistory, supabase } from './modules/database.js';

async function initAdmin() {
    // 1. Session Check (Expert Only)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    const container = document.getElementById('history-container');
    
    // 2. Fetch Data
    const history = await getTestHistory();
    
    if (!history || history.length === 0) {
        container.innerHTML = '<p>Keine Einträge gefunden oder Verbindung zur Datenbank fehlgeschlagen.</p>';
        return;
    }

    // 3. Render Trend Chart
    renderChart(history);

    // 4. Render Table
    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Zeitpunkt</th>
                    <th>Suchbegriff</th>
                    <th>Ergebnisse</th>
                    <th>Drift Score</th>
                    <th>Health Score</th>
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
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderChart(history) {
    const ctx = document.getElementById('qualityChart').getContext('2d');
    const recent = [...history].reverse().slice(-10); // Show last 10 entries

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: recent.map(e => new Date(e.created_at).toLocaleDateString()),
            datasets: [
                {
                    label: 'Health Score',
                    data: recent.map(e => e.health_score),
                    borderColor: '#22c55e',
                    tension: 0.3
                },
                {
                    label: 'Semantic Drift (Sim)',
                    data: recent.map(e => e.drift_score * 100),
                    borderColor: '#2563eb',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { min: 0, max: 100, ticks: { color: '#94a3b8' } },
                x: { ticks: { color: '#94a3b8' } }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initAdmin);

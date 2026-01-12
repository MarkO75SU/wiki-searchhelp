// src/js/modules/history.js
import { getTranslation } from './state.js';

export function updateHistory(queryText, fullUrl) {
    if (!queryText || !fullUrl) return;
    
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Neues Objekt für den Verlauf
    const newEntry = {
        name: queryText,
        url: fullUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Duplikate entfernen (basierend auf der URL)
    history = [newEntry, ...history.filter(h => h.url !== fullUrl)].slice(0, 5);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

export function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = `<li style="color: var(--slate-400); padding: 1rem; text-align: center;">${getTranslation('no-history') || 'Noch kein Verlauf'}</li>`;
        return;
    }

    historyList.innerHTML = history.map(entry => `
        <li class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--slate-50); border-radius: var(--radius-md); margin-bottom: 0.5rem; border: 1px solid var(--border); border-left: 4px solid var(--accent);">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; margin-right: 1rem;">
                <strong style="color: var(--slate-900); font-size: 0.95rem;">${entry.name}</strong>
                <br><small style="color: var(--slate-400); font-size: 0.75rem;">${entry.time} Uhr</small>
            </div>
            <button class="header-button load-history-btn" data-url="${entry.url}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: var(--accent); border: none;">Öffnen</button>
        </li>
    `).join('');

    // Event Listener für die Buttons
    historyList.querySelectorAll('.load-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            window.open(e.target.dataset.url, '_blank');
        });
    });
}
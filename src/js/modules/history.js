// src/js/modules/history.js
import { getTranslation } from './state.js';

export function updateHistory(fullUrl) {
    if (!fullUrl) return;
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    // Filter out duplicates and limit to 5
    history = [fullUrl, ...history.filter(h => h !== fullUrl)].slice(0, 5);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

export function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = `<li>${getTranslation('no-history') || 'Kein Verlauf vorhanden.'}</li>`;
        return;
    }

    historyList.innerHTML = history.map(url => {
        const urlObj = new URL(url);
        const searchQuery = urlObj.searchParams.get('search') || 'Suche';
        return `
            <li class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--slate-50); border-radius: var(--radius-sm); margin-bottom: 0.5rem; border: 1px solid var(--border); transition: transform 0.2s;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; margin-right: 1rem;">
                    <strong style="color: var(--primary); font-size: 0.9rem;">${searchQuery}</strong>
                    <br><small style="color: var(--text-muted); font-size: 0.75rem;">${url}</small>
                </div>
                <button class="header-button" data-url="${url}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Öffnen</button>
            </li>
        `;
    }).join('');

    historyList.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            window.open(e.target.dataset.url, '_blank');
        });
    });
}

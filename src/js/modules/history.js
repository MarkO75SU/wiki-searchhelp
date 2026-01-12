// src/js/modules/history.js
import { getTranslation } from './state.js';

export function updateHistory(queryText, fullUrl) {
    if (!queryText || !fullUrl) return;
    
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Neues Objekt für den Verlauf
    const newEntry = {
        id: Date.now(), // Eindeutige ID für CRUD
        name: queryText,
        url: fullUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Duplikate entfernen (basierend auf der URL)
    history = [newEntry, ...history.filter(h => h.url !== fullUrl)].slice(0, 5);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

export function deleteHistoryEntry(id) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(entry => entry.id !== id);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderHistory();
}

export function clearHistory() {
    localStorage.removeItem('searchHistory');
    renderHistory();
}

export function editHistoryName(id) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const entry = history.find(h => h.id === id);
    if (!entry) return;

    const newName = prompt(getTranslation('history-edit-prompt') || 'Neuer Name:', entry.name);
    if (newName && newName.trim()) {
        entry.name = newName.trim();
        localStorage.setItem('searchHistory', JSON.stringify(history));
        renderHistory();
    }
}

export function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Header mit "Leeren" Button hinzufügen falls nicht da
    const container = historyList.closest('.history-container');
    let clearBtn = container.querySelector('.clear-history-btn');
    if (!clearBtn && history.length > 0) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-history-btn header-button';
        clearBtn.style.cssText = 'background: var(--slate-700); font-size: 0.7rem; margin-bottom: 1rem; width: 100%; border: none;';
        clearBtn.textContent = getTranslation('history-clear-btn') || 'Verlauf leeren';
        clearBtn.onclick = clearHistory;
        historyList.before(clearBtn);
    } else if (clearBtn && history.length === 0) {
        clearBtn.remove();
    }

    if (history.length === 0) {
        historyList.innerHTML = `<li style="color: var(--slate-400); padding: 1rem; text-align: center;">${getTranslation('no-history') || 'Noch kein Verlauf'}</li>`;
        return;
    }

    historyList.innerHTML = history.map(entry => `
        <li class="history-item" style="display: flex; flex-direction: column; padding: 0.75rem; background: var(--slate-50); border-radius: var(--radius-md); margin-bottom: 0.5rem; border: 1px solid var(--border); border-left: 4px solid var(--accent);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                    <strong style="color: var(--slate-900); font-size: 0.95rem;">${entry.name}</strong>
                    <br><small style="color: var(--slate-400); font-size: 0.75rem;">${entry.time} Uhr</small>
                </div>
                <div style="display: flex; gap: 0.3rem;">
                    <button class="edit-history-btn" data-id="${entry.id}" style="background:none; border:none; cursor:pointer; font-size:0.9rem;" title="Bearbeiten">✏️</button>
                    <button class="delete-history-btn" data-id="${entry.id}" style="background:none; border:none; cursor:pointer; font-size:0.9rem;" title="Löschen">🗑️</button>
                </div>
            </div>
            <button class="header-button load-history-btn" data-url="${entry.url}" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: var(--accent); border: none; width: 100%;">Öffnen</button>
        </li>
    `).join('');

    // Event Listener
    historyList.querySelectorAll('.load-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => window.open(e.target.dataset.url, '_blank'));
    });
    historyList.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteHistoryEntry(Number(e.target.dataset.id)));
    });
    historyList.querySelectorAll('.edit-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editHistoryName(Number(e.target.dataset.id)));
    });
}

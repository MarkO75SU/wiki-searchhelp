// src/js/modules/journal.js
import { getTranslation, getLanguage } from './state.js';

const STORAGE_KEY = 'wikiGuiJournal';

export function addJournalEntry(queryText, fullUrl) {
    if (!queryText || !fullUrl) return;
    
    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    const newEntry = {
        id: Date.now(),
        name: queryText,
        url: fullUrl,
        time: new Date().toLocaleString(getLanguage(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        favorite: false
    };

    // If exact same search exists, move to top instead of duplicating
    journal = [newEntry, ...journal.filter(entry => entry.url !== fullUrl)];
    
    // Limit to 20 entries, but keep all favorites
    const favorites = journal.filter(e => e.favorite);
    const nonFavorites = journal.filter(e => !e.favorite).slice(0, 20);
    journal = [...favorites, ...nonFavorites];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
    renderJournal();
}

export function toggleFavorite(id) {
    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const entry = journal.find(e => e.id === id);
    if (entry) {
        entry.favorite = !entry.favorite;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
        renderJournal();
    }
}

export function deleteJournalEntry(id) {
    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    journal = journal.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
    renderJournal();
}

export function editJournalName(id) {
    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const entry = journal.find(e => e.id === id);
    if (!entry) return;

    const newName = prompt(getTranslation('history-edit-prompt') || 'Neuer Name:', entry.name);
    if (newName && newName.trim()) {
        entry.name = newName.trim();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
        renderJournal();
    }
}

export function clearJournal() {
    if (confirm(getTranslation('confirm-clear-journal') || 'Gesamtes Journal leeren?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderJournal();
    }
}

export function renderJournal() {
    const list = document.getElementById('journal-list');
    if (!list) return;
    
    const journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (journal.length === 0) {
        list.innerHTML = `<li style="color: var(--slate-400); padding: 2rem; text-align: center;">${getTranslation('no-history') || 'Dein Journal ist leer.'}</li>`;
        return;
    }

    list.innerHTML = journal.map(entry => `
        <li class="journal-item" style="display: flex; flex-direction: column; padding: 1rem; background: var(--slate-50); border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid var(--border); border-left: 5px solid ${entry.favorite ? '#f59e0b' : 'var(--primary)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                    <strong style="color: var(--slate-900); font-size: 1rem;">${entry.name}</strong>
                    <br><small style="color: var(--slate-400); font-size: 0.75rem;">${entry.time}</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="fav-journal-btn" data-id="${entry.id}" title="Favorit" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">${entry.favorite ? '⭐' : '☆'}</button>
                    <button class="edit-journal-btn" data-id="${entry.id}" title="Bearbeiten" style="background:none; border:none; cursor:pointer; font-size:1rem;">✏️</button>
                    <button class="delete-journal-btn" data-id="${entry.id}" title="Löschen" style="background:none; border:none; cursor:pointer; font-size:1rem;">🗑️</button>
                </div>
            </div>
            <button class="header-button load-journal-btn" data-url="${entry.url}" style="padding: 0.5rem; font-size: 0.8rem; background: var(--slate-800); border: none; width: 100%;">Wiederholen</button>
        </li>
    `).join('');

    // Listeners
    list.querySelectorAll('.load-journal-btn').forEach(btn => btn.addEventListener('click', (e) => window.open(e.target.dataset.url, '_blank')));
    list.querySelectorAll('.delete-journal-btn').forEach(btn => btn.addEventListener('click', (e) => deleteJournalEntry(Number(e.target.dataset.id))));
    list.querySelectorAll('.edit-journal-btn').forEach(btn => btn.addEventListener('click', (e) => editJournalName(Number(e.target.dataset.id))));
    list.querySelectorAll('.fav-journal-btn').forEach(btn => btn.addEventListener('click', (e) => toggleFavorite(Number(e.target.dataset.id))));
}

// src/js/modules/journal.js
import { getTranslation, getLanguage } from './state.js';
import { showToast } from './toast.js';

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
    journal = [newEntry, ...journal.filter(entry => entry.url !== fullUrl)];
    
    // Auto-limit to 50 for performance, keeping favorites
    const favorites = journal.filter(e => e.favorite);
    const nonFavorites = journal.filter(e => !e.favorite).slice(0, 50);
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

export function deleteSelectedEntries() {
    const selectedIds = Array.from(document.querySelectorAll('.journal-checkbox:checked')).map(cb => Number(cb.dataset.id));
    if (selectedIds.length === 0) {
        showToast(getTranslation('alert-no-selection') || 'Nichts ausgewählt.');
        return;
    }
    if (confirm(getTranslation('journal-delete-selected') + '?')) {
        let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        journal = journal.filter(entry => !selectedIds.includes(entry.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
        renderJournal();
        showToast(selectedIds.length + ' Einträge gelöscht.');
    }
}

export function exportJournal(format = 'json') {
    const selectedIds = Array.from(document.querySelectorAll('.journal-checkbox:checked')).map(cb => Number(cb.dataset.id));
    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const dataToExport = selectedIds.length > 0 ? journal.filter(entry => selectedIds.includes(entry.id)) : journal;

    if (dataToExport.length === 0) {
        showToast(getTranslation('alert-no-searches-to-export') || 'Keine Daten zum Exportieren.');
        return;
    }

    let content = '';
    let type = 'text/plain';
    let fileName = `wikigui-journal-${new Date().toISOString().slice(0,10)}`;

    if (format === 'json') {
        content = JSON.stringify(dataToExport, null, 2);
        fileName += '.json';
        type = 'application/json';
    } else {
        content = 'Name,URL,Datum\n' + dataToExport.map(e => `"${e.name}","${e.url}","${e.time}"`).join('\n');
        fileName += '.csv';
        type = 'text/csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

export async function importJournal(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let importedData = JSON.parse(e.target.result);
            let currentJournal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const combined = [...importedData, ...currentJournal];
            const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
            renderJournal();
            showToast('Import erfolgreich.');
        } catch (err) {
            showToast('Fehler beim Import.');
        }
    };
    reader.readAsText(file);
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
    const selectAllCheckbox = document.getElementById('journal-select-all-checkbox');
    if (!list) return;
    if (selectAllCheckbox) selectAllCheckbox.checked = false;

    let journal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // SORTIERUNG: Favoriten nach oben, dann nach Zeit
    journal.sort((a, b) => {
        if (a.favorite === b.favorite) return b.id - a.id;
        return a.favorite ? -1 : 1;
    });

    if (journal.length === 0) {
        list.innerHTML = `<li style="color: var(--slate-400); padding: 2rem; text-align: center;">${getTranslation('no-history') || 'Dein Journal ist leer.'}</li>`;
        return;
    }

    list.innerHTML = journal.map((entry, index) => {
        // Trenner einfügen, wenn nach Favoriten normale Einträge folgen
        const showSeparator = index > 0 && !entry.favorite && journal[index-1].favorite;
        const separatorHtml = showSeparator ? '<li style="border-bottom: 2px dashed var(--slate-200); margin: 1.5rem 0 1rem 0; list-style: none;"></li>' : '';

        return `
            ${separatorHtml}
            <li class="journal-item" style="display: flex; flex-direction: column; padding: 1rem; background: ${entry.favorite ? 'var(--primary-light)' : 'var(--slate-50)'}; border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid ${entry.favorite ? 'var(--primary)' : 'var(--border)'}; border-left: 5px solid ${entry.favorite ? '#f59e0b' : 'var(--primary)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: flex-start; flex-grow: 1; overflow: hidden;">
                        <input type="checkbox" class="journal-checkbox" data-id="${entry.id}" style="margin-top: 0.3rem; width: 1.1rem; height: 1.1rem; cursor: pointer;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <strong style="color: var(--slate-900); font-size: 1rem;">${entry.name}</strong>
                            <br><small style="color: var(--slate-400); font-size: 0.75rem;">${entry.time}</small>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button class="fav-journal-btn" data-id="${entry.id}" title="Favorit" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">${entry.favorite ? '⭐' : '☆'}</button>
                        <button class="edit-journal-btn" data-id="${entry.id}" title="Bearbeiten" style="background:none; border:none; cursor:pointer; font-size:1rem;">✏️</button>
                        <button class="delete-journal-btn" data-id="${entry.id}" title="Löschen" style="background:none; border:none; cursor:pointer; font-size:1rem;">🗑️</button>
                    </div>
                </div>
                <button class="header-button load-journal-btn" data-url="${entry.url}" style="padding: 0.5rem; font-size: 0.8rem; background: var(--slate-800); border: none; width: 100%;">Wiederholen</button>
            </li>
        `;
    }).join('');

    // Re-attach listeners
    list.querySelectorAll('.load-journal-btn').forEach(btn => btn.onclick = (e) => window.open(e.target.dataset.url, '_blank'));
    list.querySelectorAll('.delete-journal-btn').forEach(btn => btn.onclick = (e) => deleteJournalEntry(Number(e.target.dataset.id)));
    list.querySelectorAll('.edit-journal-btn').forEach(btn => btn.onclick = (e) => editJournalName(Number(e.target.dataset.id)));
    list.querySelectorAll('.fav-journal-btn').forEach(btn => btn.onclick = (e) => toggleFavorite(Number(e.target.dataset.id)));
}

// Global listener for Select All
document.getElementById('journal-select-all-checkbox')?.addEventListener('change', (e) => {
    document.querySelectorAll('.journal-checkbox').forEach(cb => cb.checked = e.target.checked);
});
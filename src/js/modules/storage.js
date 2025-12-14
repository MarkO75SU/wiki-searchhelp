// src/js/modules/storage.js
import { getTranslation } from './state.js';
import { generateSearchString } from './search.js';
import { clearForm } from './ui.js';

const LOCAL_STORAGE_KEY = 'wikiGuiSavedSearches';

function getCurrentFormValues() {
    const formValues = {};
    const inputElements = document.querySelectorAll('#search-form input, #search-form select');
    inputElements.forEach(element => {
        if (element.id && element.id !== 'save-search-comment') {
            formValues[element.id] = element.type === 'checkbox' ? element.checked : element.value;
        }
    });
    return formValues;
}

export function saveCurrentSearch() {
    const query = document.getElementById('generated-search-string-display').textContent;
    const comment = document.getElementById('save-search-comment').value.trim();
    const formState = getCurrentFormValues();

    if (!query || query === getTranslation('generated-string-placeholder')) {
        alert(getTranslation('alert-generate-search-string'));
        return;
    }

    let savedSearches = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const isDuplicate = savedSearches.some(s => s.query === query && s.comment === comment);

    if (isDuplicate) {
        alert(getTranslation('alert-search-already-saved'));
        return;
    }

    savedSearches.push({ id: Date.now().toString(), query, comment, timestamp: Date.now(), formState });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedSearches));
    document.getElementById('save-search-comment').value = '';
    loadSavedSearches();
    alert(getTranslation('alert-search-saved'));
}

export function loadSearch(searchId) {
    const savedSearches = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const searchToLoad = savedSearches.find(search => search.id === searchId);

    if (searchToLoad) {
        clearForm();
        for (const key in searchToLoad.formState) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = searchToLoad.formState[key];
                } else {
                    element.value = searchToLoad.formState[key];
                }
            }
        }
        generateSearchString();
        alert(getTranslation('alert-search-loaded'));
    } else {
        alert(getTranslation('alert-search-not-found'));
    }
}

export function editSearchComment(searchId) {
    let savedSearches = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const searchIndex = savedSearches.findIndex(search => search.id === searchId);

    if (searchIndex !== -1) {
        const newComment = prompt(getTranslation('prompt-edit-comment'), savedSearches[searchIndex].comment);
        if (newComment !== null) {
            savedSearches[searchIndex].comment = newComment.trim();
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedSearches));
            loadSavedSearches();
            alert(getTranslation('alert-comment-updated'));
        }
    }
}

export function deleteSearch(searchId) {
    if (confirm(getTranslation('confirm-delete-search'))) {
        let savedSearches = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        savedSearches = savedSearches.filter(search => search.id !== searchId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedSearches));
        loadSavedSearches();
        alert(getTranslation('alert-search-deleted'));
    }
}

export function loadSavedSearches() {
    const listElement = document.getElementById('saved-searches-list');
    listElement.innerHTML = '';
    const savedSearches = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

    if (savedSearches.length === 0) {
        listElement.innerHTML = `<li>${getTranslation('no-searches-saved')}</li>`;
        return;
    }

    savedSearches.sort((a, b) => b.timestamp - a.timestamp).forEach(search => {
        const date = new Date(search.timestamp).toLocaleString();
        const listItem = document.createElement('li');
        listItem.dataset.searchId = search.id;
        listItem.innerHTML = `
            <div>
                <strong>${getTranslation('query-label')}:</strong> <span>${search.query}</span><br>
                <strong>${getTranslation('comment-label')}:</strong> <span class="search-comment">${search.comment}</span><br>
                <small>${date}</small>
            </div>
            <div class="search-actions">
                <button class="load-search-btn">${getTranslation('load-button')}</button>
                <button class="edit-search-btn">${getTranslation('edit-button')}</button>
                <button class="delete-search-btn">${getTranslation('delete-button')}</button>
            </div>
        `;
        listElement.appendChild(listItem);
    });
}

export function handleSavedSearchActions(event) {
    const target = event.target;
    const searchId = target.closest('li')?.dataset.searchId;
    if (!searchId) return;

    if (target.classList.contains('load-search-btn')) loadSearch(searchId);
    else if (target.classList.contains('edit-search-btn')) editSearchComment(searchId);
    else if (target.classList.contains('delete-search-btn')) deleteSearch(searchId);
}

// Import/Export functions will also go here...

// src/js/modules/autocomplete.js
import { getLanguage } from './state.js';

let debounceTimer;

export function setupCategoryAutocomplete(inputElement) {
    if (!inputElement) return;

    const listId = 'category-autocomplete-list';
    let dataList = document.getElementById(listId);
    if (!dataList) {
        dataList = document.createElement('datalist');
        dataList.id = listId;
        document.body.appendChild(dataList);
        inputElement.setAttribute('list', listId);
    }

    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const lang = getLanguage();
            const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=Category:${query}&limit=10`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                const categories = data[1].map(cat => cat.replace(/^Category:|Kategorie:/i, ''));
                
                dataList.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        }, 300);
    });
}

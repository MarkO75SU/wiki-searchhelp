// src/js/modules/search.js
import { getTranslation } from './state.js';

/**
 * Generates the search string from form inputs.
 * @returns {string} The generated search query.
 */
export function generateSearchString() {
    const queryParts = [];
    const explanationParts = [];

    const getValue = (id) => {
        const element = document.getElementById(id);
        if (!element) return '';
        return element.type === 'checkbox' ? element.checked : element.value.trim();
    };

    const mainQuery = getValue('search-query');
    const exactPhrase = getValue('exact-phrase');
    const withoutWords = getValue('without-words');
    const anyWords = getValue('any-words');
    const optionFuzzy = getValue('option-fuzzy');
    const optionIntitle = getValue('option-intitle');

    if (mainQuery) {
        let mainQueryTerm = mainQuery;
        if (optionFuzzy) {
            mainQueryTerm += '~';
            explanationParts.push(getTranslation('explanation-fuzzy-applied', '', { mainQuery }));
        }

        if (!optionIntitle && (mainQueryTerm.includes(' ') || /[\(\)]/.test(mainQueryTerm))) {
            if (!(mainQueryTerm.startsWith('"') && mainQueryTerm.endsWith('"'))) {
                mainQueryTerm = `"${mainQueryTerm}"`;
            }
        }
        
        if (optionIntitle) {
            queryParts.push(`intitle:${mainQueryTerm}`);
            explanationParts.push(getTranslation('explanation-intitle', '', { mainQuery }));
        } else {
            queryParts.push(mainQueryTerm);
            explanationParts.push(getTranslation('explanation-main-query', '', { mainQuery }));
        }
    }

    if (exactPhrase) {
        queryParts.push(`"${exactPhrase}"`);
        explanationParts.push(getTranslation('explanation-exact-phrase', '', { exactPhrase }));
    }

    if (withoutWords) {
        const words = withoutWords.split(/\s+/).map(word => `-${word}`).join(' ');
        queryParts.push(words);
        explanationParts.push(getTranslation('explanation-without-words', '', { withoutWords }));
    }

    if (anyWords) {
        const wordsArray = anyWords.split(/ OR /i).map(word => word.trim()).filter(word => word);
        if (wordsArray.length > 0) {
            let anyWordsQuery = wordsArray.join(' OR ');
            if (wordsArray.length > 1) {
                anyWordsQuery = `(${anyWordsQuery})`;
            }
            queryParts.push(anyWordsQuery);
            explanationParts.push(getTranslation('explanation-any-words', '', { anyWords }));
        }
    }
    
    // The rest of the parameter logic...
    const params = {
        incategory: getValue('incategory-value'),
        deepcat: getValue('deepcat-value'),
        linksto: getValue('linkfrom-value'), // Note: The parameter is linksto, not linkfrom
        prefix: getValue('prefix-value'),
        insource: getValue('insource-value'),
        hastemplate: getValue('hastemplate-value')
    };

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            queryParts.push(`${key}:"${value}"`);
            const explanationKey = `explanation-${key}`;
            explanationParts.push(getTranslation(explanationKey, '', { [key]: value }));
        }
    });

    const selectedFileTypes = Array.from(document.querySelectorAll('#filetype-options input:checked')).map(cb => cb.value);
    if (selectedFileTypes.length > 0) {
        const fileTypeQuery = selectedFileTypes.join('|');
        queryParts.push(`filetype:${fileTypeQuery}`);
        explanationParts.push(getTranslation('explanation-filetype', '', { fileType: fileTypeQuery }));
    }

    const fileSizeMin = getValue('filesize-min');
    if (fileSizeMin) {
        queryParts.push(`filesize:>=${fileSizeMin}`);
        explanationParts.push(getTranslation('explanation-filesize-min', '', { fileSizeMin }));
    }

    const fileSizeMax = getValue('filesize-max');
    if (fileSizeMax) {
        queryParts.push(`filesize:<=${fileSizeMax}`);
        explanationParts.push(getTranslation('explanation-filesize-max', '', { fileSizeMax }));
    }

    // Update the UI with the generated string and explanation
    const displayElement = document.getElementById('generated-search-string-display');
    if (displayElement) {
        displayElement.textContent = queryParts.join(' ').trim() || getTranslation('generated-string-placeholder');
    }

    const explanationElement = document.getElementById('generated-string-explanation');
    if (explanationElement) {
        if (explanationParts.length > 0) {
            explanationElement.innerHTML = `<h4>${getTranslation('explanation-heading')}</h4><ul>${explanationParts.map(exp => `<li>${exp}</li>`).join('')}</ul>`;
        } else {
            explanationElement.innerHTML = '';
        }
    }

    return queryParts.join(' ').trim();
}

// script.js

// Object to hold translations
const translations = {};
let currentLang = 'de'; // Default language

// Helper function to fetch translations
async function fetchTranslations(lang) {
    try {
        const response = await fetch(`${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations[lang] = await response.json();
    } catch (error) {
        console.error(`Could not fetch translations for ${lang}:`, error);
    }
}

// Function to apply translations
function applyTranslations() {
    const elements = document.querySelectorAll('[id]');
    elements.forEach(element => {
        const key = element.id;
        if (translations[currentLang] && translations[currentLang][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                // Translate placeholder attribute for inputs
                element.placeholder = translations[currentLang][key];
            } else if (element.tagName === 'LABEL' && element.nextElementSibling && element.nextElementSibling.classList.contains('info-icon')) {
                // Special handling for labels that have an associated info icon
                // This ensures the label text itself is translated, not just the info popup
                // We assume the element's ID directly corresponds to the translation key for its text content.
                element.textContent = translations[currentLang][key];
            }
             else {
                // Default: translate textContent
                element.textContent = translations[currentLang][key];
            }
        }
    });

    // Handle translation for select options and placeholders
    if (currentLang && translations[currentLang]) {
        // Translate options for the category dropdown
        const categorySelectElement = document.getElementById('category-select');
        if (categorySelectElement) {
            categorySelectElement.querySelectorAll('option').forEach(option => {
                const optionValue = option.value;
                if (optionValue === "") {
                    // Translate placeholder option "Select a category"
                    const placeholderKey = 'placeholder-category-dropdown';
                    if (translations[currentLang][placeholderKey]) {
                        option.textContent = translations[currentLang][placeholderKey];
                    }
                } else {
                    const translationKey = `category-${optionValue}`; // e.g., "category-Science"
                    if (translations[currentLang][translationKey]) {
                        option.textContent = translations[currentLang][translationKey];
                    }
                }
            });
        }

        // Translate options for the target wiki language dropdown
        const targetWikiLangSelect = document.getElementById('target-wiki-lang');
        if (targetWikiLangSelect) {
             targetWikiLangSelect.querySelectorAll('option').forEach(option => {
                const langCode = option.value;
                const translationKey = `lang-${langCode}-option`; // e.g., "lang-de-option"
                if (langCode && translations[currentLang][translationKey]) {
                    option.textContent = translations[currentLang][translationKey];
                }
            });
        }
    }
}

// Language switcher functionality
document.querySelectorAll('.lang-button').forEach(button => {
    button.addEventListener('click', async (event) => {
        currentLang = event.target.dataset.lang;
        await fetchTranslations(currentLang);
        applyTranslations();
    });
});

// Info popup functionality
document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('mouseover', (event) => {
        const infoId = event.target.dataset.infoId;
        const popup = document.getElementById(`${infoId}-popup`);
        if (popup) {
            popup.style.display = 'block';
        }
    });

    icon.addEventListener('mouseout', (event) => {
        const infoId = event.target.dataset.infoId;
        const popup = document.getElementById(`${infoId}-popup`);
        if (popup) {
            popup.style.display = 'none';
        }
    });
});

// Function to generate the search string
function generateSearchString() {
    let searchParts = [];

    const searchQueryInput = document.getElementById('search-query');
    const searchQuery = searchQueryInput ? searchQueryInput.value.trim() : '';
    if (searchQuery) {
        if (document.getElementById('option-intitle')?.checked) {
            searchParts.push(`intitle:"${searchQuery}"`);
        } else if (document.getElementById('option-intext')?.checked) {
            searchParts.push(`intext:"${searchQuery}"`);
        } else {
            searchParts.push(searchQuery);
        }
    }

    const exactPhraseInput = document.getElementById('exact-phrase');
    const exactPhrase = exactPhraseInput ? exactPhraseInput.value.trim() : '';
    if (exactPhrase) {
        searchParts.push(`"${exactPhrase}"`);
    }

    const withoutWordsInput = document.getElementById('without-words');
    const withoutWords = withoutWordsInput ? withoutWordsInput.value.trim() : '';
    if (withoutWords) {
        withoutWords.split(' ').forEach(word => {
            if (word) searchParts.push(`-${word}`);
        });
    }

    const anyWordsInput = document.getElementById('any-words');
    const anyWords = anyWordsInput ? anyWordsInput.value.trim() : '';
    if (anyWords) {
        const anyWordsArray = anyWords.split(' ').filter(word => word);
        if (anyWordsArray.length > 0) {
            searchParts.push(`(${anyWordsArray.join(' OR ')})`);
        }
    }

    const incategoryInput = document.getElementById('incategory-value');
    const incategory = incategoryInput ? incategoryInput.value.trim() : '';
    if (incategory) {
        incategory.split(',').forEach(cat => {
            if (cat.trim()) searchParts.push(`incategory:"${cat.trim()}"`);
        });
    }

    const deepcatInput = document.getElementById('deepcat-value');
    const deepcat = deepcatInput ? deepcatInput.value.trim() : '';
    if (deepcat) {
        searchParts.push(`deepcategory:"${deepcat}"`);
    }

    // NEW: Handle category selection dropdown
    const categorySelectElement = document.getElementById('category-select');
    const selectedCategory = categorySelectElement ? categorySelectElement.value : '';
    if (selectedCategory) {
        searchParts.push(`incategory:"${selectedCategory}"`);
    }

    const prefixInput = document.getElementById('prefix-value');
    const prefix = prefixInput ? prefixInput.value.trim() : '';
    if (prefix) {
        searchParts.push(`prefix:"${prefix}"`);
    }

    const subpageofInput = document.getElementById('subpageof-value');
    const subpageof = subpageofInput ? subpageofInput.value.trim() : '';
    if (subpageof) {
        searchParts.push(`subpageof:"${subpageof}"`);
    }

    const linkfromInput = document.getElementById('linkfrom-value');
    const linkfrom = linkfromInput ? linkfromInput.value.trim() : '';
    if (linkfrom) {
        searchParts.push(`linkfrom:"${linkfrom}"`);
    }

    const namespaces = [];
    // Ensure the namespaces-options div exists before querying its children
    const namespacesOptions = document.getElementById('namespaces-options');
    if (namespacesOptions) {
        namespacesOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                // Map checkbox IDs to actual Wikipedia namespace numbers or names
                const nsMap = {
                    'ns-main': '0',
                    'ns-file': '6',
                    'ns-category': '14',
                    'ns-help': '12',
                    'ns-user': '2',
                    'ns-template': '10'
                };
                const nsValue = nsMap[checkbox.id];
                if (nsValue) namespaces.push(nsValue);
            }
        });
    }
    if (namespaces.length > 0) {
        searchParts.push(`ns:${namespaces.join('|')}`);
    }

    const insourceInput = document.getElementById('insource-value');
    const insource = insourceInput ? insourceInput.value.trim() : '';
    if (insource) {
        searchParts.push(`insource:${insource}`);
    }

    const hastemplateInput = document.getElementById('hastemplate-value');
    const hastemplate = hastemplateInput ? hastemplateInput.value.trim() : '';
    if (hastemplate) {
        searchParts.push(`hastemplate:"${hastemplate}"`);
    }

    const filetypeInput = document.getElementById('filetype-value');
    const filetype = filetypeInput ? filetypeInput.value.trim() : '';
    if (filetype) {
        filetype.split(',').forEach(type => {
            if (type.trim()) searchParts.push(`filetype:"${type.trim()}"`);
        });
    }

    const filesizeMinInput = document.getElementById('filesize-min');
    const filesizeMaxInput = document.getElementById('filesize-max');
    const filesizeMin = filesizeMinInput ? filesizeMinInput.value.trim() : '';
    const filesizeMax = filesizeMaxInput ? filesizeMaxInput.value.trim() : '';

    if (filesizeMin || filesizeMax) {
        let sizePart = 'filesize:';
        if (filesizeMin) sizePart += `${filesizeMin}..`;
        if (filesizeMax) sizePart += filesizeMax;
        searchParts.push(sizePart);
    }

    if (document.getElementById('option-fuzzy')?.checked && searchQuery) {
        // Fuzzy search usually applies to individual words, but for simplicity, we'll append to the main query if it exists.
        // A more complex implementation would apply it per-word in the main query.
        if (searchQuery) {
            // Remove the original searchQuery if it was already added without fuzzy
            if (searchParts[0] === searchQuery) {
                searchParts.shift();
            }
            searchParts.push(`${searchQuery}~`);
        }
    }

    const generatedString = searchParts.filter(part => part).join(' ');
    const generatedStringDisplay = document.getElementById('generated-search-string-display');
    if (generatedStringDisplay) {
        generatedStringDisplay.textContent = generatedString || "No search parameters entered.";
    }
    return generatedString;
}

// Function to fetch search results from Wikipedia API
async function performWikipediaSearch(searchTerm, lang) {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const params = {
        action: "query",
        list: "search",
        srsearch: searchTerm,
        format: "json",
        origin: "*", // Required for CORS
        srlimit: 10 // Limit to first 10 results
    };

    try {
        const url = new URL(endpoint);
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.query.search;
    } catch (error) {
        console.error("Error fetching Wikipedia search results:", error);
        return [];
    }
}

// NEW: Function to fetch article summary
async function fetchArticleSummary(title, lang) {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const params = {
        action: "query",
        prop: "extracts",
        exsentences: 4, // Get 4 sentences for summary (can adjust to 6 if needed)
        exlimit: 1,
        explaintext: 1, // Return plain text
        format: "json",
        origin: "*",
        titles: title
    };

    try {
        const url = new URL(endpoint);
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        // Add null check for pages[pageId] before accessing extract
        return pages && pages[pageId] && pages[pageId].extract ? pages[pageId].extract : "No summary available.";
    } catch (error) {
        console.error(`Error fetching summary for "${title}":`, error);
        return "Failed to fetch summary.";
    }
}


// Event listener for form submission
// Added a check to ensure 'search-form' element exists before attaching listener
const searchForm = document.getElementById('search-form');
if (searchForm) {
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const generatedQuery = generateSearchString();
        const targetLangInput = document.getElementById('target-wiki-lang');
        const targetLang = targetLangInput ? targetLangInput.value : 'en'; // Default to 'en' if not found

        const resultsContainer = document.getElementById('simulated-search-results');
        
        if (resultsContainer) {
            resultsContainer.innerHTML = '<li>Searching...</li>';
        }

        if (generatedQuery && targetLang) {
            const searchResults = await performWikipediaSearch(generatedQuery, targetLang);
            if (resultsContainer) {
                resultsContainer.innerHTML = ''; // Clear loading message
            }

            if (searchResults && searchResults.length > 0) {
                for (const result of searchResults) {
                    const summary = await fetchArticleSummary(result.title, targetLang);
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <a href="https://${targetLang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}" target="_blank">
                            <strong>${result.title}</strong>
                        </a>
                        <p>${summary}</p>
                    `;
                    if (resultsContainer) {
                        resultsContainer.appendChild(listItem);
                    }
                }
            } else {
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<li>No results found.</li>';
                }
            }
        } else {
            if (resultsContainer) {
                resultsContainer.innerHTML = '<li>Please enter some search parameters or select a target language.</li>';
            }
        }
    });
} else {
    console.error("Element with ID 'search-form' not found. Submit listener not attached.");
}

// Function to add Enter key listener to trigger form submission
function addEnterKeySubmitListener() {
    const searchForm = document.getElementById('search-form');
    if (!searchForm) return; // Exit if form not found

    const inputFieldsToWatch = [
        'search-query',
        'exact-phrase',
        'without-words',
        'any-words',
        'incategory-value',
        'deepcat-value',
        'prefix-value',
        'subpageof-value',
        'linkfrom-value',
        'insource-value',
        'hastemplate-value',
        'filetype-value',
        'filesize-min',
        'filesize-max',
        'category-select' // The new dropdown
    ];

    inputFieldsToWatch.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    // Prevent default behavior (like form submission if it were default)
                    event.preventDefault();
                    // Manually trigger the form submission
                    searchForm.submit();
                }
            });
        }
    });
}


// Preset buttons functionality
// Using optional chaining for safety
document.getElementById('preset-easy')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set easy preset: only main query
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Example Search";
    generateSearchString();
});

document.getElementById('preset-middle')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set middle preset: main query, exact phrase, maybe one namespace
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Complex Query";
    const exactPhraseInput = document.getElementById('exact-phrase');
    if (exactPhraseInput) exactPhraseInput.value = "exact words";
    document.getElementById('ns-main')?.click(); // Check 'Article' namespace
    generateSearchString();
});

document.getElementById('preset-complex')?.addEventListener('click', () => {
    document.getElementById('search-form')?.reset();
    // Toggle checkboxes off and on to ensure they are unchecked
    document.getElementById('option-intitle')?.checked && document.getElementById('option-intitle').click();
    document.getElementById('option-intext')?.checked && document.getElementById('option-intext').click();
    document.querySelectorAll('#namespaces-options input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) checkbox.click(); // Uncheck all namespaces
    });

    // Set complex preset: multiple fields filled
    const searchInput = document.getElementById('search-query');
    if (searchInput) searchInput.value = "Advanced Topic";
    const exactPhraseInput = document.getElementById('exact-phrase');
    if (exactPhraseInput) exactPhraseInput.value = "specific phrase";
    const withoutWordsInput = document.getElementById('without-words');
    if (withoutWordsInput) withoutWordsInput.value = "unwanted";
    const anyWordsInput = document.getElementById('any-words');
    if (anyWordsInput) anyWordsInput.value = "optionA OR optionB";
    const incategoryValueInput = document.getElementById('incategory-value');
    if (incategoryValueInput) incategoryValueInput.value = "Science, Technology";
    document.getElementById('ns-main')?.click(); // Check 'Article' namespace
    document.getElementById('ns-file')?.click(); // Check 'File' namespace
    document.getElementById('option-fuzzy')?.click(); // Check fuzzy search
    generateSearchString();
});


// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTranslations(currentLang);
    applyTranslations();
    generateSearchString(); // Generate initial string on load
    addEnterKeySubmitListener(); // Add the new listener for Enter key
});

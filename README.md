# Wiki Search GUI

A modern, user-friendly interface for generating complex Wikipedia search queries. This tool helps users leverage the full power of Wikipedia's advanced search capabilities without needing to memorize complex syntax.

## Features

*   **Visual Search Builder:** Easily construct queries using form fields for keywords, exact phrases, exclusions, and more.
*   **Example Searches:** Clickable presets for common search scenarios (e.g., "Exact Phrase", "Category Search", "Date Range").
*   **Advanced Filters:**
    *   **Scope & Location:** Search in specific namespaces (User, File, Help), categories, or by title prefix.
    *   **Content & Technical:** Filter by file type, file size, templates used, or even regex within source code.
    *   **Date Filters:** Narrow down results by creation or modification date.
*   **Live Preview:** See the generated search string update in real-time.
*   **Direct Search:** One-click copy of the search URL or direct navigation to Wikipedia.
*   **Saved Searches:** Save your complex queries locally to reuse them later.
*   **Dual Language Support:** Fully localized in English and German.
*   **Responsive Design:** Works smoothly on desktop and mobile devices.

## Getting Started

### Installation

This is a static web application. No backend server or compilation is required.

1.  **Download:** Clone the repository or download the ZIP file.
    ```bash
    git clone https://github.com/MarkO75SU/wiki-gui.git
    ```
2.  **Run:** Open the `index.html` file in any modern web browser.

### Usage

1.  **Select Language:** Choose between English and German using the buttons in the header.
2.  **Basic Search:** Enter your keywords in the "Main Query" section.
3.  **Refine:** Toggle "Advanced Mode" to access powerful filters like namespaces, categories, and file properties.
4.  **Generate:** The tool automatically builds the search query string.
5.  **Search:** Click the generated link (or copy it) to perform the search on Wikipedia.

## Privacy & Legal

*   **Privacy:** This tool runs entirely in your browser (client-side). No search data is sent to any third-party server other than Wikipedia itself when you execute a search.
*   **Imprint (Impressum):** See `src/html/impressum_de.html` for the German legal notice required for private websites.
*   **License:** This project is provided for non-commercial use. See `LICENSE.md` for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

*   Built to make knowledge more accessible by simplifying the Wikipedia search syntax.

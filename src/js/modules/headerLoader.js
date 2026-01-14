export async function loadHeader(placeholderId, headerHtmlPath) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.error(`Header placeholder with ID '${placeholderId}' not found.`);
        return;
    }

    try {
        const response = await fetch(`${headerHtmlPath}?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const headerHtml = await response.text();
        placeholder.innerHTML = headerHtml;

    } catch (error) {
        console.error("Could not load header:", error);
    }
}
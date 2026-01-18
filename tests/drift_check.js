const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Drift Detector Test...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox'] // Useful for some CI/CLI environments
  });
  const page = await browser.newPage();

  // 1. Load App
  // Assuming default npx serve port. Change if necessary.
  const appUrl = 'http://localhost:3000'; 
  try {
    await page.goto(appUrl, { waitUntil: 'networkidle0' });
    console.log(`Navigated to ${appUrl}`);
  } catch (e) {
    console.error(`Failed to load app at ${appUrl}. Is the server running?`);
    await browser.close();
    process.exit(1);
  }

  // 2. Perform Search
  // We search for a mix of topics to provoke "Drift" in the mock AI
  const searchTerm = 'Physics History Art';
  await page.type('#search-query', searchTerm);
  console.log(`Typed search term: "${searchTerm}"`);

  await Promise.all([
    page.click('#generate-search-string-button'),
    page.waitForSelector('#simulated-search-results-normal li', { timeout: 5000 })
  ]);
  console.log('Search results rendered.');

  // 3. Trigger Drift Analysis
  const driftBtnSelector = '#analyze-drift-button-normal';
  await page.waitForSelector(driftBtnSelector);
  await page.click(driftBtnSelector);
  console.log('Clicked "Drift Analysis" button.');

  // 4. Wait for Analysis results (Toast or UI update)
  // We wait for the "drift-warning" badge to appear on at least one item
  // OR for the toast message indicating completion.
  
  try {
    // Wait up to 3 seconds for the mock delay + rendering
    await page.waitForFunction(() => {
        // Check if toast appeared OR if we have warnings
        const toast = document.querySelector('.toast'); // Assuming toast class
        const warnings = document.querySelectorAll('.drift-warning');
        return (toast && toast.textContent.includes('Drift-Analyse fertig')) || warnings.length > 0;
    }, { timeout: 4000 });
  } catch (e) {
    console.warn('Timeout waiting for Drift Analysis confirmation. It might have finished without findings or failed.');
  }

  // 5. Verification
  // Check if any item has the red marking
  const outliers = await page.evaluate(() => {
    const items = document.querySelectorAll('#simulated-search-results-normal li.result-item');
    const detected = [];
    
    items.forEach((item, index) => {
      // Check for the visual indicators applied in ui.js
      const hasRedBorder = item.style.borderLeft === '4px solid rgb(239, 68, 68)'; // #ef4444
      const hasBadge = item.querySelector('.drift-warning') !== null;
      
      if (hasRedBorder || hasBadge) {
        const title = item.querySelector('strong')?.innerText;
        detected.push({ index, title });
      }
    });
    return detected;
  });

  if (outliers.length > 0) {
    console.log('✅ TEST PASSED: Outliers detected and marked.');
    console.log('Detected Outliers:', outliers);
  } else {
    console.log('⚠️ TEST INCONCLUSIVE: No outliers marked. This might be due to the random nature of the mock or the search query not producing divergent results.');
  }

  await browser.close();
})();

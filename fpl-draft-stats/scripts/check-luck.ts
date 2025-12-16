import { chromium } from 'playwright';

async function checkLuck() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.goto('http://localhost:5182', { waitUntil: 'load', timeout: 120000 });

  // Wait for load
  await page.waitForTimeout(3000);

  // Click on H2H tab
  await page.click('button:has-text("H2H")');
  await page.waitForTimeout(1000);

  // Click on Luck sub-tab
  await page.click('button:has-text("Luck")');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({
    path: '/tmp/luck-tab.png',
    fullPage: true
  });

  console.log('Screenshot saved to /tmp/luck-tab.png');

  // Also log the luck data from the page
  const luckData = await page.evaluate(() => {
    // Try to get the luck data from the page state
    const cards = document.querySelectorAll('[class*="grid-cols-2"]');
    const results: string[] = [];
    cards.forEach(grid => {
      const buttons = grid.querySelectorAll('button');
      buttons.forEach(btn => {
        results.push(btn.textContent?.trim() || '');
      });
    });
    return results;
  });

  console.log('Luck card data:', luckData);

  await browser.close();
}

checkLuck().catch(console.error);

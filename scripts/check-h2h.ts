import { chromium } from 'playwright';

async function checkH2H() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.goto('http://localhost:5182', { waitUntil: 'load', timeout: 120000 });

  // Wait for data to load
  await page.waitForTimeout(5000);

  // Click on H2H tab
  await page.click('button:has-text("H2H")');
  await page.waitForTimeout(2000);

  // Take screenshot of Matrix
  await page.screenshot({
    path: '/tmp/h2h-matrix.png',
    fullPage: true
  });

  // Click on Fixtures sub-tab
  await page.click('button:has-text("Fixtures")');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({
    path: '/tmp/h2h-fixtures.png',
    fullPage: true
  });

  console.log('Screenshots saved');

  await browser.close();
}

checkH2H().catch(console.error);

import { chromium } from 'playwright';

async function checkTransfers() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.goto('http://localhost:5182', { waitUntil: 'load', timeout: 120000 });

  // Wait for data to load
  await page.waitForTimeout(5000);

  // Stay on Overview tab to see Transfer Value
  await page.screenshot({
    path: '/tmp/transfers.png',
    fullPage: true
  });

  console.log('Screenshot saved to /tmp/transfers.png');

  await browser.close();
}

checkTransfers().catch(console.error);

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.goto('http://localhost:5180', { waitUntil: 'networkidle' });

  // Wait a bit for any animations
  await page.waitForTimeout(2000);

  // Stay on Overview tab (default)
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: '/tmp/form-charts.png',
    fullPage: true
  });

  console.log('Screenshot saved to /tmp/form-charts.png');

  await browser.close();
}

takeScreenshot().catch(console.error);

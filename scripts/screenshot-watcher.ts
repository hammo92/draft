import { chromium, type Browser, type Page } from 'playwright';
import { watch } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const CONFIG = {
	watchDir: './src',
	outputPath: 'C:/tmp/claude/screenshots/screenshot.png',
	devServerUrl: 'http://localhost:5173',
	debounceMs: 800,
	viewport: { width: 1280, height: 800 },
	retryIntervalMs: 2000,
	maxRetries: 30
};

function timestamp(): string {
	return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function log(message: string): void {
	console.log(`[screenshot] ${timestamp()} - ${message}`);
}

async function ensureOutputDir(): Promise<void> {
	await mkdir(dirname(CONFIG.outputPath), { recursive: true });
}

async function waitForDevServer(): Promise<void> {
	log(`Waiting for dev server at ${CONFIG.devServerUrl}...`);

	for (let i = 0; i < CONFIG.maxRetries; i++) {
		try {
			const response = await fetch(CONFIG.devServerUrl);
			if (response.ok) {
				log('Dev server is ready');
				return;
			}
		} catch {
			// Server not ready yet
		}
		await new Promise(resolve => setTimeout(resolve, CONFIG.retryIntervalMs));
	}

	throw new Error(`Dev server not available after ${CONFIG.maxRetries} retries`);
}

async function captureScreenshot(page: Page): Promise<void> {
	try {
		await page.screenshot({ path: CONFIG.outputPath, fullPage: false });
		log(`Captured → ${CONFIG.outputPath}`);
	} catch (error) {
		log(`Capture failed: ${error}`);
	}
}

async function main(): Promise<void> {
	await ensureOutputDir();
	await waitForDevServer();

	log('Launching browser...');
	const browser: Browser = await chromium.launch({ headless: true });
	const page: Page = await browser.newPage();
	await page.setViewportSize(CONFIG.viewport);

	log(`Navigating to ${CONFIG.devServerUrl}`);
	await page.goto(CONFIG.devServerUrl, { waitUntil: 'networkidle' });

	// Initial capture
	await captureScreenshot(page);
	log(`Watching ${CONFIG.watchDir} for changes...`);

	// Debounce state
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Watch for file changes
	const watcher = watch(
		CONFIG.watchDir,
		{ recursive: true },
		(eventType, filename) => {
			if (!filename) return;

			// Only watch relevant files
			if (!filename.match(/\.(svelte|ts|css|js)$/)) return;

			log(`${filename} changed`);

			// Debounce
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			debounceTimer = setTimeout(async () => {
				try {
					// Wait a bit more for HMR to complete
					await new Promise(resolve => setTimeout(resolve, 300));

					// Reload to ensure fresh state (HMR sometimes has stale state)
					await page.reload({ waitUntil: 'networkidle' });
					await captureScreenshot(page);
				} catch (error) {
					log(`Error after change: ${error}`);
				}
			}, CONFIG.debounceMs);
		}
	);

	// Handle graceful shutdown
	process.on('SIGINT', async () => {
		log('Shutting down...');
		watcher.close();
		await browser.close();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		log('Shutting down...');
		watcher.close();
		await browser.close();
		process.exit(0);
	});

	// Keep process alive
	log('Ready. Press Ctrl+C to stop.');
	await new Promise(() => {});
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});

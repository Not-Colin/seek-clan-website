// test-screenshot.js - FINAL DEFINITIVE TEST with Desktop Viewport

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const USERNAME_TO_TEST = 'Not Co l in';
const OUTPUT_FILE = 'ground-truth-DESKTOP.png';
const ELEMENT_SELECTOR = '.runescape-panel';
// ---------------------

async function runDesktopTest() {
  console.log('--- STARTING DESKTOP VIEWPORT TEST (HEADLESS) ---');
  let browser = null;

  try {
    console.log('Launching headless browser with stealth and desktop viewport...');
    browser = await puppeteer.launch({
      headless: 'new', // Running in the same mode as the server
    });

    const page = await browser.newPage();
    const formattedUsername = encodeURIComponent(USERNAME_TO_TEST);
    const targetUrl = `https://www.runeprofile.com/${formattedUsername}`;

    // --- THIS IS THE DEFINITIVE FIX ---
    // We are forcing the headless browser to identify as a full desktop screen.
    await page.setViewport({ width: 1920, height: 1080 });
    // ---------------------------------

    console.log(`Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    console.log('Page loaded. Waiting for the element to appear...');
    await page.waitForSelector(ELEMENT_SELECTOR, { timeout: 30000 });

    const element = await page.$(ELEMENT_SELECTOR);
    if (!element) throw new Error("Element not found after waiting.");

    console.log('Taking screenshot of the element...');
    const screenshotBuffer = await element.screenshot({
        type: 'png',
        omitBackground: true,
    });

    fs.writeFileSync(OUTPUT_FILE, screenshotBuffer);
    console.log(`\n✅ Success! Desktop screenshot saved as "${OUTPUT_FILE}".`);

  } catch (error) {
    console.error('\n❌ An error occurred during the test:', error);
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

runDesktopTest();
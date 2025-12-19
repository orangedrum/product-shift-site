import { webkit } from 'playwright';

async function runTest() {
  console.log('Attempting to launch Playwright with WebKit (Safari)...');
  try {
    // Using webkit to control Safari's engine
    const browser = await webkit.launch({ headless: false });
    console.log('SUCCESS: Browser launched successfully!');
    await browser.close();
    console.log('Browser closed.');
  } catch (error) {
    console.error('ERROR: Failed to launch browser.');
    console.error(error);
  }
}

runTest();
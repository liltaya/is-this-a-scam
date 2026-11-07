import { chromium, devices } from '@playwright/test';
const [url, outDir, routes] = [process.argv[2], process.argv[3], JSON.parse(process.argv[4])];
const browser = await chromium.launch();
const sizes = { desktop: { viewport: { width: 1280, height: 800 } }, phone: devices['iPhone 13'] };
for (const [name, ctxOpts] of Object.entries(sizes)) {
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  for (const { route, slug } of routes) {
    await page.goto(url + route, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outDir + '/' + slug + '-' + name + '.png', fullPage: false });
  }
  await context.close();
}
await browser.close();

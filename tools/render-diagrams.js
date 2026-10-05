// Writes img/<exercise>.png (start and finish) and img/thumb/<exercise>.png
// (finish position, square) for every exercise.
// Needs Node and Playwright with Chromium: `npx playwright install chromium` once,
// then run `node tools/render-diagrams.js` from the repository root.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'img');
  fs.mkdirSync(path.join(outDir, 'thumb'), { recursive: true });
  // software WebGL keeps the output identical on any machine
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  page.on('pageerror', e => { console.error(e); process.exitCode = 1; });
  await page.goto('file://' + path.join(__dirname, 'diagrams.html') + '?manual');
  const only = process.argv.slice(2);
  const ids = only.length ? only : await page.evaluate(() => window.DIAGRAM_IDS);
  for (const id of ids) {
    const t0 = Date.now();
    const url = await page.evaluate(i => window.renderDiagram(i), id);
    fs.writeFileSync(path.join(outDir, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    const thumb = await page.evaluate(i => window.renderDiagram(i, 240, 3, true), id);
    fs.writeFileSync(path.join(outDir, 'thumb', id + '.png'), Buffer.from(thumb.split(',')[1], 'base64'));
    console.log(id, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await browser.close();
})();

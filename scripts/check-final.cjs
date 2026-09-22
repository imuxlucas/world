const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/assets/manifest.json'), 'utf8'));
    for (const asset of manifest.assets) {
      await page.goto(`http://127.0.0.1:5178/#${asset.id}`);
      await page.locator(`canvas[data-asset="${asset.id}"][data-loaded="true"]`).waitFor({ timeout: 90000 });
      await page.locator('canvas').screenshot({ path: path.join(root, `public/assets/${asset.id}/thumbnail.png`) });
      if (asset.id === 'link') await page.screenshot({ path: path.join(root, 'artifacts/studio-link-final.png') });
    }
    await page.goto('http://127.0.0.1:5178/#carousel');
    const canvas = page.locator('canvas[data-asset="carousel"][data-loaded="true"]');
    await canvas.waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(root, 'artifacts/studio-final.png') });
    const before = await canvas.screenshot();
    await page.locator('#explode').fill('0.7');
    await page.getByRole('button', { name: '重置视角及部件显示', exact: true }).click();
    assert.equal(await page.locator('#explode').inputValue(), '0');
    await page.screenshot({ path: path.join(root, 'artifacts/studio-reset-final.png') });
    await page.getByRole('tab', { name: '审阅', exact: true }).click();
    await page.locator('#review-note').fill('Final QA isolated browser note');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出审阅', exact: true }).click();
    const download = await downloadPromise;
    const file = path.join(root, 'artifacts/review-export-test.json');
    await download.saveAs(file);
    const record = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(record.assets.find(a => a.id === 'carousel').note, 'Final QA isolated browser note');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(root, 'artifacts/final-check.json'), JSON.stringify({ allLatestModelsLoaded: true, exportReviews: true, resetControls: true, errors }, null, 2));
    console.log(JSON.stringify({ allLatestModelsLoaded: true, exportReviews: true, resetControls: true, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

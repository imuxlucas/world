const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:5178/#island');
    const canvas = page.locator('canvas[data-asset="island"][data-loaded="true"]');
    await canvas.waitFor();
    await canvas.screenshot({ path: path.join(root, 'artifacts/island-v007-three.png'), timeout: 90000 });
    for (const name of ['紧凑直背凸起底盘', '穆夏陶瓷铺装']) {
      await page.getByRole('button', { name: `独显${name}`, exact: true }).click();
      await page.getByRole('button', { name: `退出独显${name}`, exact: true }).waitFor();
      await canvas.screenshot({ path: path.join(root, `artifacts/island-v007-${name === '紧凑直背凸起底盘' ? 'body' : 'paving'}.png`), timeout: 90000 });
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: '隐藏心形函数图', exact: true }).click();
    await page.getByRole('button', { name: '显示心形函数图', exact: true }).waitFor();
    await page.getByRole('button', { name: '重置视角及部件显示', exact: true }).click();
    const record = JSON.parse(await fs.readFile(path.join(root, 'public/assets/island/parts.json')));
    assert.equal(record.modelUrl, '/assets/island/v007/model.glb');
    const glb = await fs.readFile(path.join(root, 'public', record.modelUrl));
    const jsonLength = glb.readUInt32LE(12);
    const gltf = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength));
    assert.ok(gltf.images?.length === 2 && gltf.images.every(image => image.bufferView !== undefined));
    assert.ok(!gltf.nodes.some(node => /plaque/i.test(node.name || '')));
    for (const part of record.parts) assert.ok(gltf.nodes.some(node => node.name === part.id));
    assert.deepEqual(errors, []);
    const result = { modelVersion: 'v007', embeddedTextures: 2, semanticParts: record.parts.length, isolateAndReset: true, errors };
    await fs.writeFile(path.join(root, 'artifacts/island-v007-check.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

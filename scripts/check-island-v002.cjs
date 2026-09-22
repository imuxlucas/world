const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://127.0.0.1:5178/#island');
    const canvas = page.locator('canvas[data-asset="island"][data-loaded="true"]');
    await canvas.waitFor({ timeout: 90000 });
    await page.screenshot({ path: path.join(root, 'artifacts/island-v002-studio.png') });
    await canvas.screenshot({ path: path.join(root, 'artifacts/island-v002-three.png') });
    for (const name of ['弧形公式铭牌', '穆夏陶瓷铺装']) {
      await page.getByRole('button', { name: `独显${name}`, exact: true }).click();
      await page.getByRole('button', { name: `退出独显${name}`, exact: true }).waitFor();
      await canvas.screenshot({ path: path.join(root, `artifacts/island-v002-${name === '弧形公式铭牌' ? 'plaque' : 'paving'}.png`) });
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: '隐藏心形函数图', exact: true }).click();
    await page.getByRole('button', { name: '显示心形函数图', exact: true }).waitFor();
    await page.getByRole('button', { name: '重置视角及部件显示', exact: true }).click();
    await page.getByRole('button', { name: '隐藏心形函数图', exact: true }).waitFor();
    const record = JSON.parse(await fs.readFile(path.join(root, 'public/assets/island/parts.json')));
    assert.equal(record.modelUrl, '/assets/island/v002/model.glb');
    const glb = await fs.readFile(path.join(root, 'public', record.modelUrl));
    const gltf = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
    assert.ok(gltf.images?.length === 1 && gltf.images[0].bufferView !== undefined, 'Floor image embedded in GLB');
    assert.ok(gltf.materials.some(m => m.pbrMetallicRoughness?.baseColorTexture), 'Actual textured floor material');
    for (const part of record.parts) assert.ok(gltf.nodes.some(n => n.name === part.id));
    const report = JSON.parse(await fs.readFile(path.join(root, 'public/assets/island/v002/geometry-report.json')));
    assert.ok(report.objects.every(o => !o.degenerateFaces && !o.nonFiniteCoordinates && !o.nonManifoldInteriorEdges));
    assert.ok(report.objects.filter(o => !o.mesh.includes('paving')).every(o => !o.boundaryEdges));
    assert.deepEqual(errors, []);
    const result = { modelVersion: 'v002', embeddedFloorImage: true, semanticParts: record.parts.length, isolateAndReset: true, closedSolidParts: true, errors };
    await fs.writeFile(path.join(root, 'artifacts/island-v002-check.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

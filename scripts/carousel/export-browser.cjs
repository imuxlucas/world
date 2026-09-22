const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const version = process.argv[2] || 'v002';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 1100 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:5178/scripts/carousel/export.html');
    await page.waitForFunction(() => document.querySelector('#download')?.getAttribute('href')?.startsWith('blob:'), null, { timeout: 180000 });
    const stats = await page.evaluate(async () => { const { stats, buffer } = await window.__carouselExport; return { ...stats, bytes: buffer.byteLength }; });
    const dir = path.join(root, 'public/assets/carousel',version);
    await fs.mkdir(dir, { recursive: true });
    const downloadPromise = page.waitForEvent('download');
    await page.click('#download');
    const download = await downloadPromise;
    await download.saveAs(path.join(dir, 'model.glb'));
    await page.screenshot({ path: path.join(dir, 'source-preview.png') });
    await fs.writeFile(path.join(dir, 'export-stats.json'), JSON.stringify({ ...stats, errors }, null, 2));
    const partsFile = path.join(root, 'public/assets/carousel/parts.json');
    const asset = JSON.parse(await fs.readFile(partsFile, 'utf8'));
    asset.modelUrl = `/assets/carousel/${version}/model.glb`;
    asset.subtitle = '蓝粉瓷彩 · 波浪花檐与旗帜 v002';
    asset.description = '按选定参考图精修：落地双层台阶、蓝粉花瓣底座、郁金香中心柱、扇形条纹伞顶、花檐和旗帜；白瓷木马配心形蓝粉马鞍。';
    asset.source.path = `asset-sources/carousel/${version}/source.blend`;
    if(version==='v003')asset.subtitle='浮雕花檐、珍珠彩灯与精修木马 v003';
    asset.notes = ['作者授权复用；保留原作者署名与许可。','底座改为平底实心双层台阶，最低点为地面 y=0。','四张新彩绘贴图使用内置 imagegen 生成，源图与提示词保存在 v002。','保留拍立得、吊杆、吊饰几何；照片窗口暂用蓝粉纸面，待填入真实项目照片。','木马白瓷体在 Blender 中融合接缝，马鞍与马镫重新调整。'];
    const descriptions={base:'实心平底双层台阶、粉色花瓣彩绘与瓷白台面。',column:'蓝粉郁金香中心柱，细香槟金分段收边。',canopy:'蓝粉瓷白条纹、波浪花檐、珍珠包边、菱形吊饰与顶部粉旗。',horses:'三匹白瓷木马、浅金鬃毛、蓝粉心形马鞍。',frames:'原有拍立得与吊饰造型，更新为蓝粉纸面与珐琅配色。'};
    asset.parts.forEach(part=>{if(descriptions[part.id])part.description=descriptions[part.id];});
    asset.stats = { meshes: stats.meshes, triangles: stats.triangles, materials: stats.materials, bytes: stats.bytes };
    await fs.writeFile(partsFile, JSON.stringify(asset, null, 2) + '\n');
    console.log(JSON.stringify({ path: path.join(dir, 'model.glb'), ...stats, errors }));
  } catch(error) { console.error('Browser errors:',errors);console.error(await page.locator('#stats').textContent());throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

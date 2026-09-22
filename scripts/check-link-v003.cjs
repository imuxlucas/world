const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const version = process.argv[2] || 'v003';
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1250,height:900}});
  page.setDefaultTimeout(90000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://127.0.0.1:5178/#link');
    const canvas = page.locator('canvas[data-asset="link"][data-loaded="true"]');
    await canvas.waitFor();
    await page.screenshot({path:path.join(root,`artifacts/link-${version}-three.png`),timeout:90000});
    await page.getByRole('button',{name:'独显双心丘比特',exact:true}).click();
    await page.getByRole('button',{name:'退出独显双心丘比特',exact:true}).waitFor();
    await page.screenshot({path:path.join(root,`artifacts/link-${version}-cupid.png`),timeout:90000});
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'重置视角及部件显示',exact:true}).click();
    const expectedParts = version === 'v008' ? 11 : 9;
    assert.equal(await canvas.getAttribute('data-parts'),String(expectedParts));
    if(version === 'v008') {
      for (const name of ['透光心形眼镜','丘比特眼部','双 A 架与后撑']) {
        await page.getByRole('button',{name:`独显${name}`,exact:true}).click();
        await page.getByRole('button',{name:`退出独显${name}`,exact:true}).waitFor();
        await page.keyboard.press('Escape');
      }
    }
    assert.deepEqual(errors,[]);
    const rec = JSON.parse(await fs.readFile(path.join(root,'public/assets/link/parts.json')));
    assert.equal(rec.modelUrl,`/assets/link/${version}/model.glb`);
    const integration = JSON.parse(await fs.readFile(path.join(root,'asset-sources/link/v003/cupid-integration.json')));
    assert.equal(integration.webTriangles,120000);
    assert.equal(integration.supportRayHit,true);
    assert.equal(integration.images.length,3);
    assert.ok(integration.images.every(i => i.packed));
    const clearance = ['v004','v005','v006','v007'].includes(version) ? JSON.parse(await fs.readFile(path.join(root,`asset-sources/link/${version}/clearance-check.json`))) : null;
    if (clearance) assert.ok(clearance.cupidCabinClearanceLowerBound > (version === 'v004' ? .07 : .015));
    if(['v006','v007'].includes(version)) assert.ok(clearance.frontOcclusionSamples.every(p => p.covered));
    if(version === 'v007') assert.equal(clearance.cupidAndBeamTransformsUnchanged,true);
    await fs.writeFile(path.join(root,`artifacts/link-${version}-check.json`),JSON.stringify({parts:expectedParts,loaded:true,isolationAndReset:true,errors,integration,clearance},null,2));
    console.log(`Link ${version} browser checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });

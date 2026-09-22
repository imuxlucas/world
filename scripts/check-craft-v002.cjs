const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://127.0.0.1:5178/#craft');
    const canvas = page.locator('canvas[data-asset="craft"][data-loaded="true"]');
    await canvas.waitFor();
    await canvas.screenshot({path:path.join(root,'artifacts/craft-v002-three.png'),timeout:90000});
    for (const [name,id] of [['分片玻璃','glass'],['代码屏幕','screens']]) {
      await page.getByRole('button',{name:`独显${name}`,exact:true}).click();
      await page.getByRole('button',{name:`退出独显${name}`,exact:true}).waitFor();
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button',{name:'重置视角及部件显示',exact:true}).click();
    const record=JSON.parse(await fs.readFile(path.join(root,'public/assets/craft/parts.json')));
    assert.equal(record.modelUrl,'/assets/craft/v002/model.glb');
    assert.equal(await canvas.getAttribute('data-parts'),'7');
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(root,'artifacts/craft-v002-check.json'),JSON.stringify({version:'v002',parts:7,isolationAndReset:true,errors},null,2));
    console.log('Craft v002 browser checks passed');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});

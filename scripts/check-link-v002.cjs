const { chromium } = require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1250,height:900}});page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto('http://127.0.0.1:5178/#link');
  const canvas=page.locator('canvas[data-asset="link"][data-loaded="true"]');await canvas.waitFor();
  await canvas.screenshot({path:path.join(root,'artifacts/link-v002-three.png'),timeout:90000});
  for(const name of ['双 A 架与后撑','电脑与手机','底座心形装饰']){
   await page.getByRole('button',{name:`独显${name}`,exact:true}).click();
   await page.getByRole('button',{name:`退出独显${name}`,exact:true}).waitFor();
   await page.keyboard.press('Escape');
  }
  await page.getByRole('button',{name:'重置视角及部件显示',exact:true}).click();
  assert.equal(await canvas.getAttribute('data-parts'),'9');assert.deepEqual(errors,[]);
  const rec=JSON.parse(await fs.readFile(path.join(root,'public/assets/link/parts.json')));
  assert.equal(rec.modelUrl,'/assets/link/v002/model.glb');
  await fs.writeFile(path.join(root,'artifacts/link-v002-check.json'),JSON.stringify({parts:9,loaded:true,isolationAndReset:true,errors,cupid:'Local candidate; stock resource selection pending'},null,2));
  console.log('Link v002 browser checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

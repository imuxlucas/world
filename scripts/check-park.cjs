const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:960},reducedMotion:'no-preference'});page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:5178/#park');const canvas=page.locator('canvas[data-park="true"][data-loaded="true"]');await canvas.waitFor();console.log('All five models loaded');
  await page.waitForFunction(()=>Number(document.querySelector('canvas[data-park]')?.getAttribute('data-dog-time'))>.5);
  const start=JSON.parse(await canvas.getAttribute('data-dog-position'));
  await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('canvas[data-park]')?.getAttribute('data-dog-position')||'[]');return Math.hypot(q[0]-p[0],q[2]-p[2])>.08;},start);
  const moved=JSON.parse(await canvas.getAttribute('data-dog-position'));console.log('Dog translated',start,moved);
  await canvas.focus();await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('canvas[data-park]')?.getAttribute('data-paused')==='true');
  const paused=await canvas.getAttribute('data-dog-time');
  await page.screenshot({path:'artifacts/park-desktop.png',timeout:120000});console.log('Desktop captured');
  assert.equal(await canvas.getAttribute('data-dog-time'),paused);
  await page.locator('.park-brand').click();
  assert.equal(await canvas.getAttribute('data-models'),'5');assert.deepEqual(errors,[]);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/park-mobile.png',timeout:120000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await canvas.focus();await page.keyboard.press('Space');
  await page.waitForFunction(t=>Number(document.querySelector('canvas[data-park]')?.getAttribute('data-dog-time'))>Number(t),paused);
  await fs.writeFile('artifacts/park-check.json',JSON.stringify({models:5,dogMoved:{start,moved},pauseResume:true,mobileOverflow:false,errors},null,2));
  console.log('Park browser checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

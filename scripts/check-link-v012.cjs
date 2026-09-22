const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/link-base-review.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Link v012 base review</title>'}));
  await page.goto('http://127.0.0.1:5178/link-base-review.html');
  await page.evaluate(async()=>{window.preview=await(await import('/scripts/preview-link-motion.ts')).preview('v012');});
  for(const view of ['three-quarter','base','mat']){
   await page.evaluate(v=>window.preview.set(v,0),view);
   await page.locator('canvas').screenshot({path:`artifacts/link-v012-${view}.png`});
  }
  assert.deepEqual(errors,[]);console.log('V012 base, mat and full model renders captured');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

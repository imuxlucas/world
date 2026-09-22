const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const checks={};
  try{
    await page.goto('http://127.0.0.1:5178/#park');
    const canvas=page.locator('canvas[data-park="true"][data-loaded="true"]');
    await canvas.waitFor();
    console.log('Five models loaded; checking simplified UI.');
    assert.equal(await canvas.getAttribute('data-models'),'5');
    assert.equal(await page.title(),'Lucas‘ World');
    const logo=page.getByRole('img',{name:'Lucas‘ World',exact:true});
    await logo.waitFor();
    assert(await logo.evaluate(img=>img.complete&&img.naturalWidth>0));
    for(const value of ['½ Fun + ½ Math','2026 H2：主观能动，夯实体验','拖动环视 · 滚动缩放']) assert.equal(await page.getByText(value,{exact:true}).count(),1);
    assert.equal(await page.locator('.park-page button').count(),0);
    assert.equal(await page.locator('.park-caption,.park-wordmark,.park-library,.park-live').count(),0);
    assert.equal(await page.locator('.park-credit').count(),0);
    assert.equal(await logo.getAttribute('src'),'/branding/lucas-world-v003.svg');
    checks.visibleText=await page.locator('.park-page').innerText();
    checks.reducedMotion=await canvas.getAttribute('data-paused');
    assert.equal(checks.reducedMotion,'true');
    await page.screenshot({path:'artifacts/park-branding-desktop.png',timeout:120000});
    checks.sizes=[];
    for(const [width,height] of [[390,844],[360,780],[844,390],[1440,1000]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const metrics=await page.evaluate(()=>{
        const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
        const f=document.querySelector('.park-footer');const range=document.createRange();range.selectNodeContents(f);const r=range.getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
          documentSize:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],
          logo:bounds('.park-brand'),edition:bounds('.park-edition'),editionLineHeight:parseFloat(getComputedStyle(document.querySelector('.park-edition')).lineHeight),editionPadding:parseFloat(getComputedStyle(document.querySelector('.park-edition')).paddingTop),footerCenter:r.x+r.width/2,
          background:getComputedStyle(document.querySelector('.park-page')).backgroundColor};
      });
      assert(!metrics.overflow,JSON.stringify({width,height,...metrics}));
      assert(metrics.logo.right<metrics.edition.x);
      assert(Math.abs(metrics.edition.height-metrics.editionPadding-metrics.editionLineHeight)<1);
      assert(Math.abs(metrics.footerCenter-width/2)<2);
      assert.equal(metrics.background,'rgb(255, 255, 255)');
      checks.sizes.push({width,height,...metrics});
      if(width===390)await page.screenshot({path:'artifacts/park-branding-mobile.png',timeout:120000});
    }
    // The low-noise layout retains pause access on the canvas, without UI buttons.
    await canvas.focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.querySelector('canvas[data-park]').dataset.paused==='false');
    await page.waitForFunction(()=>Number(document.querySelector('canvas[data-park]').dataset.dogTime)>.15);
    const started=await canvas.getAttribute('data-dog-time');
    await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.querySelector('canvas[data-park]').dataset.paused==='true');
    checks.keyboardPauseResume=Number(started)>0;
    await page.getByRole('link',{name:'Lucas‘ World，回到参考视角',exact:true}).click();
    assert.equal(await canvas.getAttribute('data-paused'),'true');
    checks.logoResetsWithoutResuming=true;
    checks.motionModules=Object.keys(JSON.parse(await canvas.getAttribute('data-motion-times')||'{}'));
    assert.deepEqual(errors,[]);
    checks.errors=errors;checks.status='passed';
    await fs.writeFile('artifacts/park-branding-check.json',JSON.stringify(checks,null,2));
    console.log(JSON.stringify(checks,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

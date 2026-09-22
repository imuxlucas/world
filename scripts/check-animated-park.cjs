const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:960},reducedMotion:'no-preference'});
 page.setDefaultTimeout(120000);
 const errors=[],report={};
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const frame=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const seek=async(value)=>{
  await page.getByRole('slider',{name:'动画时间',exact:true}).evaluate((el,value)=>{
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
   setter.call(el,String(value));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
  await frame();
 };
 try{
  await page.goto('http://127.0.0.1:5178/#park');
  let canvas=page.locator('canvas[data-park][data-loaded=true]');await canvas.waitFor();
  await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas[data-park]')?.dataset.motionTimes||'{}').carousel>1);
  const moving=JSON.parse(await canvas.getAttribute('data-motion-times'));
  assert.deepEqual(Object.keys(moving).sort(),['carousel','craft','link']);
  await canvas.focus();await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('canvas[data-park]')?.dataset.paused==='true');
  await page.waitForFunction(()=>document.querySelector('video[data-craft-hologram]')?.paused===true);
  const paused=await canvas.getAttribute('data-motion-times'),dogTime=await canvas.getAttribute('data-dog-time');
  await page.screenshot({path:'artifacts/animated-park-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/animated-park-mobile.png'});
  assert.equal(await canvas.getAttribute('data-motion-times'),paused);assert.equal(await canvas.getAttribute('data-dog-time'),dogTime);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await canvas.focus();await page.keyboard.press('Space');
  await page.waitForFunction(t=>Number(JSON.parse(document.querySelector('canvas[data-park]')?.dataset.motionTimes).carousel)>t,JSON.parse(paused).carousel);
  report.park={allThreeAdvance:true,spacePauseResume:true,dogPausesTogether:true,mobileOverflow:false};
  await page.setViewportSize({width:1440,height:1000});
  for(const id of ['link','carousel','craft']){
   await page.goto(`http://127.0.0.1:5178/#${id}`);
   canvas=page.locator(`canvas[data-asset=${id}][data-loaded=true]`);await canvas.waitFor();
   await page.getByRole('button',{name:'暂停主体动画',exact:true}).click();await frame();
   await seek(6);
   assert.equal(await canvas.getAttribute('data-animation-time'),'6.000',`${id}: seek did not apply`);
   if(id==='craft')await page.waitForFunction(()=>{const v=document.querySelector('video[data-craft-hologram]');return v?.paused&&Math.abs(v.currentTime-6)<.05;});
   await canvas.screenshot({path:`artifacts/animated-${id}-6s.png`});
   assert.equal(await canvas.getAttribute('data-animation-time'),'6.000');
   await page.getByRole('combobox',{name:'动画速度',exact:true}).selectOption('1.5');
   await page.getByRole('button',{name:'播放主体动画',exact:true}).click();
   await page.waitForFunction(id=>Number(document.querySelector(`canvas[data-asset=${id}]`)?.dataset.animationTime)>6.1,id);
   if(id==='craft')await page.waitForFunction(()=>{const v=document.querySelector('video[data-craft-hologram]');return v&&!v.paused&&v.playbackRate===1.5;});
   await page.getByRole('button',{name:'暂停主体动画',exact:true}).click();
   const reset=page.getByRole('button',{name:'重置视角及部件显示',exact:true});
   if(await reset.count()){await reset.click();await frame();assert.equal(await canvas.getAttribute('data-animation-time'),'0.000');}
   report[id]={loaded:true,seek:6,pauseResume:true,speedControl:true};
  }
  // The preference affects initial playback; users can explicitly play afterward.
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:5178/#park');
  await page.locator('canvas[data-park][data-loaded=true]').waitFor();
  await page.waitForFunction(()=>document.querySelector('canvas[data-park]')?.dataset.paused==='true');
  assert.ok(Object.values(JSON.parse(await page.locator('canvas[data-park]').getAttribute('data-motion-times'))).every(t=>t===0));
  report.reducedMotionStartsPaused=true;
  assert.equal(await page.locator('video[data-craft-hologram]').count(),1);
  assert.equal(await page.locator('video[data-craft-hologram]').evaluate(v=>v.paused),true);
  report.craftHologram={seek:true,speed:true,parkPause:true,singleVideoAfterNavigation:true,reducedMotionPaused:true};
  assert.deepEqual(errors,[]);
  await fs.writeFile('artifacts/animated-park-check.json',JSON.stringify({report,errors},null,2));
  console.log(JSON.stringify({report,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

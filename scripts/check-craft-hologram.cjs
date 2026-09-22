const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:900,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/craft-hologram-review.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Craft hologram review</title>'}));
 await page.goto('http://127.0.0.1:5178/craft-hologram-review.html');
 await page.evaluate(async()=>{window.review=await(await import('/scripts/preview-craft-hologram.ts')).previewCraft();});
 const shots=[['front',0,0,'full',false],['side',Math.PI/2,6,'full',false],['back',Math.PI,12,'full',false],['core-front',0,0,'core',true],['core-side',Math.PI/2,0,'core',true],['core-back',Math.PI,0,'core',true],['core-white',Math.PI/4,18,'core',false]];
 for(const [name,angle,time,mode,dark] of shots){await page.evaluate(async args=>window.review.set(...args),[angle,time,mode,dark]);await page.locator('canvas').screenshot({path:`artifacts/craft-hologram-${name}.png`});}
 const report=await page.evaluate(()=>window.review.verify());assert.equal(report.innerTubes,17);assert.equal(report.videoTexture,true);assert.equal(report.videoDuration,20);assert.ok(Math.abs(report.hologramFloor-.391)<1e-5);
 const silhouettes=[];
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  await page.evaluate(a=>window.review.set(a,3,'image',false),angle);
  silhouettes.push(await page.evaluate(()=>{
   const source=window.review.renderer.domElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let minX=canvas.width,maxX=0,minY=canvas.height,maxY=0,count=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(Math.min(pixels[i],pixels[i+1],pixels[i+2])<235){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}}
   return {width:maxX-minX+1,height:maxY-minY+1,count,fill:count/((maxX-minX+1)*(maxY-minY+1))};
  }));
 }
 assert.ok(silhouettes.every(s=>s.width>60&&s.height>300&&s.fill<.75&&s.fill>.1),'Video has a solid background or vanished edge-on');
 assert.ok(Math.max(...silhouettes.map(s=>s.width))-Math.min(...silhouettes.map(s=>s.width))<=2,'Billboard width changed when circling the core');
 await page.evaluate(()=>window.review.set(0,18,'core',true));
 await page.evaluate(()=>window.review.motion.setPlayback(true,1.5));await page.waitForFunction(()=>document.querySelector('video[data-craft-hologram]').currentTime>18.2);
 await page.evaluate(()=>window.review.motion.setPlayback(false));const paused=await page.locator('video').evaluate(v=>v.currentTime);await page.screenshot({path:'artifacts/craft-hologram-paused.png'});assert.equal(await page.locator('video').evaluate(v=>v.currentTime),paused);
 await page.evaluate(()=>{window.review.motion.dispose();if(window.review.root.getObjectByName('craft-core-neon-rotor')||window.review.root.getObjectByName('craft-hologram'))throw new Error('Hologram was not disposed');});assert.equal(await page.locator('video[data-craft-hologram]').count(),0);
 assert.deepEqual(errors,[]);await fs.writeFile('artifacts/craft-hologram-check.json',JSON.stringify({...report,silhouettes,pauseAndSpeed:true,disposed:true,errors},null,2));console.log(JSON.stringify({...report,silhouettes},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

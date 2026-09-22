const { chromium }=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:5178/#carousel');
  const canvas=page.locator('canvas[data-asset="carousel"][data-loaded="true"]');await canvas.waitFor();
  await canvas.screenshot({path:path.join(root,'artifacts/carousel-v002-three.png'),timeout:90000});
  for(const label of ['圆形底座','三匹雕刻木马','伞顶与花檐']){
   await page.getByRole('button',{name:`独显${label}`,exact:true}).click();
   await canvas.screenshot({path:path.join(root,`artifacts/carousel-v002-${label}.png`),timeout:90000});
   await page.keyboard.press('Escape');
  }
  await page.getByRole('button',{name:'重置视角及部件显示',exact:true}).click();
  const asset=JSON.parse(await fs.readFile(path.join(root,'public/assets/carousel/parts.json')));
  assert.equal(asset.modelUrl,'/assets/carousel/v002/model.glb');
  const data=await fs.readFile(path.join(root,'public',asset.modelUrl));
  const gltf=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
  for(const p of asset.parts)assert.ok(gltf.nodes.some(n=>n.name===p.id));
  assert.ok(gltf.nodes.some(n=>n.name.startsWith('Waving rose flag')));
  assert.ok(gltf.images.length>=4 && gltf.images.every(i=>i.bufferView!==undefined));
  assert.deepEqual(errors,[]);
  const report={version:'carousel-v002',parts:asset.parts.length,embeddedImages:gltf.images.length,partIsolation:true,errors};
  await fs.writeFile(path.join(root,'artifacts/carousel-v002-check.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

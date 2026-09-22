const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1500,height:1050}});page.setDefaultTimeout(120000);
 const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const [id,version] of [['carousel','v005']]){
   const record=JSON.parse(await fs.readFile(path.join(root,`public/assets/${id}/parts.json`)));
   assert.equal(record.modelUrl,`/assets/${id}/${version}/model.glb`);
   const data=await fs.readFile(path.join(root,'public',record.modelUrl));const gltf=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
   for(const part of record.parts)assert.ok(gltf.nodes.some(n=>n.name===part.id));
   if(id==='carousel')assert.equal(gltf.nodes.filter(n=>n.name.startsWith('Pastel heart pendant')).length,12);
   await page.goto(`http://127.0.0.1:5178/#${id}`);
   const canvas=page.locator(`canvas[data-asset="${id}"][data-loaded="true"]`);await canvas.waitFor();
   await canvas.screenshot({path:path.join(root,`artifacts/hanger-fix-${id}.png`),timeout:120000});
   const part=record.parts[0];await page.getByRole('button',{name:`独显${part.name}`,exact:true}).click();
   await page.getByRole('button',{name:`退出独显${part.name}`,exact:true}).waitFor();await page.keyboard.press('Escape');
   report.push({id,version,parts:record.parts.length,loaded:true});
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(root,'artifacts/hanger-fix-check.json'),JSON.stringify({report,errors},null,2));console.log({report,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

const {chromium}=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await b.newPage();p.setDefaultTimeout(120000);
  await p.route('**/animation-check.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Animation verification</title>'}));
  await p.goto('http://127.0.0.1:5178/animation-check.html');
  const report=await p.evaluate(async()=>{const {verify}=await import('/scripts/verify-asset-motion.ts');return verify();});
  await fs.writeFile('artifacts/asset-motion-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

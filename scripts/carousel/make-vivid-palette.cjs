// Editable, code-native UV artwork: 16 aligned roof strips and the petal drum.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('/Users/lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const dir=path.join(root,'asset-sources/carousel/v006/textures');await fs.mkdir(dir,{recursive:true});
  const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024">${body}</svg>`;
  let roof='<defs><linearGradient id="blue" x2="0" y2="1"><stop stop-color="#65bbf5"/><stop offset="1" stop-color="#3898df"/></linearGradient><linearGradient id="pink" x2="0" y2="1"><stop stop-color="#ff97c0"/><stop offset="1" stop-color="#ec65a0"/></linearGradient></defs>';
  for(let i=0;i<16;i++){
    const fill=['url(#blue)','#fff8ed','url(#pink)','#fff8ed'][i%4];
    roof+=`<rect x="${i*128}" width="128" height="1024" fill="${fill}"/><path d="M${i*128+1} 0V1024" stroke="#e3b97a" stroke-width="2"/>`;
  }
  let base='<defs><linearGradient id="petal" x2="0" y2="1"><stop stop-color="#fa91bc"/><stop offset="1" stop-color="#e963a0"/></linearGradient></defs><rect width="2048" height="1024" fill="#fff8ed"/><path d="M0 192H2048V826H0Z" fill="#4da6df"/>';
  for(let i=0;i<7;i++){
    const x=i*2048/7,w=2048/7;
    base+=`<path d="M${x+7} 810C${x+8} 530 ${x+w*.21} 345 ${x+w/2} 258C${x+w*.79} 345 ${x+w-8} 530 ${x+w-7} 810Z" fill="url(#petal)" stroke="#fff5e5" stroke-width="10"/>`;
    base+=`<circle cx="${x+w/2}" cy="642" r="26" fill="#fff6e4" stroke="#d7aa71" stroke-width="4"/><circle cx="${x+w/2-6}" cy="635" r="8" fill="white" opacity=".75"/>`;
  }
  base+='<path d="M0 195H2048M0 823H2048" stroke="#dab37c" stroke-width="7"/>';
  for(const [name,body] of [['canopy-paint',roof],['base-paint',base]]){
    const source=svg(body);await fs.writeFile(path.join(dir,name+'.svg'),source);
    await sharp(Buffer.from(source)).png().toFile(path.join(dir,name+'.png'));
  }
  console.log('Wrote two editable UV atlases:',dir);
})().catch(e=>{console.error(e);process.exitCode=1});

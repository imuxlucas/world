import { publicUrl } from './publicUrl';
import { ISLAND_INSCRIPTION_PRESET } from './islandTexturePreset';
import { useState } from 'react';
import './textureEditor.css';
export type TextureTarget = 'inscription' | 'paving';
export type TextureTransform = { scaleX:number; scaleY:number; offsetX:number; offsetY:number; rotation:number };
export type TextureEdits = Record<TextureTarget,TextureTransform>;
export const TEXTURE_KEY='lucas-island-texture-v009-v1';
export const DEFAULT_TRANSFORM:TextureTransform={scaleX:1,scaleY:1,offsetX:0,offsetY:0,rotation:0};
export const defaultTextureEdits=():TextureEdits=>({inscription:{...ISLAND_INSCRIPTION_PRESET},paving:{...DEFAULT_TRANSFORM}});
export function readTextureEdits():TextureEdits{
  const defaults=defaultTextureEdits();
  try{const data=JSON.parse(localStorage.getItem(TEXTURE_KEY)||'null');for(const target of ['inscription','paving'] as const)for(const field of Object.keys(DEFAULT_TRANSFORM) as (keyof TextureTransform)[]){const value=data?.[target]?.[field];const limit=field.startsWith('scale')?[.2,3]:field==='rotation'?[-180,180]:[-1,1];if(typeof value==='number'&&Number.isFinite(value)&&value>=limit[0]&&value<=limit[1])defaults[target][field]=value;}}catch{}
  return defaults;
}
export function textureMatches(name:string,target:TextureTarget){return target==='inscription'?/Glitter inscription/i.test(name):/Mucha glazed ceramic/i.test(name);}
export default function TextureEditor({value,onChange,onFocus,ready}:{value:TextureEdits;onChange:(v:TextureEdits)=>void;onFocus:(target:TextureTarget)=>void;ready:boolean}){
  const [target,setTarget]=useState<TextureTarget>('inscription'),[linked,setLinked]=useState(false),[message,setMessage]=useState('');
  const t=value[target];
  const payload=JSON.stringify({version:1,asset:publicUrl('/assets/island/v009/model.glb'),coordinates:'UV; image scale is reciprocal of UV repeat; centered at (0.5,0.5); rotation in degrees',transforms:value,uvRepeat:{inscription:[1/value.inscription.scaleX,1/value.inscription.scaleY],paving:[1/value.paving.scaleX,1/value.paving.scaleY]}},null,2);
  function update(field:keyof TextureTransform,next:number){if(!Number.isFinite(next))return;const bounds=field.startsWith('scale')?[.2,3]:field==='rotation'?[-180,180]:[-1,1];next=Math.min(bounds[1],Math.max(bounds[0],next));const edit={...t,[field]:next};if(linked&&(field==='scaleX'||field==='scaleY')){const other=field==='scaleX'?'scaleY':'scaleX';edit[other]=Math.min(3,Math.max(.2,t[other]*next/t[field]));}const result={...value,[target]:edit};onChange(result);try{localStorage.setItem(TEXTURE_KEY,JSON.stringify(result));setMessage('已保存到本机');}catch{setMessage('本机保存失败，请导出参数');}}
  const fields:[keyof TextureTransform,string,number,number,number,number,string][]=[['scaleX','图案宽度',20,300,1,100,'%'],['scaleY','图案高度',20,300,1,100,'%'],['offsetX','水平偏移',-100,100,.5,100,'% UV'],['offsetY','垂直偏移',-100,100,.5,100,'% UV'],['rotation','旋转',-180,180,.5,1,'°']];
  return <div className="texture-editor">
    <p className="texture-intro">实时调整底座贴图，模型形状保持不变。</p>
    <div className="texture-targets">{(['inscription','paving'] as const).map(id=><button key={id} className={target===id?'active':''} onClick={()=>{setTarget(id);setMessage('');}} aria-pressed={target===id}>{id==='inscription'?'前侧铭牌':'地面花纹'}</button>)}</div>
    <button className="texture-focus" disabled={!ready} onClick={()=>onFocus(target)}>近看{target==='inscription'?'铭牌':'地面'} ↗</button>
    <fieldset disabled={!ready}><label className="texture-lock"><input type="checkbox" checked={linked} onChange={e=>setLinked(e.target.checked)}/>锁定宽高比例</label>
    {fields.map(([field,label,min,max,step,multiplier,unit])=><div className="texture-field" key={field}><label htmlFor={`tex-${field}`}>{label}<span>{unit}</span></label><div><input id={`tex-${field}`} aria-label={label} type="range" min={min} max={max} step={step} value={t[field]*multiplier} onChange={e=>update(field,Number(e.target.value)/multiplier)}/><input aria-label={`${label}数值`} type="number" min={min} max={max} step={step} value={Number((t[field]*multiplier).toFixed(2))} onChange={e=>{if(e.target.value!=='')update(field,Number(e.target.value)/multiplier);}}/></div></div>)}
    </fieldset>
    <dl className="texture-ratios"><div><dt>宽度倍率</dt><dd>{t.scaleX.toFixed(3)}×</dd></div><div><dt>高度倍率</dt><dd>{t.scaleY.toFixed(3)}×</dd></div><div><dt>宽高修正比</dt><dd>{(t.scaleX/t.scaleY).toFixed(4)}</dd></div></dl>
    <p className="texture-help">100% 为原始大小。偏移使用 UV 坐标；超出边缘会被裁切。宽高修正比相对于原贴图，不是模型的实际长宽比。</p>
    <div className="texture-actions"><button onClick={()=>{const next={...value,[target]:{...DEFAULT_TRANSFORM}};onChange(next);try{localStorage.setItem(TEXTURE_KEY,JSON.stringify(next));setMessage('当前贴图已恢复默认');}catch{setMessage('已恢复预览；本机保存失败');}}}>恢复当前贴图</button><button onClick={async()=>{try{await navigator.clipboard.writeText(payload);setMessage('参数已复制');}catch{setMessage('复制失败，可展开下方参数手动复制');}}}>复制参数</button><button onClick={()=>{const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='island-texture-v009.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('参数已导出');}}>导出 JSON</button></div>
    <p className="texture-message" role="status">{message||(!ready?'正在等待模型加载…':'参数仅用于独立预览，确认后再应用到乐园。')}</p>
    <details><summary>查看完整参数</summary><textarea readOnly aria-label="贴图参数 JSON" value={payload}/></details>
  </div>;
}

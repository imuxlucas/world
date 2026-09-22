import { publicUrl } from '../publicUrl';
import { useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import './workflowDesktop.css';
const ROOT=publicUrl('/media/workflow-desktop/');
const WINDOWS=[{id:'build',title:'Border beam · 设计实现',src:'build-preview.png',x:30,y:27},{id:'team',title:'团队协作 · 需求到 Demo',src:'team-workflow.png',x:4,y:12},{id:'workbuddy',title:'WorkBuddy · 动态方案',src:'workbuddy-demo.png',x:17,y:19}];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const style=(x:number,y:number,z:number):CSSProperties=>({left:`${x}%`,top:`${y}%`,zIndex:z+1});
export function WorkflowDesktopThumbnail(){return <div className="workflow-desktop desktop-thumbnail" aria-hidden="true">{WINDOWS.map((item,i)=><div className="workflow-desktop-window" key={item.id} style={style(item.x,item.y,i)}><img src={ROOT+item.src} alt=""/></div>)}</div>}
export default function WorkflowDesktop(){
 const host=useRef<HTMLDivElement>(null); const [positions,setPositions]=useState(()=>Object.fromEntries(WINDOWS.map(item=>[item.id,{x:item.x,y:item.y}]))); const [order,setOrder]=useState(WINDOWS.map(item=>item.id)); const drag=useRef<{id:string;px:number;py:number;x:number;y:number;w:number;h:number}>(); const front=order[order.length-1]; const bring=(id:string)=>setOrder(v=>[...v.filter(x=>x!==id),id]);
 const start=(e:PointerEvent<HTMLButtonElement>,id:string)=>{const r=host.current!.getBoundingClientRect();bring(id);e.currentTarget.setPointerCapture(e.pointerId);drag.current={id,px:e.clientX,py:e.clientY,...positions[id],w:r.width,h:r.height};};
 const move=(e:PointerEvent<HTMLButtonElement>)=>{const d=drag.current;if(!d)return;setPositions(v=>({...v,[d.id]:{x:clamp(d.x+(e.clientX-d.px)/d.w*100,1,35),y:clamp(d.y+(e.clientY-d.py)/d.h*100,8,32)}}));};
 return <div ref={host} className="workflow-desktop" role="group" aria-label="可拖动窗口的桌面" data-front-window={front}>{WINDOWS.map(item=><button key={item.id} className="workflow-desktop-window" style={style(positions[item.id].x,positions[item.id].y,order.indexOf(item.id))} aria-label={`${item.title}，点击置顶并拖动移动`} onPointerDown={e=>start(e,item.id)} onPointerMove={move} onPointerUp={()=>{drag.current=undefined}} onPointerCancel={()=>{drag.current=undefined}} onClick={()=>bring(item.id)}><img src={ROOT+item.src} alt="" draggable={false}/></button>)}</div>;
}

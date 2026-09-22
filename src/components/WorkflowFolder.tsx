import { publicUrl } from '../publicUrl';
import { useState, type CSSProperties } from 'react';
import './workflowFolder.css';

type FolderState = 'open' | 'closed';
const CARDS = [
  { title: 'AI SEE 前沿体验', description: '为定义工作流提供判断', cover: publicUrl('/media/workflow-folder/ai-see.png'), href: 'https://ai-see.woa.com/', kind: 'review', order: 0, restX: '16px', restY: '16px', restAngle: '-17deg' },
  { title: '我的 Aha Moment', description: '为组件创新提供判断', cover: publicUrl('/media/workflow-folder/aha-moment.png'), href: 'https://doc.weixin.qq.com/smartpage/a1_ANQAtQZ1ACcCNKEs0mKytQ0yslHqm?scode=AJEAIQdfAAo5ZwZqilAUkAzAauAIc&p=7pyV0X', kind: 'experience', order: 1, restX: '-5px', restY: '-5px', restAngle: '12deg' },
  { title: 'Grok Bot 体验报告', description: '体验最先进的 agent 编排平台', cover: publicUrl('/media/workflow-folder/grok-bot.png'), href: 'https://doc.weixin.qq.com/smartpage/a1_APAAeAbdAFwCNsSdLrfGNQRmnRURc?scode=AJEAIQdfAAo5CFu6ElAUkAzAauAIc&p=nxy9Ro', kind: 'document', order: 2, restX: '-12px', restY: '22px', restAngle: '-16deg' },
];

export function FolderArtwork({ state = 'open', thumbnail = false, onToggle }: {state?:FolderState;thumbnail?:boolean;onToggle?:()=>void}) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const activeCard = state === 'open' && !thumbnail ? hoveredCard : null;
  const label = <div className="folder-label"><strong>工作流 / 设计实现输入</strong><span>评测 × 4｜好体验 × 16｜文档 × 1</span></div>;
  return <div className={`workflow-folder ${thumbnail ? 'folder-thumbnail' : ''}`} data-state={state} data-active-card={activeCard ?? undefined} onPointerLeave={()=>setHoveredCard(null)} aria-hidden={thumbnail || undefined}>
    <svg className="folder-back" viewBox="0 0 280 224" fill="none"><path d="M15 0h57c9 0 13 5 16 14l4 12h173c9 0 15 7 15 16v166c0 9-7 16-16 16H16c-9 0-16-7-16-16V16C0 7 6 0 15 0Z" fill="#f0f4f5"/><path d="M16 1h55c9 0 13 5 16 14l4 12h173c9 0 15 7 15 16" stroke="white" strokeOpacity=".7"/></svg>
    {thumbnail ? <div className="folder-front">{label}</div> : <button className="folder-front" type="button" aria-label="工作流 / 设计实现输入；展开或收起资源卡片" aria-expanded={state==='open'} onClick={onToggle}>{label}</button>}
    <div className="folder-card-stack" aria-hidden={state !== 'open' || undefined}>{CARDS.map(card=>{
      const distance = activeCard === null ? null : Math.abs(card.order - activeCard);
      return <a key={card.kind} className={`folder-card card-${card.kind}`}
        href={thumbnail ? undefined : card.href} target={thumbnail ? undefined : '_blank'} rel="noopener noreferrer"
        tabIndex={thumbnail || state !== 'open' ? -1 : 0}
        aria-label={thumbnail ? undefined : `${card.title}，${card.description}（新标签页打开）`}
        onFocus={()=>setHoveredCard(card.order)} onBlur={()=>setHoveredCard(null)}
        onPointerEnter={event=>{if(event.pointerType==='mouse' && !thumbnail)setHoveredCard(card.order);}}
        onPointerLeave={()=>setHoveredCard(null)}
        style={{'--card-order':card.order,'--rest-x':card.restX,'--rest-y':card.restY,'--rest-angle':card.restAngle,
          '--ripple-lift':`${distance === null ? 0 : [-16,-8,-4][distance]}px`,
          '--ripple-delay':`${distance === null ? 0 : distance * 45}ms`} as CSSProperties}>
      <div className="folder-card-lift">
      <div className="folder-card-sheet">
        <div className="folder-card-visual"><img src={card.cover} alt="" draggable={false}/></div>
        <div className="folder-card-copy"><strong>{card.title}</strong><span>{card.description}</span></div>
      </div>
      </div>
    </a>;})}</div>
  </div>;
}

export function WorkflowFolderThumbnail(){return <div className="workflow-folder-thumb"><FolderArtwork thumbnail /></div>;}

export default function WorkflowFolder(){
  const [hover,setHover]=useState(false);
  const [focused,setFocused]=useState(false);
  const [tapped,setTapped]=useState(false);
  const state=hover||focused||tapped?'open':'closed';
  return <div className="workflow-folder-demo" data-folder-state={state}>
    <div className="workflow-folder-trigger"
      onPointerEnter={event=>{if(event.pointerType==='mouse')setHover(true);}}
      onPointerLeave={event=>{if(event.pointerType==='mouse'){setHover(false);setTapped(false);}}}
      onFocusCapture={event=>{if(event.target.matches(':focus-visible'))setFocused(true);}}
      onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setFocused(false);setTapped(false);}}}>
      <FolderArtwork state={state} onToggle={()=>{setFocused(false);setTapped(state!=='open');}}/>
    </div>
  </div>;
}

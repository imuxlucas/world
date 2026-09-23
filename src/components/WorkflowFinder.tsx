import { publicUrl } from '../publicUrl';
import { useState } from 'react';
import './workflowFinder.css';
import FinderResourcePreview, { type FinderResource } from './FinderResourcePreview';

const ROOT = publicUrl('/media/workflow-finder/v2/');
const FILES: FinderResource[] = [
  { id: 1, file: '1.md', label: 'AI SEE 自动上传 Skill.md' },
  { id: 2, file: '2.pdf', label: '平台组 - 工作同步自动化方法.pdf' },
  { id: 3, file: '3.png', label: 'WorkBuddy' },
  { id: 4, file: '4.jpg', label: 'Savage.jpg' },
  { id: 5, file: '5.jpg', label: 'WDA.jpg' },
  { id: 6, file: '6.mp4', label: 'WDA.mp4', src: ROOT+'6.mp4', poster: ROOT+'wda-poster.png' },
  { id: 7, file: '7.jpg', label: '7.jpg' },
  { id: 8, file: '8.jpg', label: '8.jpg' },
  { id: 9, file: '9.mp4', label: '9.mp4', src: ROOT+'9.mp4', poster: ROOT+'iconic-heart-poster.png' },
];

export default function WorkflowFinder({ thumbnail = false }: {thumbnail?:boolean}) {
  const [selected, setSelected] = useState<number|null>(null);
  const [preview,setPreview] = useState<number|null>(null);
  return <div className={`workflow-finder-stage ${thumbnail?'finder-thumbnail':''}`} role={thumbnail?undefined:'group'} aria-label={thumbnail?undefined:'团队工作流资产 · Finder 桌面'} aria-hidden={thumbnail||undefined} onClick={()=>setSelected(null)}>
    <div className="workflow-finder">
    <img className="finder-chrome" src={ROOT+'2.png'} alt="" draggable={false}
      onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=ROOT+'paper-bg.png';}}/>
    <div className="finder-files">
      {FILES.map((item,index)=>{
        const images=<><img className="finder-file-default" src={`${ROOT}${item.id}default.png`} alt="" draggable={false}/><img className="finder-file-selected" src={`${ROOT}${item.id}hover.png`} alt="" draggable={false}/></>;
        const className=`finder-file finder-file-${item.id}`;
        return thumbnail
          ? <div className={className} key={item.id}>{images}</div>
          : <button type="button" className={className} key={item.id} aria-label={item.label} aria-pressed={selected===item.id}
              onDoubleClick={event=>{event.stopPropagation();setPreview(index);}}
              onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();setPreview(index);}}}
              onClick={event=>{event.stopPropagation();setSelected(item.id);}}>{images}</button>;
      })}
    </div>
    </div>
    {!thumbnail && preview!==null && <FinderResourcePreview files={FILES} index={preview} onIndexChange={index=>{setPreview(index);setSelected(FILES[index].id);}} onClose={()=>setPreview(null)}/>}
  </div>;
}

import { publicUrl } from '../publicUrl';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewControls from './PreviewControls';
import './finderResourcePreview.css';

export type FinderResource = { id:number; label:string; file:string };
const ROOT=publicUrl('/media/workflow-finder/resources/');

function MarkdownPreview({src}:{src:string}) {
  const [text,setText]=useState('正在载入…');
  useEffect(()=>{const controller=new AbortController();fetch(src,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('load');return response.text();}).then(setText).catch(error=>{if(error.name!=='AbortError')setText('暂时无法载入文档');});return()=>controller.abort();},[src]);
  // Render as text, never execute HTML or instructions contained in the document.
  return <div className="finder-document"><pre>{text}</pre></div>;
}

function VideoPreview({src}:{src:string}) {
  const video=useRef<HTMLVideoElement>(null);
  const [playing,setPlaying]=useState(false);
  const [duration,setDuration]=useState(0);
  const [time,setTime]=useState(0);
  const [failed,setFailed]=useState(false);
  const toggle=()=>{const player=video.current;if(!player)return;if(player.paused)void player.play().catch(()=>setPlaying(false));else player.pause();};
  const format=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  return <div className="finder-video" onKeyDown={event=>{if(event.code==='Space'&&!(event.target as HTMLElement).closest('button,input')){event.preventDefault();toggle();}}}>
    <video ref={video} src={src} autoPlay playsInline preload="metadata" disablePictureInPicture disableRemotePlayback
      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onTimeUpdate={event=>setTime(event.currentTarget.currentTime)}
      onLoadedMetadata={event=>{const value=event.currentTarget.duration;setDuration(Number.isFinite(value)?value:0);}}
      onError={()=>setFailed(true)} onClick={toggle}/>
    {failed?<p className="finder-media-error">此视频暂时无法播放</p>:<div className="finder-video-controls">
      <button type="button" onClick={toggle} aria-label={playing?'暂停':'播放'}>{playing?<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>:<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7 3 15 9-15 9z"/></svg>}</button>
      <input type="range" aria-label="播放进度" min="0" max={duration||1} step="0.1" value={Math.min(time,duration||1)} disabled={!duration}
        aria-valuetext={`${format(time)} / ${format(duration)}`}
        onChange={event=>{const value=Number(event.target.value);if(video.current)video.current.currentTime=value;setTime(value);}}/>
    </div>}
  </div>;
}

export default function FinderResourcePreview({files,index,onIndexChange,onClose}:{files:FinderResource[];index:number;onIndexChange:(index:number)=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const item=files[index];
  const src=ROOT+item.file;
  const extension=item.file.split('.').pop();
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const element=dialog.current;
    element?.showModal();
    return()=>{element?.close();previous?.focus({preventScroll:true});};
  },[]);
  return createPortal(<dialog ref={dialog} className="finder-resource-preview preview-overlay" aria-label="资源全屏预览" onCancel={event=>{event.preventDefault();onClose();}}
    onClick={event=>event.stopPropagation()} onKeyDown={event=>{
      event.stopPropagation();
      if(event.key==='Escape'){event.preventDefault();onClose();return;}
      if((event.target as HTMLElement).closest('input,textarea,iframe'))return;
      if(event.key==='ArrowLeft'&&index>0){event.preventDefault();onIndexChange(index-1);}
      if(event.key==='ArrowRight'&&index<files.length-1){event.preventDefault();onIndexChange(index+1);}
    }}>
    <PreviewControls onClose={onClose} onPrevious={()=>onIndexChange(index-1)} onNext={()=>onIndexChange(index+1)} previousDisabled={index===0} nextDisabled={index===files.length-1}/>
    <div className="finder-preview-content" key={item.id}>
      {extension==='mp4'?<VideoPreview src={src}/>:extension==='md'?<MarkdownPreview src={src}/>:extension==='pdf'?<div className="finder-pdf" tabIndex={0} role="document" aria-label={item.label}>{Array.from({length:8},(_,page)=><img key={page} width={1273} height={1800} src={`${ROOT}pdf-pages/page-${page+1}.png`} alt={`第 ${page+1} 页，共 8 页`} loading={page===0?'eager':'lazy'}/>)}</div>:<img className="finder-preview-image" src={src} alt={item.label}/>}
    </div>
  </dialog>,document.body);
}

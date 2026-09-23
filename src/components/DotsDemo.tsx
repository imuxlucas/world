import { publicUrl } from '../publicUrl';
import { useEffect, useRef, useState } from 'react';
import './dotsDemo.css';

type Page = 'home' | 'thinking' | 'interface' | 'video';
const base = publicUrl('/media/craft/dots/');

export function DotsThumbnail() {
  return <div className="craft-docs-thumbnail"><img src={`${base}home.png`} alt="Dots 五张卡片首页" /></div>;
}

export default function DotsDemo({ active = true }: { active?: boolean }) {
  const [page, setPage] = useState<Page>('home');
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (active) void player.play().catch(() => {});
    else player.pause();
    return () => player.pause();
  }, [active, page]);
  return <div className="dots-demo" data-page={page} onKeyDown={event => {
    if (event.key === 'Escape' && page !== 'home') {
      event.stopPropagation();
      setPage(page === 'video' ? 'interface' : 'home');
    }
  }}>
    {page === 'video' ? <>
      <video ref={video} className="dots-demo-video" src={`${base}chatgpt.mp4`} autoPlay={active} playsInline disablePictureInPicture tabIndex={-1} onPlay={event => { if (!active) event.currentTarget.pause(); }} onContextMenu={event => event.preventDefault()} aria-label="ChatGPT 案例视频" />
      <button className="dots-video-close" aria-label="关闭视频，返回 Interface Kit" onClick={() => setPage('interface')} />
    </> : <>
      <img className="dots-demo-image" src={`${base}${page}.png`} alt={page === 'home' ? 'Connect the Dots，五张分类卡片' : page === 'thinking' ? 'Design Thinking 与输入框' : 'Interface Kit，ChatGPT 案例列表'} draggable={false} />
      {page === 'home' ? <>
        <button className="dots-hotspot dots-thinking" aria-label="打开 Design Thinking" onClick={() => setPage('thinking')} />
        <button className="dots-hotspot dots-interface" aria-label="打开 Interface Kit" onClick={() => setPage('interface')} />
      </> : <>
        <button className="dots-hotspot dots-home" aria-label="Dots，返回五张卡片首页" onClick={() => setPage('home')} />
        {page === 'interface' && <button className="dots-hotspot dots-chatgpt" aria-label="播放 ChatGPT 案例视频" onClick={() => setPage('video')} />}
      </>}
    </>}
  </div>;
}

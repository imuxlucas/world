import { publicUrl } from '../publicUrl';
import { useRef, useState, type PointerEvent } from 'react';
import './craftDesktop.css';

const windows = [
  { id: 'immersive', title: '❤️ 沉浸感 · 实体交互' },
  { id: 'whitespace', title: '🩷 极致感 · 留白语言' },
];

export default function CraftDesktop() {
  const [front, setFront] = useState('whitespace');
  const desktop = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({ immersive: { x: 4, y: 43 }, whitespace: { x: 26, y: 57 } });
  const drag = useRef<{ id: string; pointer: number; x: number; y: number; startX: number; startY: number; width: number; height: number; maxX: number; halfHeight: number } | null>(null);
  const moved = useRef(false);
  const startDrag = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!event.isPrimary || event.button !== 0) return;
    const bounds = desktop.current!.getBoundingClientRect();
    const window = event.currentTarget.parentElement!.getBoundingClientRect();
    moved.current = false;
    setFront(id);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id, pointer: event.pointerId, ...positions[id], startX: event.clientX, startY: event.clientY, width: bounds.width, height: bounds.height, maxX: 100 - window.width / bounds.width * 100, halfHeight: window.height / bounds.height * 50 };
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.startX, dy = event.clientY - start.startY;
    if (Math.hypot(dx, dy) > 3) moved.current = true;
    if (!moved.current) return;
    setPositions(current => ({ ...current, [start.id]: {
      x: Math.max(0, Math.min(start.maxX, start.x + dx / start.width * 100)),
      y: Math.max(start.halfHeight, Math.min(100 - start.halfHeight, start.y + dy / start.height * 100)),
    } }));
  };
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});
  const replay = (id: string) => {
    setFront(id);
    Object.entries(videos.current).forEach(([key, player]) => {
      if (key !== id) player?.pause();
    });
    const video = videos.current[id];
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {});
  };
  return <div ref={desktop} className="craft-desktop" data-front-window={front} aria-label="个人作品双窗口桌面">
    {windows.map(item => <section key={item.id} className={`craft-window craft-window-${item.id}`} style={{ left: `${positions[item.id].x}%`, right: 'auto', top: `${positions[item.id].y}%`, zIndex: front === item.id ? 3 : 2 }}>
      <button className="craft-window-title" onPointerDown={event => startDrag(event, item.id)} onPointerMove={moveDrag}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; moved.current = true; }} onLostPointerCapture={() => { drag.current = null; }}
        onClick={event => { if (!moved.current || event.detail === 0) replay(item.id); }} aria-label={`${item.title}，拖动移动，点击置顶并从头播放`}>{item.title}</button>
      <button className="craft-video-surface" onClick={() => replay(item.id)} aria-label={`播放${item.title}`} onContextMenu={event => event.preventDefault()}>
        <video ref={node => { videos.current[item.id] = node; }} src={publicUrl(`/media/craft/${item.id}.mp4`)} poster={publicUrl(`/media/craft/${item.id}.jpg`)} muted playsInline loop preload="auto" disablePictureInPicture tabIndex={-1} />
      </button>
    </section>)}
  </div>;
}

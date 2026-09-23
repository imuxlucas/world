import { publicUrl } from '../publicUrl';
import { useState, type CSSProperties, type PointerEvent } from 'react';
import './mobileComparison.css';

const comparisons = [
  { id: 1, title: '创作首页' },
  { id: 2, title: '图片生成' },
  { id: 3, title: '输入体验' },
];

function Comparison({ id, title, thumbnail }: { id: number; title: string; thumbnail: boolean }) {
  const [position, setPosition] = useState(50);

  function updatePosition(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)));
  }

  return <div className="mobile-comparison__card">
    <div
      className="mobile-comparison__screen"
      style={{ '--comparison-position': `${position}%` } as CSSProperties}
      role={thumbnail ? undefined : 'slider'}
      tabIndex={thumbnail ? undefined : 0}
      aria-label={thumbnail ? undefined : `${title}，左右拖动查看改版前后`}
      aria-valuemin={thumbnail ? undefined : 0}
      aria-valuemax={thumbnail ? undefined : 100}
      aria-valuenow={thumbnail ? undefined : Math.round(position)}
      aria-valuetext={thumbnail ? undefined : `Before ${Math.round(position)}%，After ${100 - Math.round(position)}%`}
      aria-orientation={thumbnail ? undefined : 'horizontal'}
      onPointerDown={thumbnail ? undefined : event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        updatePosition(event);
      }}
      onPointerMove={thumbnail ? undefined : event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) updatePosition(event);
      }}
      onPointerUp={thumbnail ? undefined : event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updatePosition(event);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onKeyDown={thumbnail ? undefined : event => {
        // Keep the detail page's arrow-key navigation from switching KR while adjusting.
        event.stopPropagation();
        const steps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -10, PageUp: 10 };
        if (event.key === 'Home' || event.key === 'End' || event.key in steps) {
          event.preventDefault();
          setPosition(current => event.key === 'Home' ? 0 : event.key === 'End' ? 100 : Math.max(0, Math.min(100, current + steps[event.key])));
        }
      }}
    >
      <img className="mobile-comparison__image" src={publicUrl(`/demos/mobile-comparison/${id}after.png`)} alt={`${title} · After`} draggable={false} />
      <img className="mobile-comparison__image mobile-comparison__before" src={publicUrl(`/demos/mobile-comparison/${id}before.png`)} alt={`${title} · Before`} draggable={false} />
      <div className="mobile-comparison__divider" aria-hidden="true">
        <span className="mobile-comparison__handle"><svg viewBox="0 0 24 24" fill="none"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M12 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      </div>
    </div>
  </div>;
}

export default function MobileComparison({ thumbnail = false }: { thumbnail?: boolean }) {
  return <div className={`mobile-comparison${thumbnail ? ' mobile-comparison--thumbnail' : ''}`} aria-label={thumbnail ? undefined : '三组移动端改版前后对比'} aria-hidden={thumbnail || undefined}>
    <div className="mobile-comparison__row">
      {comparisons.map(comparison => <Comparison key={comparison.id} {...comparison} thumbnail={thumbnail} />)}
    </div>
  </div>;
}

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { publicUrl } from '../publicUrl';
import './pairedOrbit.css';

const SIDES = ['before', 'after'] as const;
type Side = typeof SIDES[number];
type Origins = Record<Side, DOMRect>;
const CASES = Array.from({ length: 7 }, (_, i) => i + 1);
const original = (id: number, side: Side) => publicUrl(`/media/kr1-comparison/${id}${side}.${[1, 2, 4, 5].includes(id) ? 'gif' : 'png'}`);
const preview = (id: number, side: Side) => publicUrl(`/media/kr1-comparison/${id}${side}-preview.jpg`);
const label = (id: number) => `案例 ${String(id).padStart(2, '0')}`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ComparisonDetail({ selected, origins, onClose }: { selected: number; origins: Origins; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState(selected);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const titleId = useId();
  const step = (delta: number) => setCurrent(value => (value - 1 + delta + CASES.length) % CASES.length + 1);

  useLayoutEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    node.showModal();
    const animations: Animation[] = [];
    if (!reducedMotion()) {
      SIDES.forEach(side => {
        const target = node.querySelector<HTMLElement>(`[data-detail-side="${side}"]`)!;
        const end = target.getBoundingClientRect();
        const start = origins[side];
        animations.push(target.animate([
          { transform: `translate(${start.x - end.x}px, ${start.y - end.y}px) scale(${start.width / end.width}, ${start.height / end.height})`, borderRadius: '12px', opacity: .8 },
          { transform: 'translate(0, 0) scale(1)', borderRadius: '8px', opacity: 1 },
        ], { duration: 720, easing: 'cubic-bezier(.22,.8,.2,1)' }));
      });
    }
    return () => {
      animations.forEach(animation => animation.cancel());
      node.close();
      previousFocus?.focus({ preventScroll: true });
    };
  }, [origins]);

  return createPortal(<dialog className="paired-detail" ref={dialog} aria-labelledby={titleId}
    onClick={event => event.stopPropagation()}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    }}>
    <header className="paired-detail-header">
      <div><span>BEFORE / AFTER</span><h2 id={titleId}>{label(current)}</h2></div>
      <button className="paired-detail-close" onClick={onClose} aria-label="关闭对比" autoFocus>×</button>
    </header>
    <div className="paired-detail-columns">
      {SIDES.map(side => {
        const key = `${current}-${side}`;
        return <figure className="paired-detail-column" key={side}>
          <figcaption>{side === 'before' ? 'Before' : 'After'}<span>{[1, 2, 4, 5].includes(current) ? 'GIF' : 'IMAGE'}</span></figcaption>
          <div className="paired-detail-image" data-detail-side={side} style={{ aspectRatio: current === 1 ? '16 / 10' : '16 / 9' }}>
            <img src={preview(current, side)} alt="" aria-hidden="true" />
            <img key={key} className={`paired-detail-original ${loaded[key] ? 'is-loaded' : ''}`} src={original(current, side)} alt={`${label(current)} ${side}`}
              onLoad={() => setLoaded(value => ({ ...value, [key]: true }))}
              onError={() => setFailed(value => ({ ...value, [key]: true }))} />
            {!loaded[key] && <span className="paired-detail-loading" role="status">{failed[key] ? '原图加载失败，当前显示预览' : '正在加载原图…'}</span>}
          </div>
        </figure>;
      })}
    </div>
    <footer className="paired-detail-footer">
      <button onClick={() => step(-1)} aria-label="上一个案例">←</button>
      <span aria-live="polite">{String(current).padStart(2, '0')} / 07</span>
      <button onClick={() => step(1)} aria-label="下一个案例">→</button>
    </footer>
  </dialog>, document.body);
}

export default function PairedOrbit({ thumbnail = false }: { thumbnail?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 450 });
  const [unfolding, setUnfolding] = useState(!thumbnail);
  const [selection, setSelection] = useState<{ id: number; origins: Origins } | null>(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(host.current!);
    const timer = window.setTimeout(() => setUnfolding(false), 3600);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);

  const { width, height } = size;
  const radius = width * .44;
  const cardWidth = width * .30;
  const openCase = (caseId: number, clicked?: SVGGElement) => {
    const bounds = host.current!.getBoundingClientRect();
    const origins = {} as Origins;
    SIDES.forEach(side => {
      const candidates = [...host.current!.querySelectorAll<SVGGElement>(`[data-side="${side}"][data-case="${caseId}"]`)];
      const visible = candidates.map(node => ({ node, rect: node.getBoundingClientRect() }))
        .sort((a, b) => Math.hypot(a.rect.x + a.rect.width / 2 - (bounds.x + bounds.width / 2), a.rect.y + a.rect.height / 2 - (bounds.y + bounds.height / 2)) -
          Math.hypot(b.rect.x + b.rect.width / 2 - (bounds.x + bounds.width / 2), b.rect.y + b.rect.height / 2 - (bounds.y + bounds.height / 2)));
      origins[side] = clicked?.dataset.side === side ? clicked.getBoundingClientRect() : visible[0].rect;
    });
    setSelection({ id: caseId, origins });
  };

  return <div ref={host} className={`paired-orbit ${thumbnail ? 'is-thumbnail' : ''} ${selection ? 'is-paused' : ''}`}
    aria-hidden={thumbnail || undefined} onKeyDown={event => event.stopPropagation()}>
    {!thumbnail && <div className="paired-orbit-labels"><span>Before</span><span>After</span></div>}
    <svg className="paired-orbit-art" viewBox={`0 0 ${width} ${height}`} aria-label={thumbnail ? undefined : '左右转盘，点击案例查看 Before / After 对比'}>
      <defs>
        <filter id={`${id}-goo`} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(.4, width / 140)} result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        {CASES.map(caseId => <clipPath id={`${id}-clip-${caseId}`} key={caseId}><rect x={-cardWidth / 2} y={-cardWidth / (caseId === 1 ? 1.6 : 16 / 9) / 2} width={cardWidth} height={cardWidth / (caseId === 1 ? 1.6 : 16 / 9)} rx={width * .009} /></clipPath>)}
      </defs>
      {SIDES.map(side => {
        const direction = side === 'before' ? 1 : -1;
        return <g key={side} transform={`translate(${side === 'before' ? -width * .15 : width * 1.15} ${height / 2})`}>
          <g className="paired-orbit-entry" style={{ '--slide-x': `${direction * -width * .55}px` } as CSSProperties}>
            <g filter={unfolding && !reducedMotion() ? `url(#${id}-goo)` : undefined}>
              <g className={`paired-orbit-wheel wheel-${side}`}>
                {Array.from({ length: 14 }, (_, order) => {
                  // Paint the leading card last so the other cases emerge from behind it.
                  const index = 13 - order;
                  const caseId = index % 7 + 1;
                  const angle = (index <= 7 ? index : index - 14) * 360 / 14 * direction;
                  const cardHeight = cardWidth / (caseId === 1 ? 1.6 : 16 / 9);
                  return <g className="paired-orbit-arm" key={index} style={{ '--arm-angle': `${angle}deg`, '--unfold-delay': `${600 + Math.abs(index <= 7 ? index : index - 14) * 70}ms` } as CSSProperties}>
                    <g transform={`translate(${radius * direction} 0)`}>
                      <g className="paired-orbit-card" role={thumbnail ? undefined : 'button'} tabIndex={thumbnail ? undefined : -1}
                        aria-label={thumbnail ? undefined : `${label(caseId)} ${side}，打开左右对比`} data-case={caseId} data-side={side}
                        onClick={thumbnail ? undefined : event => openCase(caseId, event.currentTarget)}
                        onKeyDown={thumbnail ? undefined : event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCase(caseId, event.currentTarget); } }}>
                        <title>{label(caseId)} · {side}</title>
                        <rect className="paired-orbit-outline" x={-cardWidth / 2 - 2} y={-cardHeight / 2 - 2} width={cardWidth + 4} height={cardHeight + 4} rx={width * .01} />
                        <image href={preview(caseId, side)} x={-cardWidth / 2} y={-cardHeight / 2} width={cardWidth} height={cardHeight} clipPath={`url(#${id}-clip-${caseId})`} preserveAspectRatio="xMidYMid meet" />
                      </g>
                    </g>
                  </g>;
                })}
              </g>
            </g>
          </g>
        </g>;
      })}
    </svg>
    {!thumbnail && <div className="paired-orbit-picker" aria-label="选择对比案例">
      {CASES.map(caseId => <button key={caseId} onClick={() => openCase(caseId)} aria-label={`打开${label(caseId)}左右对比`}>{String(caseId).padStart(2, '0')}</button>)}
    </div>}
    {selection && <ComparisonDetail selected={selection.id} origins={selection.origins} onClose={() => setSelection(null)} />}
  </div>;
}

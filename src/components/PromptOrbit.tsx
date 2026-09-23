import { publicUrl } from '../publicUrl';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { layoutOrbit, ORBIT_CARD_GAP } from './orbitLayout';
import './promptOrbit.css';

const CASES = Array.from({ length: 14 }, (_, index) => ({
  src: publicUrl(`/media/workflow-orbit/case-${String(index + 1).padStart(2, '0')}.png`),
  portrait: [6, 10, 11].includes(index),
  ratio: [6, 10, 11].includes(index) ? 900 / 420 : index === 9 ? 1440 / 844 : index > 11 ? 2880 / 1688 : 16 / 9,
}));

export default function PromptOrbit() {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ width, height });
    });
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  const { width, height } = size;
  const thumbnail = width < 180;
  const margin = thumbnail ? 8 : 48;
  const scale = Math.max(.1, Math.min(1, (width - margin) / 412, (height - margin) / 200));
  const cardWidth = 320 * scale;
  const { radius, angles } = useMemo(() => layoutOrbit(cardWidth, CASES.map(item => cardWidth / item.ratio)), [cardWidth]);
  // Keep the composer at the circle's rightmost point as its center moves left.
  const cx = width / 2 - radius;
  const cy = height / 2;
  const half = CASES.length / 2;
  const entryDuration = 2400;
  const entryHold = 600;
  const entryStagger = 100;
  // Start turning while the two streams are still unfolding.
  const rotationDelay = entryHold + entryDuration * .4;
  const blur = Math.min(7, width / 90);
  return <div ref={host} className="prompt-orbit" aria-hidden="true" style={{ '--rotation-delay': `${rotationDelay}ms` } as CSSProperties}>
    <svg className="prompt-orbit-art" viewBox={`0 0 ${width} ${height}`} data-case-count={CASES.length} data-card-gap={ORBIT_CARD_GAP} data-circle-center={`${cx},${cy}`}>
      <defs>
        <filter id={`${id}-goo`} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <clipPath id={`${id}-bounds`}><rect width={width} height={height} /></clipPath>
        {CASES.map((item, index) => <clipPath id={`${id}-card-${index}`} key={item.src}>
          <rect x={-cardWidth / 2} y={-cardWidth / item.ratio / 2} width={cardWidth} height={cardWidth / item.ratio} rx={Math.min(12, width / 54)} />
        </clipPath>)}
      </defs>
      <g clipPath={`url(#${id}-bounds)`}>
        <g filter={`url(#${id}-goo)`}>
          <g transform={`translate(${cx} ${cy})`}>
          <g className="prompt-orbit-carousel">
            {CASES.map((item, index) => {
              // Both streams launch at the composer, then unfold toward the left.
              // Their furthest cards lead, with the next pair following behind.
              const rank = index < half ? index : CASES.length - 1 - index;
              const angle = angles[index] - (angles[half - 1] + angles[half]) / 2;
              const cardHeight = cardWidth / item.ratio;
              return <g className="prompt-orbit-arm" key={item.src} style={{
                '--entry-angle': `${angle}deg`,
                '--entry-delay': `${entryHold + rank * entryStagger}ms`,
                '--entry-duration': `${entryDuration}ms`,
              } as CSSProperties} data-direction={index < half ? 'upper' : 'lower'}>
                <g transform={`translate(${radius} 0)`}>
                <g className="prompt-orbit-card"
                data-width={cardWidth} data-portrait-rotation={item.portrait ? 90 : 0}>
                <g clipPath={`url(#${id}-card-${index})`}>
                  <rect x={-cardWidth / 2} y={-cardHeight / 2} width={cardWidth} height={cardHeight} fill="#fff" />
                  <image href={item.src} x={-(item.portrait ? cardHeight : cardWidth) / 2} y={-(item.portrait ? cardWidth : cardHeight) / 2}
                    width={item.portrait ? cardHeight : cardWidth} height={item.portrait ? cardWidth : cardHeight}
                    transform={item.portrait ? 'rotate(90)' : undefined} preserveAspectRatio="xMidYMid meet" />
                </g>
                </g>
                </g>
              </g>;
            })}
          </g>
          </g>
          <rect className="prompt-orbit-source" x={(width - 412 * scale) / 2} y={(height - 200 * scale) / 2} width={412 * scale} height={200 * scale} rx={24 * scale} fill="#fff" />
        </g>
      </g>
    </svg>
  </div>;
}

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { publicUrl } from '../publicUrl';
import FinderResourcePreview, { type FinderResource } from './FinderResourcePreview';
import './portfolioTimeline.css';

const ROOT = publicUrl('/media/portfolio-timeline/');
const PDF_RATIO = 1683.78 / 595.276;
const ITEMS: (FinderResource & { year: number; ratio: number; poster: string })[] = [
  { id: 2018, year: 2018, label: '虚拟现实场景漫游', file: 'vr-2018.mp4', ratio: 16 / 9, poster: ROOT + 'vr-2018.jpg' },
  { id: 2020, year: 2020, label: '王麒瑞-作品集', file: 'portfolio-2020.pdf', ratio: PDF_RATIO, poster: ROOT + 'portfolio-2020.jpg',
    pages: Array.from({ length: 29 }, (_, index) => ({ src: `${ROOT}pages/page-${String(index + 1).padStart(2, '0')}.jpg`, width: 2400, height: 849 })) },
  { id: 2021, year: 2021, label: 'untitled', file: 'untitled-2021.mp4', ratio: 16 / 9, poster: ROOT + 'untitled-2021.jpg' },
  { id: 2024, year: 2024, label: '2024-05-25 082217', file: 'exploration-2024.mp4', ratio: 16 / 9, poster: ROOT + 'exploration-2024.jpg' },
].map(item => ({ ...item, src: ROOT + item.file }));
const CYCLE_WIDTH = ITEMS.reduce((width, item) => width + 90 * item.ratio + 8, 0);

export default function PortfolioTimeline({ thumbnail = false }: { thumbnail?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(3);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (thumbnail || !host.current) return;
    const observer = new ResizeObserver(([entry]) => setCopies(Math.ceil(entry.contentRect.width / CYCLE_WIDTH) + 2));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [thumbnail]);

  if (thumbnail) return <div className="portfolio-timeline-thumbnail" aria-hidden="true"><div>{ITEMS.map(item =>
    <img key={item.id} src={item.poster} alt="" style={{ aspectRatio: item.ratio }} />
  )}</div></div>;

  return <div className={`portfolio-timeline${selected !== null ? ' is-paused' : ''}`} ref={host}>
    <div className="portfolio-timeline-viewport" aria-label="2018 至 2024 作品轮播">
      <div className="portfolio-timeline-track" style={{ '--cycle-width': `${CYCLE_WIDTH}px`, '--cycle-duration': `${CYCLE_WIDTH / 28}s` } as CSSProperties}>
        {Array.from({ length: copies }, (_, copy) => <div className="portfolio-timeline-group" key={copy} aria-hidden={copy > 0 || undefined}>
          {ITEMS.map((item, index) => <button className="portfolio-timeline-item" type="button" key={item.id}
            style={{ width: 90 * item.ratio }} tabIndex={copy === 0 ? 0 : -1}
            onMouseDown={copy > 0 ? event => event.preventDefault() : undefined}
            aria-label={`${item.year} · ${item.label} · 打开${item.pages ? '作品集' : '视频'}`}
            onClick={() => setSelected(index)}>
            <img src={item.poster} width={90 * item.ratio} height={90} alt="" draggable={false} />
            <span>{item.year}</span>
          </button>)}
        </div>)}
      </div>
    </div>
    {selected !== null && <FinderResourcePreview files={ITEMS} index={selected} onIndexChange={setSelected} onClose={() => setSelected(null)} />}
  </div>;
}

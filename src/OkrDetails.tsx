import { publicUrl } from './publicUrl';
import { WorkflowFolderThumbnail } from './components/WorkflowFolder';
import { WorkflowDesktopThumbnail } from './components/WorkflowDesktop';
import WorkflowFinder from './components/WorkflowFinder';
import PromptOrbit from './components/PromptOrbit';
import MobileComparison from './components/MobileComparison';
import { DotsThumbnail } from './components/DotsDemo';
import { useEffect, useRef, useState } from 'react';
import { navigateOkr, type Objective, type KeyResult } from './okrContent';
import { OKR_EDITORIAL } from './okrEditorial';
import { useKrTransition } from './useKrTransition';
import KrAnimatedText from './components/KrAnimatedText';
import PairedOrbit from './components/PairedOrbit';
import PortfolioTimeline from './components/PortfolioTimeline';
import type { KrVariant } from './okrContent';


function Cover({ objective, index, thumbnail = false }: { objective: Objective; index: number; thumbnail?: boolean }) {
  if (objective.id === 'o3' && index === 0 && thumbnail) return <DotsThumbnail />;
  if (objective.id === 'o3' && index === 2 && thumbnail) return <div className="craft-docs-thumbnail"><img src={publicUrl("/media/craft/dots/desktop-cover.png")} alt="个人作品双窗口桌面" /></div>;
  if (objective.id === 'o3' && index === 1 && thumbnail) return <div className="craft-docs-thumbnail"><img src={publicUrl("/media/craft/rxslider-docs.png")} alt="RxSlider 滑块文档" /></div>;
  if (objective.id === 'o2' && index === 2 && thumbnail) return <MobileComparison thumbnail />;
  if (objective.id === 'o2' && index === 1 && thumbnail) return <div className="tad-universal-thumbnail" aria-hidden="true"><iframe src={publicUrl("/demos/tad-universal/?thumbnail=1")} title="tad-universal 组件缩略图" tabIndex={-1} loading="lazy" ref={node => { node?.setAttribute('inert', ''); }} /></div>;
  if (objective.id === 'o2' && index === 0 && thumbnail) return <div className="prompt-composer-thumbnail" aria-hidden="true"><iframe src={publicUrl("/demos/lip-prompt/index.html?thumbnail=1&orbit=1")} title="词槽输入组件缩略图" tabIndex={-1}/></div>;
  return <div className={`case-cover cover-${objective.id} cover-variation-${index} ${thumbnail ? 'is-thumbnail' : ''}`} aria-hidden="true">
    <div className="cover-art">
      {objective.id === 'o1' && <div className="workflow-art"><i /><i /><i /><span>✳</span></div>}
      {objective.id === 'o2' && <div className="link-art"><i /><i /><span /></div>}
      {objective.id === 'o3' && <div className="craft-art"><i /><i /><i /><span>✳</span></div>}
    </div>
  </div>;
}

function DesktopEmbed({ src, title }: { src: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(800 / 1280);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setScale(entry.contentRect.width / 1280);
    });
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  return <div className="case-desktop-embed" ref={host}>
    <iframe src={src} title={title} width="1280" height="720"
      style={{ transform: `scale(${scale})` }} loading="eager"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      referrerPolicy="no-referrer" allowFullScreen />
  </div>;
}

function CaseStage({ result, objective, index, variant }: { result: KeyResult; objective: Objective; index: number; variant: KrVariant }) {
  const [failed, setFailed] = useState(false);
  const media = result.media;
  if (objective.id === 'o2' && index === 0 && variant === 'comparison') return <PairedOrbit />;
  if (objective.id === 'o3' && index === 2 && variant === 'archive') return <PortfolioTimeline />;
  if (failed) return <div className="case-unavailable">素材暂时无法显示<button onClick={() => setFailed(false)}>重新载入</button></div>;
  if (media.type === 'image') return <img className="case-image" src={media.src} alt={media.alt} onError={() => setFailed(true)} />;
  if (media.type === 'embed' && objective.id === 'o3' && index === 1) return <DesktopEmbed src={media.src} title={media.title} />;
  if (media.type === 'embed' && objective.id === 'o2' && index === 0) return <div className="prompt-orbit-stage"><PromptOrbit/><iframe className="case-embed" src={`${media.src}?orbit=1`} title={media.title} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" /></div>;
  if (media.type === 'embed') return <iframe className="case-embed" src={media.src} title={media.title} loading="eager" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" allowFullScreen />;
  if (media.type === 'component') return <div className="case-component">{media.render()}</div>;
  return <Cover objective={objective} index={index} />;
}

export default function OkrDetails({ objective, kr, variant, open }: { objective: Objective; kr: number; variant: KrVariant; open: boolean }) {
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const displayed = useKrTransition(objective, kr, open, variant);
  const entries = objective.results.flatMap((item, index) => {
    const entry = { item, index, variant: 'default' as KrVariant };
    if (objective.id === 'o3' && index === 2) return [entry, { ...entry, variant: 'archive' as KrVariant }];
    return objective.id === 'o2' && index === 0 ? [entry, { ...entry, variant: 'comparison' as KrVariant }] : [entry];
  });
  const activeEntry = entries.findIndex(entry => entry.index === kr && entry.variant === variant);
  const result = displayed.objective.results[displayed.kr];
  const copy = OKR_EDITORIAL[displayed.objective.id][displayed.kr];
  const contentKey = `${displayed.objective.id}-${displayed.kr}`;
  useEffect(() => { panel.current?.toggleAttribute('inert', !open); }, [open]);
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open, objective.id]);
  useEffect(() => { scroll.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [objective.id, kr]);

  return <section ref={panel} className={`okr-panel ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-labelledby="objective-title" onKeyDown={event => {
    if ((event.target as HTMLElement).closest('input, textarea, select, iframe, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = entries[Math.max(0, Math.min(entries.length - 1, activeEntry + (event.key === 'ArrowRight' ? 1 : -1)))];
      navigateOkr(objective.id, next.index, next.variant);
    }
  }}>
    <div className="okr-scroll" ref={scroll}>
      <div className="okr-editorial">
        <header className="okr-heading" key={objective.id}>
          <h1 id="objective-title" ref={heading} tabIndex={-1}>{objective.title}</h1>
          <p>{objective.statement}</p>
        </header>
        <nav className={`okr-index ${entries.length === 4 ? 'has-four-entries' : ''}`} aria-label={`${objective.title} 关键结果目录`}>
          {entries.map(({ item, index: i, variant: entryVariant }, entryIndex) => <button key={`${i}-${entryVariant}`} className="okr-index-item" aria-current={activeEntry === entryIndex ? 'step' : undefined} onClick={() => navigateOkr(objective.id, i, entryVariant)} aria-label={`KR${i + 1}${entryVariant === 'comparison' ? ' · Before / After 案例' : entryVariant === 'archive' ? ' · 历年作品' : ''} · ${item.weight}% · ${item.title}`}>
            <div className="okr-index-thumb">{entryVariant === 'comparison' ? <PairedOrbit thumbnail /> : entryVariant === 'archive' ? <PortfolioTimeline thumbnail /> : objective.id==='o1'&&i===0?<WorkflowFolderThumbnail/>:objective.id==='o1'&&i===1?<WorkflowDesktopThumbnail/>:objective.id==='o1'&&i===2?<WorkflowFinder thumbnail/>:<Cover objective={objective} index={i} thumbnail />}</div>
          </button>)}
        </nav>
        <article className="okr-story" data-transition={displayed.phase} data-text-transition={displayed.textPhase} aria-busy={displayed.phase !== 'idle'} aria-label={`KR${displayed.kr + 1} 详情`}>
          <figure className="okr-case" aria-label="案例展示区">
            <div className="okr-case-stage" data-objective={objective.id}>
              <div className="okr-case-content" ref={node => { node?.toggleAttribute('inert', displayed.phase !== 'idle'); }}>
                <CaseStage key={`${contentKey}-${displayed.variant}`} result={result} objective={displayed.objective} index={displayed.kr} variant={displayed.variant} />
              </div>
            </div>
          </figure>
          <div className="okr-statement" key={`title-${contentKey}`}><h2><KrAnimatedText text={copy.title.replace(/[。.]$/, '')} /><sup className="okr-greeting">Hi December～</sup></h2></div>
          <div className="okr-evidence" key={`body-${contentKey}`}><p><KrAnimatedText text={copy.action} /></p><p><KrAnimatedText text={copy.acceptance} /></p></div>
        </article>
      </div>
    </div>
  </section>;
}

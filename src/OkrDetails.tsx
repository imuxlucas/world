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


function Cover({ objective, index, thumbnail = false }: { objective: Objective; index: number; thumbnail?: boolean }) {
  if (objective.id === 'o3' && index === 0 && thumbnail) return <DotsThumbnail />;
  if (objective.id === 'o3' && index === 2 && thumbnail) return <div className="craft-docs-thumbnail"><img src={publicUrl("/media/craft/dots/desktop-cover.png")} alt="个人作品双窗口桌面" /></div>;
  if (objective.id === 'o3' && index === 1 && thumbnail) return <div className="craft-docs-thumbnail"><img src={publicUrl("/media/craft/rxslider-docs.png")} alt="RxSlider 滑块文档" /></div>;
  if (objective.id === 'o2' && index === 2 && thumbnail) return <MobileComparison thumbnail />;
  if (objective.id === 'o2' && index === 1 && thumbnail) return <div className="tad-universal-thumbnail" aria-hidden="true"><iframe src={publicUrl("/demos/tad-universal/?thumbnail=1")} title="tad-universal 组件缩略图" tabIndex={-1} loading="lazy" ref={node => { node?.setAttribute('inert', ''); }} /></div>;
  if (objective.id === 'o2' && index === 0 && thumbnail) return <div className="prompt-composer-thumbnail" aria-hidden="true"><PromptOrbit/><iframe src={publicUrl("/demos/lip-prompt/index.html?thumbnail=1&orbit=1")} title="词槽输入组件缩略图" tabIndex={-1}/></div>;
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

function CaseStage({ result, objective, index }: { result: KeyResult; objective: Objective; index: number }) {
  const [failed, setFailed] = useState(false);
  const media = result.media;
  if (failed) return <div className="case-unavailable">素材暂时无法显示<button onClick={() => setFailed(false)}>重新载入</button></div>;
  if (media.type === 'image') return <img className="case-image" src={media.src} alt={media.alt} onError={() => setFailed(true)} />;
  if (media.type === 'embed' && objective.id === 'o3' && index === 1) return <DesktopEmbed src={media.src} title={media.title} />;
  if (media.type === 'embed' && objective.id === 'o2' && index === 0) return <div className="prompt-orbit-stage"><PromptOrbit/><iframe className="case-embed" src={`${media.src}?orbit=1`} title={media.title} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" /></div>;
  if (media.type === 'embed') return <iframe className="case-embed" src={media.src} title={media.title} loading="eager" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" allowFullScreen />;
  if (media.type === 'component') return <div className="case-component">{media.render()}</div>;
  return <Cover objective={objective} index={index} />;
}

export default function OkrDetails({ objective, kr, open }: { objective: Objective; kr: number; open: boolean }) {
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = objective.results[kr];
  const copy = OKR_EDITORIAL[objective.id][kr];
  useEffect(() => { panel.current?.toggleAttribute('inert', !open); }, [open]);
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open, objective.id]);
  useEffect(() => { scroll.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [objective.id, kr]);

  return <section ref={panel} className={`okr-panel ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-labelledby="objective-title" onKeyDown={event => {
    if ((event.target as HTMLElement).closest('input, textarea, select, iframe, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateOkr(objective.id, Math.max(0, Math.min(2, kr + (event.key === 'ArrowRight' ? 1 : -1))));
    }
  }}>
    <div className="okr-scroll" ref={scroll}>
      <div className="okr-editorial">
        <header className="okr-heading" key={objective.id}>
          <h1 id="objective-title" ref={heading} tabIndex={-1}>{objective.title}</h1>
          <p>{objective.statement}</p>
        </header>
        <nav className="okr-index" aria-label={`${objective.title} 关键结果目录`}>
          {objective.results.map((item, i) => <button key={i} className="okr-index-item" aria-current={kr === i ? 'step' : undefined} onClick={() => navigateOkr(objective.id, i)} aria-label={`KR${i + 1} · ${item.weight}% · ${item.title}`}>
            <div className="okr-index-thumb">{objective.id==='o1'&&i===0?<WorkflowFolderThumbnail/>:objective.id==='o1'&&i===1?<WorkflowDesktopThumbnail/>:objective.id==='o1'&&i===2?<WorkflowFinder thumbnail/>:<Cover objective={objective} index={i} thumbnail />}</div>
          </button>)}
        </nav>
        <article className="okr-story" key={`${objective.id}-${kr}`} aria-label={`KR${kr + 1} 详情`}>
          <figure className="okr-case" aria-label="案例展示区">
            <div className="okr-case-stage"><CaseStage result={result} objective={objective} index={kr} /></div>
          </figure>
          <div className="okr-statement"><h2>{copy.title.replace(/[。.]$/, '')}{kr === 0 && <sup className="okr-greeting">Hi December～</sup>}</h2></div>
          <div className="okr-evidence"><p>{copy.action}</p><p>{copy.acceptance}</p></div>
        </article>
      </div>
    </div>
  </section>;
}

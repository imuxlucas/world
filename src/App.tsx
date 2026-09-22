import { publicUrl } from './publicUrl';
import TextureEditor, {readTextureEdits, type TextureTarget} from './TextureEditor';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Viewer from './Viewer';
import type { AssetRecord } from './types';

type ReviewState = 'unreviewed' | 'changes' | 'approved';
type Review = { status: ReviewState; note: string; updatedAt?: string };
type Reviews = Record<string, Review>;
type IconName = 'search' | 'layers' | 'eye' | 'hidden' | 'focus' | 'reset' | 'play' | 'pause' | 'download' | 'arrow' | 'cube' | 'check' | 'close' | 'wire' | 'sun' | 'spark' | 'note' | 'chevron';
const REVIEW_KEY = 'lucas-asset-studio-reviews-v1';
const statusLabels = { ready: '可预览', review: '待精修', planned: '待制作' };
const reviewLabels: Record<ReviewState, string> = { unreviewed: '待审阅', changes: '需改进', approved: '已确认' };
const emptyReview: Review = { status: 'unreviewed', note: '' };

function Icon({ name, size = 18, ...props }: { name: IconName; size?: number; className?: string }) {
  const shapes: Record<IconName, ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    layers: <><path d="m3 8 9-5 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    hidden: <><path d="m3 3 18 18M9.5 6.3 2 12s3.5 6 10 6a12 12 0 0 0 5-1M14 6.2c5 .9 8 5.8 8 5.8l-2.5 3" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
    focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="3" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></>,
    play: <path d="m9 5 11 7-11 7V5Z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5" /></>,
    arrow: <><path d="M6 18 18 6M7 6h11v11" /></>,
    cube: <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    wire: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l18 9M21 8 3 17M12 3v19" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4" /></>,
    note: <><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 8h8M8 12h8M8 16h5" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>;
}

function getReviews(): Reviews {
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => value && typeof value === 'object' && 'note' in value && typeof value.note === 'string' && 'status' in value && ['unreviewed', 'changes', 'approved'].includes(String(value.status)))) as Reviews;
  } catch { return {}; }
}

function readHash() { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export default function App() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedId, setSelectedId] = useState(readHash);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [hiddenParts, setHiddenParts] = useState<string[]>([]);
  const [isolatedPart, setIsolatedPart] = useState<string | null>(null);
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [lighting, setLighting] = useState<'studio' | 'dream'>('studio');
  const [resetKey, setResetKey] = useState(0);
  const [viewerStatus, setViewerStatus] = useState('');
  const [tab, setTab] = useState<'parts' | 'review' | 'texture'>('parts');
  const [textureEdits,setTextureEdits]=useState(readTextureEdits);
  const [textureFocus,setTextureFocus]=useState<{target:TextureTarget;key:number}>({target:'inscription',key:0});
  const [reviews, setReviews] = useState<Reviews>(getReviews);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(publicUrl('/assets/manifest.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`资产清单读取失败（${response.status}）`); return response.json(); })
      .then((data: { assets: AssetRecord[] }) => {
        if (!Array.isArray(data.assets)) throw new Error('资产清单格式不正确');
        setAssets(data.assets.map(asset => ({ ...asset, modelUrl: asset.modelUrl ? publicUrl(asset.modelUrl) : undefined, thumbnail: asset.thumbnail ? publicUrl(asset.thumbnail) : undefined })));
        setSelectedId(id => data.assets.some(item => item.id === id) ? id : (data.assets.find(item => item.modelUrl)?.id || data.assets[0]?.id || ''));
        setLoading(false);
      })
      .catch((err: Error) => { if (err.name !== 'AbortError') { setError(err.message); setLoading(false); } });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => { const update = () => setSelectedId(readHash()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { if (selectedId) history.replaceState(null, '', `#${encodeURIComponent(selectedId)}`); }, [selectedId]);
  useEffect(() => { setHiddenParts([]); setIsolatedPart(null); setExplode(0); setViewerStatus(''); setResetKey(value => value + 1); }, [selectedId]);
  useEffect(() => { try { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews)); setStorageError(false); } catch { setStorageError(true); } }, [reviews]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3000); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsolatedPart(null); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);

  const asset = assets.find(item => item.id === selectedId) || null;
  const review = reviews[selectedId] || emptyReview;
  const filtered = useMemo(() => assets.filter(item => `${item.name} ${item.subtitle} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())), [assets, query]);
  const availableCount = assets.filter(item => item.modelUrl).length;
  const updateReview = useCallback((patch: Partial<Review>) => {
    setReviews(current => ({ ...current, [selectedId]: { ...(current[selectedId] || emptyReview), ...patch, updatedAt: new Date().toISOString() } }));
  }, [selectedId]);

  function exportReviews() {
    const body = JSON.stringify({ project: 'Lucas OKR World', exportedAt: new Date().toISOString(), assets: assets.map(item => ({ id: item.id, name: item.name, ...reviews[item.id] || emptyReview })) }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `lucas-asset-reviews-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('审阅记录已导出');
  }

  function resetView() { setHiddenParts([]); setIsolatedPart(null); setExplode(0); setWireframe(false); setResetKey(value => value + 1); }

  return (
    <div className="studio-shell">
      <header className="topbar">
        <a className="brand" href="#park" aria-label="返回 Lucas 完整乐园">
          <span className="brand-symbol">✳</span><span className="brand-name">Lucas<span className="brand-dot">.</span></span><span className="brand-divider" /><span className="brand-context">ASSET STUDIO</span>
        </a>
        <div className="topbar-center"><a href="#park">← 完整乐园</a><span className="project-dot" />OKR WORLD<span className="topbar-year">2026 H2</span></div>
        <button className="button secondary export-button" onClick={exportReviews} disabled={!assets.length}><Icon name="download" size={16} /><span>导出审阅</span></button>
      </header>

      <div className="workspace">
        <aside className="asset-sidebar" aria-label="模型资产列表">
          <div className="sidebar-heading"><div><span className="eyebrow">THE COLLECTION</span><h1>模型资产<span>{String(assets.length).padStart(2, '0')}</span></h1></div><span className="small-spark">✧</span></div>
          <label className="search-field"><Icon name="search" size={17} /><input aria-label="搜索模型资产" placeholder="搜索名称或分类" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="清空搜索" onClick={() => setQuery('')}><Icon name="close" size={14} /></button>}</label>
          <div className="collection-meta"><span>全部资产</span><span>{availableCount} 件可预览</span></div>
          <div className="asset-list">
            {loading && <div className="list-empty"><span className="loading-dot" />正在打开资产库…</div>}
            {error && <div className="list-empty error-message"><p>{error}</p><button className="text-button" onClick={() => setReload(value => value + 1)}>重新载入</button></div>}
            {!loading && !error && !filtered.length && <div className="list-empty"><Icon name="search" size={24} /><p>没有找到相关资产</p>{query && <button className="text-button" onClick={() => setQuery('')}>清空搜索</button>}</div>}
            {filtered.map((item, index) => <button key={item.id} className={`asset-card ${item.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)} aria-pressed={item.id === selectedId}>
              <div className={`asset-thumbnail tone-${index % 4}`}>
                {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : <div className="model-placeholder"><Icon name="cube" size={38} /><span>{String(assets.indexOf(item) + 1).padStart(2, '0')}</span></div>}
                <span className={`status-pill status-${item.status}`}><i />{statusLabels[item.status]}</span>
                {reviews[item.id]?.status === 'approved' && <span className="approved-badge" title="已确认"><Icon name="check" size={13} /></span>}
              </div>
              <div className="asset-card-copy"><span className="asset-category">{item.category}</span><div className="asset-name-row"><h2>{item.name}</h2><Icon name="chevron" size={14} /></div><p>{item.subtitle}</p></div>
            </button>)}
          </div>
          <div className="collection-footer"><span className="footer-orbit">♡</span><div><strong>½ Fun + ½ Math</strong><span>从每个小部件，开始建造乐园。</span></div></div>
        </aside>

        <main className="main-stage">
          <div className="stage-heading"><div><div className="breadcrumb"><span>资产库</span><span>/</span><span>{asset?.category || '独立预览'}</span></div><h2>{asset?.name || '你的微缩世界'}<span className="viewer-format">THREE.JS</span></h2><p>{asset?.subtitle || '选择一个模型，查看它的结构与细节。'}</p></div><div className="stage-heading-actions">{asset?.modelUrl && <a className="icon-button" href={asset.modelUrl} download title="下载 GLB 模型" aria-label="下载 GLB 模型"><Icon name="download" /></a>}<button className="icon-button" onClick={resetView} title="重置视角及部件显示" aria-label="重置视角及部件显示"><Icon name="reset" /></button></div></div>

          <section className={`viewer-stage lighting-${lighting}`} aria-label={`${asset?.name || '模型'}三维预览`}>
            <div className="viewer-topline"><span className="view-badge"><span className="live-dot" />独立模型预览</span>{asset && <span className="model-id">{asset.id}</span>}</div>
            <Viewer asset={asset} hiddenParts={hiddenParts} isolatedPart={isolatedPart} explode={explode} autoRotate={autoRotate} wireframe={wireframe} lighting={lighting} resetKey={resetKey} onStatus={setViewerStatus} textureEdits={textureEdits} textureFocus={textureFocus} />
            {isolatedPart && <div className="isolation-banner"><Icon name="focus" size={14} /><span>独显 · {asset?.parts.find(part => part.id === isolatedPart)?.name}</span><button onClick={() => setIsolatedPart(null)} aria-label="退出独显"><Icon name="close" size={14} /></button></div>}
            <div className="viewer-footline"><span><span className="axis-marker"><i>X</i><i>Y</i><i>Z</i></span>拖动旋转 · 滚轮缩放 · 右键平移</span><span className="viewer-status" role="status">{viewerStatus}</span></div>
          </section>

          <div className="viewer-controls">
            <div className="light-control" aria-label="预览灯光"><button className={lighting === 'studio' ? 'active' : ''} onClick={() => setLighting('studio')} aria-pressed={lighting === 'studio'}><Icon name="sun" size={16} />棚拍</button><button className={lighting === 'dream' ? 'active' : ''} onClick={() => setLighting('dream')} aria-pressed={lighting === 'dream'}><Icon name="spark" size={16} />梦核</button></div>
            <span className="control-divider" />
            <button className={`toolbar-button ${autoRotate ? 'active' : ''}`} onClick={() => setAutoRotate(value => !value)} aria-pressed={autoRotate}><Icon name={autoRotate ? 'pause' : 'play'} size={16} /><span>自动旋转</span></button>
            <button className={`toolbar-button ${wireframe ? 'active' : ''}`} onClick={() => setWireframe(value => !value)} aria-pressed={wireframe}><Icon name="wire" size={17} /><span>线框</span></button>
            <div className="explode-control"><label htmlFor="explode"><Icon name="layers" size={16} /><span>拆件</span></label><input id="explode" type="range" min="0" max="1" step="0.01" value={explode} onChange={event => setExplode(Number(event.target.value))} disabled={!asset?.modelUrl || !!asset?.animation} /><output htmlFor="explode">{Math.round(explode * 100)}%</output></div>
          </div>

          <div className="asset-summary"><div><span className="eyebrow">ABOUT THIS OBJECT</span><p>{asset?.description || '每个主体独立查看、拆分和审阅，确认后再组装成完整场景。'}</p></div>{asset?.stats && <dl className="model-stats"><div><dt>三角面</dt><dd>{asset.stats.triangles.toLocaleString()}</dd></div><div><dt>材质</dt><dd>{asset.stats.materials}</dd></div><div><dt>文件</dt><dd>{formatBytes(asset.stats.bytes)}</dd></div></dl>}</div>
        </main>

        <aside className="inspector" aria-label="模型检查与审阅">
          <div className="inspector-heading"><span className="eyebrow">OBJECT INSPECTOR</span><span className="inspector-dot" /></div>
          <div className="inspector-tabs" role="tablist" aria-label="模型信息"><button role="tab" aria-selected={tab === 'parts'} className={tab === 'parts' ? 'active' : ''} onClick={() => setTab('parts')}><Icon name="layers" size={16} />部件<span>{asset?.parts.length || 0}</span></button><button role="tab" aria-selected={tab === 'review'} className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><Icon name="note" size={16} />审阅{review.note && <i />}</button>{asset?.id==='island'&&<button className={`texture-tab ${tab==='texture'?'active':''}`} role="tab" aria-selected={tab==='texture'} onClick={()=>setTab('texture')}>贴图编辑</button>}</div>
          <div className="inspector-content">
            {tab === 'texture' && asset?.id === 'island' ? <div role="tabpanel" aria-label="贴图编辑"><TextureEditor value={textureEdits} onChange={setTextureEdits} ready={viewerStatus==='模型已加载'} onFocus={target=>{setHiddenParts([]);setIsolatedPart(null);setExplode(0);setAutoRotate(false);setTextureFocus(v=>({target,key:v.key+1}));}}/></div> : tab === 'parts' || tab === 'texture' ? <div className="parts-panel" role="tabpanel" aria-label="模型部件">
              <div className="panel-intro"><p>独立部件，逐一检查。</p><button className="text-button" onClick={() => { setHiddenParts([]); setIsolatedPart(null); }} disabled={!hiddenParts.length && !isolatedPart}>全部显示</button></div>
              <div className="parts-tree">
                <div className="tree-root"><Icon name="cube" size={17} /><strong>{asset?.name || '尚未选择模型'}</strong><span>ROOT</span></div>
                {asset?.parts.map((part, index) => { const visible = !hiddenParts.includes(part.id); const isIsolated = isolatedPart === part.id; return <div key={part.id} className={`part-row ${!visible ? 'part-hidden' : ''} ${isIsolated ? 'part-isolated' : ''}`}>
                  <span className="tree-line" /><span className="part-number">{String(index + 1).padStart(2, '0')}</span><div className="part-copy"><span>{part.name}</span>{part.description && <p>{part.description}</p>}</div><div className="part-actions"><button className={`part-action ${isIsolated ? 'active' : ''}`} onClick={() => setIsolatedPart(value => value === part.id ? null : part.id)} aria-label={`${isIsolated ? '退出独显' : '独显'}${part.name}`} title={isIsolated ? '退出独显' : '仅显示此部件'} aria-pressed={isIsolated}><Icon name="focus" size={14} /></button><button className="part-action" onClick={() => { setHiddenParts(current => current.includes(part.id) ? current.filter(id => id !== part.id) : [...current, part.id]); if (isIsolated) setIsolatedPart(null); }} title={visible ? '隐藏部件' : '显示部件'} aria-label={`${visible ? '隐藏' : '显示'}${part.name}`} aria-pressed={visible}><Icon name={visible ? 'eye' : 'hidden'} size={15} /></button></div>
                </div>; })}
                {!asset?.parts.length && <p className="parts-empty">部件清单会随模型一起加入。</p>}
              </div>
              {asset?.notes && asset.notes.length > 0 && <div className="production-notes"><span className="mini-heading">制作说明</span>{asset.notes.map((note, index) => <p key={index}>{note}</p>)}</div>}
            </div> : <div className="review-panel" role="tabpanel" aria-label="模型审阅">
              <p className="review-intro">记录这一件的决定，再继续下一件。</p><label className="field-label" htmlFor="review-status">审阅状态</label><div id="review-status" className="review-status-options">{(Object.keys(reviewLabels) as ReviewState[]).map(value => <button key={value} className={review.status === value ? `active review-${value}` : ''} onClick={() => updateReview({ status: value })} disabled={!asset} aria-pressed={review.status === value}>{review.status === value && <Icon name="check" size={13} />}{reviewLabels[value]}</button>)}</div><label className="field-label" htmlFor="review-note">修改与想法</label><textarea id="review-note" value={review.note} onChange={event => updateReview({ note: event.target.value })} placeholder="例如：顶棚再高一点，蓝色稍微柔和一些…" disabled={!asset} /><div className={`save-note ${storageError ? 'save-error' : ''}`}><Icon name={storageError ? 'close' : 'check'} size={13} />{storageError ? '本地保存失败，请导出记录备份' : '自动保存在当前浏览器'}</div><p className="storage-detail">审阅记录存于本机。换浏览器前，可通过右上角导出 JSON 留存。</p>
            </div>}
          </div>
          {asset && <div className="source-card"><span className="mini-heading">ASSET PROVENANCE</span><div className="source-title"><Icon name="cube" size={16} />{asset.source.url ? <a href={asset.source.url} target="_blank" rel="noreferrer">{asset.source.label}<Icon name="arrow" size={13} /></a> : <span>{asset.source.label}</span>}</div>{asset.source.license && <p>{asset.source.license}</p>}<div className={`review-footer status-${review.status}`}><span className="review-dot" />{reviewLabels[review.status]}<button onClick={() => setTab('review')}>写审阅<Icon name="chevron" size={12} /></button></div></div>}
        </aside>
      </div>
      <footer className="page-footer"><span>LUCAS OKR WORLD<span className="footer-cross">×</span>OBJECTS BEFORE WORLDS</span><span>本地资产工作台 <span className="footer-version">01</span></span></footer>
      {toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}
    </div>
  );
}

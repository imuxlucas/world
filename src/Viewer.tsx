import {textureMatches, type TextureEdits, type TextureTarget} from './TextureEditor';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { AssetRecord } from './types';
import { applyCarouselPalette } from './carouselPalette';
import { applyParkPalette } from './parkPalette';
import {loadAssetMotion, type AssetMotion} from './assetMotion';

export type ViewerProps = {
  asset: AssetRecord | null;
  hiddenParts: string[];
  isolatedPart: string | null;
  explode: number;
  autoRotate: boolean;
  wireframe: boolean;
  lighting: 'studio' | 'dream';
  resetKey: number;
  textureEdits?: TextureEdits;
  textureFocus?: {target:TextureTarget;key:number};
  onStatus?: (value: string) => void;
};

type PartNode = { object: THREE.Object3D; original: THREE.Vector3; offset: THREE.Vector3; partId: string };
type LiveScene = {
  renderer: THREE.WebGLRenderer;
  model: THREE.Object3D;
  controls: OrbitControls;
  camera: THREE.PerspectiveCamera;
  home: THREE.Vector3;
  target: THREE.Vector3;
  parts: PartNode[];
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  lastExplode: number;
  mixer?: THREE.AnimationMixer;
  action?: THREE.AnimationAction;
  motion?: AssetMotion;
};

function releaseObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const values = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of values) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

export default function Viewer(props: ViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<LiveScene | null>(null);
  const currentRef = useRef(props);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [playhead, setPlayhead] = useState(0);
  const [motionInfo, setMotionInfo] = useState<{label: string; duration: number} | null>(null);
  const playbackRef = useRef({ playing, speed });
  playbackRef.current = { playing, speed };
  currentRef.current = props;

  useEffect(() => {
    const host = hostRef.current;
    const asset = props.asset;
    if (!host || !asset) return;
    let disposed = false;
    let frame = 0;
    let model: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let action: THREE.AnimationAction | undefined;
    let motion: AssetMotion | undefined;
    const controller = new AbortController();
    let uiElapsed = 0;
    const editable: {target:TextureTarget;map:THREE.Texture;base:THREE.Matrix3;mesh:THREE.Mesh}[]=[];
    let lastEdits='',lastFocus=currentRef.current.textureFocus?.key??0;
    const uvTransform=new THREE.Matrix3();
    setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches); setSpeed(1); setPlayhead(0); setMotionInfo(null);
    let renderer: THREE.WebGLRenderer;
    setError(null);
    setLoading(true);
    currentRef.current.onStatus?.('正在加载模型');
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setError('当前浏览器未能启动 WebGL。请在 Chrome 或 Safari 中打开此页；仍可查看右侧部件清单和下载源模型。');
      setLoading(false);
      currentRef.current.onStatus?.('WebGL 不可用');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const porcelainAsset = asset.id === 'island' || asset.id === 'carousel' || asset.id === 'link';
    renderer.toneMappingExposure = porcelainAsset ? 1.0 : asset.id === 'craft' ? 0.9 : 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xffffff, 0);
    renderer.domElement.setAttribute('aria-label', `${asset.name} 三维模型，可拖动旋转，滚轮缩放`);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.dataset.asset = asset.id;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    if (asset.id === 'craft') scene.background = new THREE.Color(0x101729);
    if (asset.id === 'link') scene.background = new THREE.Color(0xf5f7ff);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotateSpeed = 0.65;
    controls.maxPolarAngle = Math.PI * 0.93;
    controls.screenSpacePanning = true;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = porcelainAsset ? 0.4 : 0.6;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xeef3ff, 0xa8a6be, porcelainAsset ? 0.65 : 1.6));
    const key = new THREE.DirectionalLight(0xffffff, porcelainAsset ? 1.6 : asset.id === 'craft' ? 2.0 : 3.3);
    key.position.set(5, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.00015;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8daff, 1.6);
    fill.position.set(-5, 4, -4);
    scene.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.12, color: 0x75819a }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    ground.receiveShadow = true;
    scene.add(ground);
    const composer = asset.id === 'link'
      ? new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }))
      : asset.id === 'craft' ? new EffectComposer(renderer) : null;
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), asset.id === 'link' ? 0.18 : 0.22, 0.25, 2.0));
      composer.addPass(new OutputPass());
    }
    const resize = () => {
      const w = Math.max(host.clientWidth, 1), h = Math.max(host.clientHeight, 1);
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (mixer && action) {
        if (playbackRef.current.playing && !document.hidden) mixer.update(delta * playbackRef.current.speed);
        uiElapsed += delta;
        if (uiElapsed >= 0.1) { setPlayhead(action.time); uiElapsed = 0; }
        renderer.domElement.dataset.animationTime = action.time.toFixed(3);
      }
      const live = liveRef.current;
      const settings = currentRef.current;
      if (motion) {
        motion.setPlayback?.(playbackRef.current.playing && !document.hidden && settings.explode === 0, playbackRef.current.speed);
        // Freeze while exploded so assembly inspection remains legible.
        if (playbackRef.current.playing && !document.hidden && settings.explode === 0) motion.update(delta * playbackRef.current.speed);
        uiElapsed += delta;
        if (uiElapsed >= .1) { setPlayhead(motion.time % motion.duration); uiElapsed = 0; }
        renderer.domElement.dataset.animationTime = motion.time.toFixed(3);
      }
      if (live) {
        live.controls.autoRotate = settings.autoRotate;
        if(asset.id==='island' && settings.textureEdits){
          const signature=JSON.stringify(settings.textureEdits);
          if(signature!==lastEdits){
            for(const entry of editable){const t=settings.textureEdits[entry.target];uvTransform.setUvTransform(t.offsetX,t.offsetY,1/t.scaleX,1/t.scaleY,THREE.MathUtils.degToRad(t.rotation),.5,.5);entry.map.matrixAutoUpdate=false;entry.map.matrix.copy(entry.base).premultiply(uvTransform);}
            lastEdits=signature;renderer.domElement.dataset.textureEdits=signature;
          }
          if(settings.textureFocus&&settings.textureFocus.key!==lastFocus){
            lastFocus=settings.textureFocus.key;const box=new THREE.Box3();editable.filter(e=>e.target===settings.textureFocus!.target).forEach(e=>box.expandByObject(e.mesh,true));
            if(!box.isEmpty()){const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const d=Math.max(size.x/camera.aspect,size.y,.5)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.25;
              controls.target.copy(center);camera.position.copy(center).add(settings.textureFocus.target==='inscription'?new THREE.Vector3(0,.12,1).normalize().multiplyScalar(d):new THREE.Vector3(0,1,.05).normalize().multiplyScalar(Math.max(d,size.z*1.8)));controls.update();}
          }
        }
        if (live.lastExplode !== settings.explode) {
          const ratio = (1 + settings.explode * 0.65) / (1 + live.lastExplode * 0.65);
          live.camera.position.sub(live.controls.target).multiplyScalar(ratio).add(live.controls.target);
          live.lastExplode = settings.explode;
        }
        const hidden = new Set(settings.hiddenParts);
        for (const node of live.parts) {
          node.object.visible = settings.isolatedPart ? settings.isolatedPart === node.partId : !hidden.has(node.partId);
          node.object.position.copy(node.original).addScaledVector(node.offset, settings.explode);
        }
        live.key.color.set(settings.lighting === 'dream' ? 0xffd4e8 : 0xffffff);
        live.fill.color.set(settings.lighting === 'dream' ? 0x9ec2ff : 0xc8daff);
        live.fill.intensity = porcelainAsset
          ? (settings.lighting === 'dream' ? 0.7 : 0.5)
          : (settings.lighting === 'dream' ? 2.2 : 1.6);
      }
      controls.update(delta);
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    tick();
    const load = async () => {
      try {
        const makeMotion = await loadAssetMotion(asset, controller.signal);
        if (disposed) return;
        let loaded: THREE.Object3D;
        if (asset.modelUrl) {
          const gltf = await new GLTFLoader().loadAsync(asset.modelUrl);
          loaded = gltf.scene;
          if (asset.id === 'carousel') applyCarouselPalette(loaded);
          applyParkPalette(loaded, asset.id);
          if (!disposed && asset.animation) {
            const clip = gltf.animations.find(clip => clip.name === asset.animation!.defaultClip);
            if (!clip) throw new Error('模型缺少预设动画片段。');
            mixer = new THREE.AnimationMixer(loaded);
            action = mixer.clipAction(clip); action.play();
          }
        } else if (asset.id === 'carousel') {
          const { createCarouselAsset } = await import('./assets/carousel');
          loaded = await createCarouselAsset();
        } else throw new Error('该资产尚未生成模型，当前仅提供拆件清单。');
        if (disposed) { releaseObject(loaded); return; }
        model = loaded;
        if(asset.id==='island')loaded.traverse(o=>{if(!(o instanceof THREE.Mesh))return;for(const material of Array.isArray(o.material)?o.material:[o.material]){if(!(material instanceof THREE.MeshStandardMaterial)||!material.map)continue;for(const target of ['inscription','paving'] as const)if(textureMatches(material.name,target)){material.map.updateMatrix();editable.push({target,map:material.map,base:material.map.matrix.clone(),mesh:o});}}});
        loaded.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(loaded);
        if (box.isEmpty()) throw new Error('模型没有可见几何，请检查源文件。');
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        motion = makeMotion?.(loaded);
        if (motion) setMotionInfo({label: motion.label, duration: motion.duration});
        // A wrapper preserves local part pivots while centering the complete asset.
        const wrapper = new THREE.Group();
        wrapper.position.set(-center.x, -box.min.y, -center.z);
        wrapper.add(loaded);
        scene.add(wrapper);
        loaded.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = !o.userData.noShadow;
            o.receiveShadow = asset.id !== 'dog' && !o.userData.noShadow;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            if (asset.id === 'island' && mats.every(m => /enamel|seam/i.test(m.name))) {
              // Fine enamel inlays should not cast undersampled, speckled shadows.
              o.castShadow = false;
              o.receiveShadow = false;
            }
            mats.forEach((m) => { if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = currentRef.current.wireframe; });
          }
        });
        const target = new THREE.Vector3(0, size.y * 0.48, 0);
        const fitHeight = Math.max(size.y, size.x / camera.aspect, size.z);
        const distance = fitHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (asset.id === 'island' ? 1.05 : 1.35);
        // The island's floor and curved front inscription need a centered elevated view.
        const viewDirection = asset.id === 'island'
          ? new THREE.Vector3(0, 1.05, 1.45)
          : asset.id === 'craft' ? new THREE.Vector3(0.22, 0.65, 1.65)
          : asset.id === 'link' ? new THREE.Vector3(0.20, 0.48, 1.85)
          : new THREE.Vector3(0.95, 0.7, 1.45);
        const home = target.clone().add(viewDirection.normalize().multiplyScalar(distance));
        camera.position.copy(home);
        camera.near = Math.max(size.length() / (asset.id === 'island' ? 100 : 1000), 0.005);
        camera.far = Math.max(size.length() * 60, 100);
        camera.updateProjectionMatrix();
        controls.target.copy(target);
        controls.minDistance = distance * 0.15;
        controls.maxDistance = distance * 4;
        const extent = size.length();
        key.shadow.camera.left = key.shadow.camera.bottom = -extent;
        key.shadow.camera.right = key.shadow.camera.top = extent;
        key.shadow.camera.far = extent * 5;
        key.position.set(extent, extent * 1.5, extent);
        key.shadow.camera.updateProjectionMatrix();
        loaded.updateMatrixWorld(true);
        const worldCenter = new THREE.Box3().setFromObject(loaded).getCenter(new THREE.Vector3());
        const parts: PartNode[] = [];
        for (const [partIndex, part] of asset.parts.entries()) {
          for (const name of part.nodeNames) {
            const node = loaded.getObjectByName(name);
            if (!node) continue;
            const partCenter = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
            const offset = part.explodeOffset
              ? new THREE.Vector3(...part.explodeOffset).multiplyScalar(extent)
              : partCenter.sub(worldCenter).multiplyScalar(0.6).add(
                new THREE.Vector3(Math.cos(partIndex * 2.4), 0.25 * partIndex, Math.sin(partIndex * 2.4)).multiplyScalar(extent * 0.13)
              );
            if (node.parent) {
              const inverse = new THREE.Quaternion(); node.parent.getWorldQuaternion(inverse).invert();
              offset.applyQuaternion(inverse);
              const scale = node.parent.getWorldScale(new THREE.Vector3());
              offset.divide(scale);
            }
            parts.push({ object: node, original: node.position.clone(), offset, partId: part.id });
          }
        }
        liveRef.current = { renderer, model: loaded, camera, controls, home, target, parts, key, fill, lastExplode: 0, mixer, action, motion };
        renderer.domElement.dataset.loaded = 'true';
        renderer.domElement.dataset.parts = String(parts.length);
        setLoading(false);
        currentRef.current.onStatus?.('模型已加载');
      } catch (reason) {
        if (!disposed) {
          setLoading(false);
          setError(reason instanceof Error ? reason.message : '模型加载失败，请检查资产文件。');
          currentRef.current.onStatus?.('模型加载失败');
        }
      }
    };
    void load();
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      liveRef.current = null;
      observer.disconnect();
      controls.dispose();
      motion?.dispose();
      if (model) { mixer?.stopAllAction(); mixer?.uncacheRoot(model); releaseObject(model); }
      releaseObject(ground);
      environment.dispose();
      composer?.passes.forEach(pass => pass.dispose());
      composer?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [props.asset?.id, props.asset?.modelUrl]);

  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    live.model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = props.wireframe;
      }
    });
  }, [props.wireframe]);
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    live.camera.position.copy(live.home);
    live.controls.target.copy(live.target);
    live.lastExplode = currentRef.current.explode;
    live.controls.update();
    if (live.action && live.mixer) { live.action.time = 0; live.mixer.update(0); setPlayhead(0); }
    if (live.motion) { live.motion.seek(0); setPlayhead(0); }
  }, [props.resetKey]);

  return <div className="model-viewer" ref={hostRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 350 }}>
    {loading && <div className="viewer-message" role="status">正在准备模型与材质…</div>}
    {error && <div className="viewer-message viewer-error" role="alert">{error}</div>}
    {(props.asset?.animation || motionInfo) && !loading && !error && <div className="animation-controls" aria-label={motionInfo ? '主体动画控制' : '散步动画控制'}>
      <span>{motionInfo ? (props.explode > 0 ? '拆件时暂停' : motionInfo.label) : '散步动画'}</span>
      <button onClick={() => setPlaying(value => !value)} aria-label={motionInfo ? (playing ? '暂停主体动画' : '播放主体动画') : (playing ? '暂停散步' : '播放散步')}>{playing ? '暂停' : '播放'}</button>
      <input aria-label="动画时间" type="range" min="0" max={motionInfo?.duration ?? props.asset?.animation?.duration} step="0.01" value={playhead} onChange={event => {
        const time = Number(event.target.value); setPlaying(false); setPlayhead(time);
        const live = liveRef.current;
        if (live?.action && live.mixer) { live.action.time = time; live.mixer.update(0); }
        live?.motion?.seek(time);
      }} />
      <output>{playhead.toFixed(1)}s</output>
      <select aria-label="动画速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select>
    </div>}
    {!props.asset && <div className="viewer-message">从左侧选择一个模型，开始查看。</div>}
  </div>;
}

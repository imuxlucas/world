import { publicUrl } from './publicUrl';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import { applyCarouselPalette } from './carouselPalette';
import { applyParkPalette } from './parkPalette';
import { applyIslandTexturePreset } from './islandTexturePreset';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {AssetRecord} from './types';
import {loadAssetMotion,type AssetMotion} from './assetMotion';
import {PARK_LAYOUT,DECK_Y,DOG_SCALE,DOG_STOPS,findPath,walkable,distance,type Point} from './parkNavigation';
import {OBJECTIVES,readOkrRoute,navigateOkr,type ObjectiveId} from './okrContent';
import OkrDetails from './OkrDetails';
import ParkViewport from './ParkViewport';
import FinderResourcePreview, {type FinderResource} from './components/FinderResourcePreview';
import './park.css';
import './okr.css';

const DOG_PHOTOS:FinderResource[]=Array.from({length:8},(_,index)=>({
  id:index+1,label:`小狗相册 · ${index+1} / 8`,file:`${String(index+1).padStart(2,'0')}.jpg`,
  src:publicUrl(`/media/dog-gallery/${String(index+1).padStart(2,'0')}.jpg`),
}));

function release(root:THREE.Object3D){
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const t of Object.values(m))if(t instanceof THREE.Texture)textures.add(t);}if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();}});
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
export default function ParkScene(){
  const host=useRef<HTMLDivElement>(null),reset=useRef(()=>{});
  const focusModel=useRef<(id:string|null)=>void>(()=>{});
  const [route,setRoute]=useState(readOkrRoute);
  const [dogPhoto,setDogPhoto]=useState<number|null>(null);
  const objective=route.objective;
  const selectedRef=useRef(objective?.model??null);selectedRef.current=objective?.model??null;
  const [lastObjective,setLastObjective]=useState(objective??OBJECTIVES[0]);
  useEffect(()=>{
    const update=()=>setRoute(readOkrRoute());
    window.addEventListener('hashchange',update);
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&selectedRef.current){event.preventDefault();navigateOkr(null);}};
    window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('hashchange',update);window.removeEventListener('keydown',key);};
  },[]);
  useEffect(()=>{
    focusModel.current(objective?.model??null);
    if(objective)setLastObjective(objective);
    else host.current?.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true});
  },[objective]);
  const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pausedRef=useRef(paused);pausedRef.current=paused||dogPhoto!==null;
  const [loaded,setLoaded]=useState(0),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setPaused(preference.matches);
    preference.addEventListener('change',update);
    return()=>preference.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const element=host.current!;let disposed=false,ready=false,needsRender=true,frame=0,dog:THREE.Group|undefined,mixer:THREE.AnimationMixer|undefined,action:THREE.AnimationAction|undefined;
    const motions=new Map<string,AssetMotion>();
    const objects=new Map<string,THREE.Group>();
    const bounds=new Map<string,THREE.Box3>();
    // Opacity is restored exactly, including glass and custom hologram materials.
    const surfaceStates=new Map<string,{material:THREE.Material;opacity:number;transparent:boolean;depthWrite:boolean}[]>();
    const fades=new Map<string,number>();
    let focused:string|null=null,transition=0,viewMix=0,fromMix=0,needsFit=false;
    const fromPosition=new THREE.Vector3(),fromTarget=new THREE.Vector3();let fromZoom=1;
    const parkPosition=new THREE.Vector3(.2,12.5,17),parkTarget=new THREE.Vector3(0,1.7,0);let parkZoom=1;
    let width=1,height=1,aspect=1,half=5.8,detailWidth=1008,detailRight=22;
    const fromFade=new Map<string,number>();
    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
    let renderer:THREE.WebGLRenderer;
    setLoaded(0);setError('');
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{setError('浏览器无法启动 3D 场景，请启用硬件加速后重试。');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xffffff,1);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    const canvas=renderer.domElement;canvas.dataset.park='true';canvas.dataset.loaded='false';canvas.setAttribute('aria-label','点击旋转木马、摩天轮或金属楼查看 OKR，点击小狗查看相册。数字键 1、2、3 选择目标，4 打开小狗相册，空格暂停，方向键环视，加减键缩放。');canvas.setAttribute('role','img');canvas.setAttribute('aria-keyshortcuts','1 2 3 4 Space ArrowLeft ArrowRight ArrowUp ArrowDown + -');canvas.tabIndex=0;element.appendChild(canvas);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
    const camera=new THREE.OrthographicCamera(-6,6,5.4,-5.4,.1,100);
    const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.minZoom=.65;controls.maxZoom=3;controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.2;controls.enablePan=false;
    const onKey=(event:KeyboardEvent)=>{
      if(event.code==='Space'){event.preventDefault();setPaused(p=>!p);}
      else if(event.key==='1'||event.key==='2'||event.key==='3'){event.preventDefault();navigateOkr(`o${event.key}` as ObjectiveId);}
      else if(event.key==='4'&&!selectedRef.current){event.preventDefault();setDogPhoto(0);}
      else if(event.key==='+'||event.key==='='||event.key==='-'){event.preventDefault();if(selectedRef.current)return;camera.zoom=THREE.MathUtils.clamp(camera.zoom*(event.key==='-'?.9:1.1),controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();needsRender=true;}
      else if(event.key.startsWith('Arrow')){event.preventDefault();const orbit=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(event.key==='ArrowLeft')orbit.theta-=.1;if(event.key==='ArrowRight')orbit.theta+=.1;if(event.key==='ArrowUp')orbit.phi-=.1;if(event.key==='ArrowDown')orbit.phi+=.1;orbit.phi=THREE.MathUtils.clamp(orbit.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));controls.update();needsRender=true;}
    };canvas.addEventListener('keydown',onKey);
    controls.addEventListener('change',()=>{needsRender=true;});
    reset.current=()=>{camera.position.set(.2,12.5,17);camera.zoom=1;controls.target.set(0,1.7,0);camera.updateProjectionMatrix();controls.update();};reset.current();
    function destination(){
      const box=focused?bounds.get(focused):null;
      if(!box)return {position:parkPosition,target:parkTarget,zoom:parkZoom,half:Math.max(5.2,5.8/aspect)};
      const size=box.getSize(new THREE.Vector3()),target=box.getCenter(new THREE.Vector3());
      const mobile=width<=760,roomWidth=mobile?.32:width<=1100?.22:Math.max(1,width-detailWidth-detailRight)*.8/width,roomHeight=mobile?.15:.43;
      return {position:target.clone().add(new THREE.Vector3(.15,5.8,17)),target,zoom:1,half:Math.max((size.y*.945+size.z*.323)/(2*roomHeight),size.x/(2*roomWidth*aspect))};
    }
    let fromHalf=half;
    function project(){
      const mobile=width<=760;
      const centerX=mobile?.72:width<=1100?.145:Math.max(1,width-detailWidth-detailRight)/(2*width);
      const centerY=mobile?(height<=620?43/height:.115):.445;
      const shiftX=half*aspect*(1-2*centerX)*viewMix,shiftY=half*(2*centerY-1)*viewMix;
      camera.left=-half*aspect+shiftX;camera.right=half*aspect+shiftX;camera.top=half+shiftY;camera.bottom=-half+shiftY;camera.updateProjectionMatrix();
    }
    focusModel.current=(id)=>{
      if(!ready)return;
      if(id===focused&&!needsFit)return;
      if(!focused&&id&&viewMix<.001&&!needsFit){parkPosition.copy(camera.position);parkTarget.copy(controls.target);parkZoom=camera.zoom;}
      focused=id;controls.enableZoom=!id;fromPosition.copy(camera.position);fromTarget.copy(controls.target);fromZoom=camera.zoom;fromHalf=half;fromMix=viewMix;
      fromFade.clear();fades.forEach((v,k)=>fromFade.set(k,v));
      transition=0;needsFit=true;controls.enabled=false;canvas.style.cursor=focused?'grab':'';
      canvas.dataset.focused=focused??'park';
    };
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    function pick(event:PointerEvent):ObjectiveId|'dog'|null{
      if(!ready||focused||needsFit)return null;
      const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const candidates=[...OBJECTIVES.map(o=>objects.get(o.model)),objects.get('dog')].filter((o):o is THREE.Group=>!!o);
      const hit=raycaster.intersectObjects(candidates,true)[0];if(!hit)return null;
      let object:THREE.Object3D|null=hit.object;
      while(object&&!object.name.startsWith('park-'))object=object.parent;
      if(object?.name==='park-dog')return 'dog';
      return OBJECTIVES.find(o=>`park-${o.model}`===object?.name)?.id??null;
    }
    let pressed:{x:number;y:number;id:ObjectiveId|'dog'|null}|null=null;
    const pointerDown=(event:PointerEvent)=>{if(event.button===0)pressed={x:event.clientX,y:event.clientY,id:pick(event)};};
    const pointerMove=(event:PointerEvent)=>{if(!event.buttons&&!focused)canvas.style.cursor=pick(event)?'pointer':'grab';};
    const pointerUp=(event:PointerEvent)=>{const down=pressed;pressed=null;if(down?.id&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6&&pick(event)===down.id){if(down.id==='dog')setDogPhoto(0);else navigateOkr(down.id);}};
    const pointerCancel=()=>{pressed=null;};
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.4;room.dispose();pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xf2f5ff,0xc6bfd2,.65));
    const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(-4,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:35});key.shadow.normalBias=.035;key.shadow.bias=-.00015;scene.add(key);
    const fill=new THREE.DirectionalLight(0xc9ddff,.5);fill.position.set(6,5,-5);scene.add(fill);
    // The complete park floats in the page, with no ground plane to receive its shadow.
    const resize=()=>{width=element.clientWidth;height=Math.max(element.clientHeight,1);const layout=getComputedStyle(element);detailWidth=parseFloat(layout.getPropertyValue('--okr-panel-width'))||1008;detailRight=parseFloat(layout.getPropertyValue('--okr-panel-right'))||48;aspect=width/height;half=destination().half;project();renderer.setSize(width,height);renderer.clear();needsRender=true;};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    let route:Point[]=[],stop=0,rest=0,walkTime=0,uiTimer=0,shadowTimer=0;let dogShadow:THREE.Mesh|undefined;
    const clock=new THREE.Clock();
    function tick(){
      if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);
      if(ready&&needsFit){
        transition=Math.min(1,transition+(reduceMotion.matches?1:dt/1.05));
        const ease=1-Math.pow(1-transition,4),goal=destination();
        camera.position.lerpVectors(fromPosition,goal.position,ease);controls.target.lerpVectors(fromTarget,goal.target,ease);camera.zoom=THREE.MathUtils.lerp(fromZoom,goal.zoom,ease);
        half=THREE.MathUtils.lerp(fromHalf,goal.half,ease);viewMix=THREE.MathUtils.lerp(fromMix,focused?1:0,ease);project();
        objects.forEach((object,id)=>{
          const fade=THREE.MathUtils.lerp(fromFade.get(id)??1,!focused||id===focused?1:0,Math.min(1,ease*1.5));fades.set(id,fade);object.visible=fade>.001;
          for(const state of surfaceStates.get(id)??[]){
            const transparent=state.transparent||fade<.999;
            if(state.material.transparent!==transparent){state.material.transparent=transparent;state.material.needsUpdate=true;}
            state.material.opacity=state.opacity*fade;state.material.depthWrite=fade<.999?false:state.depthWrite;
          }
        });
        if(dogShadow)dogShadow.visible=!focused;
        renderer.shadowMap.needsUpdate=true;needsRender=true;
        if(transition===1){needsFit=false;controls.enabled=true;canvas.dataset.transitioning='false';}
        else canvas.dataset.transitioning='true';
      }
      const running=ready&&!pausedRef.current&&!document.hidden;
      motions.forEach((motion,id)=>motion.setPlayback?.(running&&(!focused||id===focused)));
      if(running){
        motions.forEach((motion,id)=>{if(!focused||id===focused)motion.update(dt);});
        shadowTimer+=dt;if(shadowTimer>=1/20){renderer.shadowMap.needsUpdate=true;shadowTimer=0;}
      }
      if(dog&&mixer&&action&&running&&!focused){
        if(rest>0){rest-=dt;canvas.dataset.dogState='resting';}
        else {
          if(!route.length){const goal=DOG_STOPS[stop++%DOG_STOPS.length];route=findPath(dog.position,goal);if(!route.length)rest=1;}
          if(route.length){const next=route[0],dx=next.x-dog.position.x,dz=next.z-dog.position.z,angle=Math.atan2(dx,dz);const diff=Math.atan2(Math.sin(angle-dog.rotation.y),Math.cos(angle-dog.rotation.y));dog.rotation.y+=Math.sign(diff)*Math.min(Math.abs(diff),dt*1.6);
            if(Math.abs(diff)<.22){const step=Math.min(.24*dt,Math.hypot(dx,dz));if(step>0){const length=Math.hypot(dx,dz),p={x:dog.position.x+dx/length*step,z:dog.position.z+dz/length*step};if(walkable(p))dog.position.set(p.x,DECK_Y,p.z);else route=[];}mixer.update(dt);walkTime+=dt;canvas.dataset.dogState='walking';}
            else canvas.dataset.dogState='turning';
            if(distance(dog.position,next)<.015){route.shift();if(!route.length){rest=1.8+(stop%3)*.7;}}
          }
        }
      }
      if(dogShadow&&dog){dogShadow.position.set(dog.position.x,DECK_Y+.004,dog.position.z);dogShadow.rotation.z=-dog.rotation.y;}
      uiTimer+=dt;if(uiTimer>.15&&dog){canvas.dataset.dogPosition=JSON.stringify([dog.position.x,dog.position.y,dog.position.z]);canvas.dataset.dogTime=walkTime.toFixed(3);canvas.dataset.paused=String(pausedRef.current);canvas.dataset.motionTimes=JSON.stringify(Object.fromEntries([...motions].map(([id,motion])=>[id,Number(motion.time.toFixed(3))])));uiTimer=0;}
      controls.update();if(ready&&(needsRender||!pausedRef.current&&!document.hidden)){
        renderer.render(scene,camera);
        needsRender=false;
      }
    }
    tick();
    const controller=new AbortController();
    (async()=>{
      try{
        const res=await fetch(publicUrl('/assets/manifest.json'),{signal:controller.signal});if(!res.ok)throw new Error('无法读取模型清单');const manifest=await res.json() as {assets:AssetRecord[]};const loader=new GLTFLoader();
        for(const id of ['island','link','craft','carousel','dog']){
          const asset=manifest.assets.find(a=>a.id===id);if(!asset?.modelUrl)throw new Error(`缺少 ${id} 模型`);
          const makeMotion=await loadAssetMotion(asset,controller.signal);
          const gltf=await loader.loadAsync(publicUrl(asset.modelUrl));if(disposed){release(gltf.scene);return;}
          const root=gltf.scene;if(id==='carousel')applyCarouselPalette(root);applyParkPalette(root,id);if(id==='island')applyIslandTexturePreset(root);root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root,id!=='dog'),center=box.getCenter(new THREE.Vector3());
          if(makeMotion)motions.set(id,makeMotion(root));
          const wrapper=new THREE.Group();wrapper.name=`park-${id}`;
          if(id==='island')wrapper.add(root);
          else{
            const normalizer=new THREE.Group();normalizer.position.set(-center.x,-box.min.y,-center.z);normalizer.add(root);wrapper.add(normalizer);
            if(id==='dog'){
              wrapper.scale.setScalar(DOG_SCALE);wrapper.position.set(0,DECK_Y,2.8);dog=wrapper;mixer=new THREE.AnimationMixer(root);
              const clip=gltf.animations.find(c=>c.name==='Walk_InPlace');if(!clip)throw new Error('小柴犬缺少步行动画');action=mixer.clipAction(clip);action.play();mixer.update(0);
              const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=64;const ctx=textureCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(48,40,56,0.24)');gradient.addColorStop(1,'rgba(48,40,56,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
              dogShadow=new THREE.Mesh(new THREE.PlaneGeometry(.52,.72),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(textureCanvas),transparent:true,depthWrite:false}));dogShadow.rotation.x=-Math.PI/2;scene.add(dogShadow);
            }else {const place=PARK_LAYOUT.find(p=>p.id===id)!;wrapper.scale.setScalar(place.scale);wrapper.position.set(place.x,DECK_Y,place.z);}
          }
          root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=id!=='dog'&&!o.userData.noShadow;o.receiveShadow=id!=='dog'&&!o.userData.noShadow;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(m instanceof THREE.MeshPhysicalMaterial&&m.transmission>0){m.transmission=0;m.transparent=true;m.opacity=.24;m.depthWrite=false;o.castShadow=false;}}if(id==='island'&&materials.every(m=>/enamel|seam/i.test(m.name))){o.castShadow=false;o.receiveShadow=false;}}});
          scene.add(wrapper);objects.set(id,wrapper);fades.set(id,1);wrapper.updateMatrixWorld(true);bounds.set(id,new THREE.Box3().setFromObject(wrapper,true));
          const seen=new Set<THREE.Material>();const states:{material:THREE.Material;opacity:number;transparent:boolean;depthWrite:boolean}[]=[];
          wrapper.traverse(object=>{if(object instanceof THREE.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(!seen.has(material)){seen.add(material);states.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});}});
          surfaceStates.set(id,states);setLoaded(n=>n+1);
        }
        ready=true;canvas.dataset.loaded='true';canvas.dataset.models='5';renderer.shadowMap.needsUpdate=true;focusModel.current(selectedRef.current);
      }catch(e){if(!disposed)setError(e instanceof Error?e.message:'模型加载失败，请重试。');}
    })();
    return()=>{disposed=true;controller.abort();cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('keydown',onKey);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);focusModel.current=()=>{};controls.dispose();mixer?.stopAllAction();motions.forEach(motion=>motion.dispose());release(scene);env.dispose();key.shadow.dispose();renderer.dispose();canvas.remove();reset.current=()=>{};};
  },[retry]);
  return <ParkViewport><main className={`park-page ${objective?'has-objective':''}`}>
    <header className="park-header">
      {objective ? <button className="park-model-back" onClick={()=>navigateOkr(null)}>Back</button> : <div className="park-identity"><a href="#park" className="park-brand" aria-label="Lucas‘ World，回到参考视角" onClick={()=>{if(!objective)reset.current();}}><img src={publicUrl("/branding/lucas-world-v004.svg")} width="956" height="245" alt="Lucas‘ World" draggable={false}/></a><p className="park-motto">½ Fun + ½ Math</p></div>}
    </header>
    <section className="park-stage" aria-label={objective?`${objective.title} 独立模型`:'完整乐园'}><div className="park-canvas" ref={host}/>
      {loaded<5&&!error&&<div className="park-loading" role="status"><span/>加密努力中 · {loaded}/5</div>}
      {error&&<div className="park-loading" role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>重新加载</button></div>}
    </section>
    <OkrDetails objective={objective??lastObjective} kr={objective?route.kr:0} variant={route.variant} open={!!objective}/>
    {dogPhoto!==null&&<FinderResourcePreview files={DOG_PHOTOS} index={dogPhoto} onIndexChange={setDogPhoto} onClose={()=>setDogPhoto(null)}/>}
  </main></ParkViewport>;
}

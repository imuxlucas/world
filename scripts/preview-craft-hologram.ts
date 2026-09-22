import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createCraftMotion} from '../src/assetMotion';

export async function previewCraft() {
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,1000);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 document.body.style.margin='0';document.body.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.4;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xf2f5ff,0xc6bfd2,.65));const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(-4,10,7);scene.add(key);const fill=new THREE.DirectionalLight(0xc9ddff,.5);fill.position.set(6,5,-5);scene.add(fill);
 const root=(await new GLTFLoader().loadAsync('/assets/craft/v003/model.glb')).scene;scene.add(root);
 const before=new Map<string,THREE.Matrix4>();root.updateMatrixWorld(true);root.traverse(n=>{if(!/^Core_(light_rib|luminous_ring|glass_volume)/.test(n.name))before.set(n.name,n.matrixWorld.clone());});
 const motion=createCraftMotion(root),rotor=root.getObjectByName('craft-core-neon-rotor')!,hologram=root.getObjectByName('craft-hologram-video') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
 root.traverse(n=>{if(n instanceof THREE.Mesh){for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof THREE.MeshPhysicalMaterial&&m.transmission>0){m.transmission=0;m.transparent=true;m.opacity=.24;m.depthWrite=false;}}});
 const camera=new THREE.PerspectiveCamera(33,.9,.01,40);
 const video=document.querySelector<HTMLVideoElement>('video[data-craft-hologram]')!;
 if(video.readyState<2)await new Promise<void>((resolve,reject)=>{video.addEventListener('loadeddata',()=>resolve(),{once:true});video.addEventListener('error',()=>reject(new Error('Video load failed')),{once:true});});
 const set=async(angle:number,time:number,mode='full',dark=false)=>{
  motion.setPlayback?.(false);
  const sought=new Promise<void>(resolve=>{video.addEventListener('seeked',()=>resolve(),{once:true});});
  motion.seek(time);if(video.seeking)await sought;
  root.traverse(n=>n.visible=true);
  if(mode==='core')root.traverse(n=>{if(n instanceof THREE.Mesh){let p:THREE.Object3D|null=n;while(p&&p.name!=='craft_core'&&p!==rotor)p=p.parent;n.visible=!!p;}});
  if(mode==='image')root.traverse(n=>{if(n instanceof THREE.Mesh||n instanceof THREE.Points)n.visible=n===hologram;});
  scene.background=new THREE.Color(dark?0x111827:0xffffff);
  const distance=mode==='full'?6.8:5.8;camera.position.set(Math.sin(angle)*distance,2.05,Math.cos(angle)*distance);camera.lookAt(0,1.5,0);
  hologram.material.uniforms.uFrame.value.needsUpdate=true;
  root.updateMatrixWorld(true);renderer.render(scene,camera);
 };
 const verify=()=>{
  const stationary:string[]=[];root.updateMatrixWorld(true);
  for(const [name,matrix] of before){const node=root.getObjectByName(name);if(node&&!node.matrixWorld.equals(matrix))stationary.push(name);}
  if(stationary.length)throw new Error('Unintended architecture motion: '+stationary.join(','));
  const texture=hologram.material.uniforms.uFrame.value as THREE.VideoTexture;
  return {innerTubes:rotor.children.length,rotation:rotor.rotation.y,videoDuration:video.duration,videoTime:video.currentTime,videoReady:video.readyState,videoMuted:video.muted,videoLoop:video.loop,videoTexture:texture.isVideoTexture,hologramFloor:new THREE.Vector3().setFromMatrixPosition(hologram.matrixWorld).y,stationaryArchitecture:true};
 };
 await set(0,0);return {set,verify,root,motion,video,renderer,scene,camera};
}

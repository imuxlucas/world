import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createLinkMotion} from '../src/assetMotion';
export async function preview(version='v011'){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xf5f7ff);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1100,1000);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;document.body.style.margin='0';document.body.appendChild(renderer.domElement);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.4;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xf2f5ff,0xc6bfd2,.65));const light=new THREE.DirectionalLight(0xffffff,1.6);light.position.set(-4,10,7);scene.add(light);const fill=new THREE.DirectionalLight(0xc9ddff,.5);fill.position.set(6,5,-5);scene.add(fill);
 const root=(await new GLTFLoader().loadAsync(`/assets/link/${version}/model.glb`)).scene;scene.add(root);
 const route=await(await fetch(`/assets/link/${version}/route.json`)).json(),motion=createLinkMotion(root,route);
 const camera=new THREE.OrthographicCamera(-2.75,2.75,2.5,-2.5,.1,60);
 const set=(view:string,time=0)=>{
  motion.seek(time);root.traverse(n=>n.visible=true);camera.zoom=1;
  const target=new THREE.Vector3(0,2.12,0);camera.position.set(.1,3.5,12);
  if(view==='front')camera.position.set(0,2.2,12);
  if(view==='side')camera.position.set(12,3.8,.1);
  if(view==='three-quarter')camera.position.set(7,5,12);
  if(view==='base'){
   target.set(0,.33,0);camera.position.set(5,8,7);camera.zoom=1.05;
   root.children.forEach(n=>{if(!['link_base','link_ornament','link_supports'].includes(n.name))n.visible=false;});
  }
  if(view==='mat'){
   target.set(0,.34,0);camera.position.set(0,12,.001);camera.zoom=1.05;
   root.children.forEach(n=>{if(!['link_base','link_ornament'].includes(n.name))n.visible=false;});
  }
  if(view==='cupid'){target.set(0,2.48,-.12);camera.position.set(0,2.75,12);camera.zoom=3.8;root.getObjectByName('link_gondolas')!.visible=false;}
  if(view==='cabin'){
   const cabin=root.getObjectByName('link_gondola_01')!;const p=cabin.getWorldPosition(new THREE.Vector3());target.set(p.x,p.y-.39,p.z+.32);camera.position.copy(target).add(new THREE.Vector3(1.7,1.25,3));camera.zoom=5;
   root.children.forEach(n=>{if(n.name!=='link_gondolas')n.visible=false;});root.getObjectByName('link_gondolas')!.children.forEach(n=>n.visible=n===cabin);
  }
  camera.lookAt(target);camera.updateProjectionMatrix();renderer.render(scene,camera);
 };
 set('three-quarter',0);return {set};
}

import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createClosedTrack, createLinkMotion, createCarouselMotion, createCraftMotion} from '../src/assetMotion';

const assert = (ok: boolean, message: string) => { if (!ok) throw new Error(message); };
const near = (a: number, b: number, epsilon = 1e-5) => Math.abs(a - b) < epsilon;
const release = (root: THREE.Object3D) => {
  const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(n => { if (n instanceof THREE.Mesh) { n.geometry.dispose(); for (const m of Array.isArray(n.material) ? n.material : [n.material]) materials.add(m); } });
  materials.forEach(m => { for (const t of Object.values(m)) if (t instanceof THREE.Texture) textures.add(t); m.dispose(); }); textures.forEach(t => t.dispose());
};
export async function verify() {
  const loader = new GLTFLoader();
  const manifest = await (await fetch('/assets/manifest.json')).json();
  const linkUrl = manifest.assets.find((a: {id: string}) => a.id === 'link').modelUrl;
  const route = await (await fetch(linkUrl.replace('model.glb', 'route.json'))).json();
  const track = createClosedTrack(route);
  const root = (await loader.loadAsync(linkUrl)).scene;
  const cabins: THREE.Object3D[] = []; root.traverse(n => { if (/^link_gondola_\d+$/.test(n.name)) cabins.push(n); });
  cabins.sort((a,b)=>a.name.localeCompare(b.name));
  const authored = cabins.map(n => n.position.clone());
  const motion = createLinkMotion(root, route);
  cabins.sort((a,b)=>a.name.localeCompare(b.name));
  const original = cabins.map(n => ({p:n.position.clone(),q:n.quaternion.clone(),phase:track.nearest(n.position)}));
  if (route.gondolaPhase !== undefined) cabins.forEach((n,i)=>assert(n.position.distanceTo(authored[i])<1e-5,'Authored stations differ from runtime stations'));
  assert(track.direction === -1, 'The authored counterclockwise route must be reversed');
  let maxTrackError = 0, maxTravelError = 0, minCabinGap = Infinity, minY = Infinity, minArcGap = Infinity, maxArcGap = 0;
  const box = new THREE.Box3(), railPoint = new THREE.Vector3();
  for (let step = 0; step <= 960; step++) {
    const time = step * motion.duration / 960; motion.seek(time); root.updateMatrixWorld(true);
    for (const [i, n] of cabins.entries()) {
      const phase = track.nearest(n.position);
      maxTrackError = Math.max(maxTrackError, Math.hypot(n.position.x-track.at(phase,railPoint).x,n.position.y-railPoint.y));
      const nextPhase = track.nearest(cabins[(i+1)%cabins.length].position);
      const arcGap = ((phase-nextPhase)%track.length+track.length)%track.length;
      minArcGap = Math.min(minArcGap,arcGap); maxArcGap = Math.max(maxArcGap,arcGap);
      const expected = track.at(original[i].phase-track.length*time/motion.duration, railPoint);
      maxTravelError = Math.max(maxTravelError,Math.hypot(n.position.x-expected.x,n.position.y-expected.y));
      assert(n.quaternion.angleTo(original[i].q) < 1e-6,'Cabin tilted on the heart track');
      minY = Math.min(minY,box.setFromObject(n).min.y);
      for (let j=i+1;j<cabins.length;j++) minCabinGap = Math.min(minCabinGap,n.position.distanceTo(cabins[j].position));
    }
  }
  assert(maxArcGap-minArcGap<1e-5 && Math.abs(minArcGap-track.length/8)<1e-5,'Cabin arc-length spacing is unequal');
  assert(maxTrackError < 1e-5 && maxTravelError < 1e-5,'Cabins departed from the constant-speed rail path');
  cabins.forEach((n,i)=>assert(n.position.distanceTo(original[i].p)<1e-5,'Loop seam moved a cabin'));
  assert(minY > .4,'Cabins intersect their base');
  const left = original.findIndex(n => n.p.x < -2);
  motion.seek(.1); assert(cabins[left].position.y > original[left].p.y,'Clockwise motion must rise on the left');
  motion.dispose(); release(root);

  const carousel = (await loader.loadAsync('/assets/carousel/v005/model.glb')).scene;
  const fixed = ['base','column','canopy','lights'].map(name => carousel.getObjectByName(name)!);
  carousel.updateMatrixWorld(true); const fixedMatrices = fixed.map(n=>n.matrixWorld.clone());
  const mobileMotion = createCarouselMotion(carousel);
  const assembly = carousel.getObjectByName('rotating-carousel-assembly')!;
  const hinges:THREE.Object3D[]=[]; carousel.traverse(n=>{if(n.name.startsWith('sway-photo-mobile-'))hinges.push(n);});
  assert(hinges.length===12,'All photo chains need a suspension pivot');
  for (const hinge of hinges) {
    const mobile = hinge.children[0];
    assert(mobile.children.some(n=>n.name.startsWith('Pastel_heart_pendant')),'A heart pendant is detached from its moving chain');
  }
  let horseMin=Infinity,horseMax=-Infinity,maxSway=0,maxTopError=0;
  for(let step=0;step<=1120;step++) {
    mobileMotion.seek(step/20); carousel.updateMatrixWorld(true);
    fixed.forEach((n,i)=>assert(n.matrixWorld.equals(fixedMatrices[i]),'Fixed carousel architecture moved'));
    for(let i=1;i<=3;i++) {const h=carousel.getObjectByName(`horse-${i}`)!;horseMin=Math.min(horseMin,h.position.y);horseMax=Math.max(horseMax,h.position.y);}
    for(const hinge of hinges) {
      maxSway=Math.max(maxSway,Math.abs(hinge.rotation.x),Math.abs(hinge.rotation.z));
      const p=hinge.getWorldPosition(new THREE.Vector3()), angle=Math.atan2(p.x,p.z);
      const t=((angle/(Math.PI*2)*16)%1+1)%1,hem=4.83-.15*Math.sin(t*Math.PI);
      maxTopError=Math.max(maxTopError,Math.abs(hem-.027-p.y));
    }
  }
  assert(horseMin>=1.2999&&horseMax<=1.5001&&horseMax-horseMin>.19,'Horse lift range is wrong');
  assert(maxTopError<1e-4,'A string top disconnected from the scalloped canopy');
  assert(maxSway<=.031,'Photo sway exceeds the clearance envelope');
  mobileMotion.seek(10); const pose=assembly.quaternion.clone();mobileMotion.update(0);assert(assembly.quaternion.equals(pose),'Paused carousel moved');
  mobileMotion.seek(0);assert(near(assembly.rotation.y,0),'Carousel does not reset');
  mobileMotion.dispose();release(carousel);

  const craft=(await loader.loadAsync('/assets/craft/v003/model.glb')).scene;
  const code=craft.getObjectByName('Craft_code') as THREE.Mesh;
  const codeOriginal=code.material;
  const craftMotion=createCraftMotion(craft);
  const glowing:THREE.MeshStandardMaterial[]=[]; craft.traverse(n=>{if(n instanceof THREE.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof THREE.MeshStandardMaterial&&m.emissive.getHex())glowing.push(m);});
  const before=glowing.map(m=>m.emissiveIntensity);craftMotion.seek(1.5);
  assert(glowing.some((m,i)=>!near(m.emissiveIntensity,before[i])),'Craft lights do not breathe');
  assert((code.material as THREE.Material).customProgramCacheKey()==='lucas-code-flow-v1','Code flow shader is missing');
  craftMotion.dispose();assert(code.material===codeOriginal,'Craft materials were not restored on disposal');release(craft);
  return {link:{samples:route.samples.length,poses:961,cabins:8,clockwise:true,minArcGap,maxArcGap,maxTrackError,maxTravelError,minCabinGap,minY,closed:true,upright:true},carousel:{duration:28,chains:hinges.length,horseMin,horseMax,maxSway,maxTopError,stationaryArchitecture:true,pauseReset:true},craft:{codeShader:true,lightPulse:true,cleanup:true}};
}

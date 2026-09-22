import * as THREE from 'three';
import type {AssetRecord} from './types';
import {createCraftHologram} from './craftHologram';

const TAU = Math.PI * 2;
const wrap = (value: number, length: number) => ((value % length) + length) % length;

export type AssetMotion = {
  readonly time: number;
  readonly duration: number;
  readonly label: string;
  update(delta: number): void;
  seek(time: number): void;
  setPlayback?(playing: boolean, speed?: number): void;
  dispose(): void;
};

function timeline(label: string, duration: number, apply: (time: number) => void, cleanup = () => {}): AssetMotion {
  let time = 0;
  apply(time);
  return {
    get time() { return time; }, duration, label,
    update(delta) { if (Number.isFinite(delta) && delta > 0) { time += delta; apply(time); } },
    seek(value) { if (Number.isFinite(value)) { time = Math.max(0, value); apply(time); } },
    dispose: cleanup,
  };
}

export type TrackRoute = {closed: boolean; coordinates: string; samples: [number, number, number][]; gondolaPhase?: number};

/** Use the authored rail, including its small heart lobes. Never smooth across them. */
export function createClosedTrack(route: TrackRoute) {
  if (!route.closed || route.samples.length < 3 || route.coordinates !== 'Blender Z up; front -Y') {
    throw new Error('摩天轮轨道数据无效');
  }
  const points = route.samples.map(([x, y, z]) => new THREE.Vector3(x, z, -y));
  if (points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) throw new Error('摩天轮轨道包含无效坐标');
  const cumulative = [0];
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    cumulative.push(cumulative[i] + a.distanceTo(b));
    area += a.x * b.y - b.x * a.y;
  }
  const length = cumulative[points.length];
  if (length === 0 || area === 0) throw new Error('摩天轮轨道没有有效长度或方向');
  // Looking from the park's +Z/front camera: negative signed area is clockwise.
  const direction = area > 0 ? -1 : 1;
  const at = (distance: number, target: THREE.Vector3) => {
    const d = wrap(distance, length);
    let lo = 0, hi = points.length;
    while (lo + 1 < hi) { const mid = (lo + hi) >>> 1; if (cumulative[mid] <= d) lo = mid; else hi = mid; }
    const segment = cumulative[lo + 1] - cumulative[lo];
    return target.lerpVectors(points[lo], points[(lo + 1) % points.length], segment > 0 ? (d - cumulative[lo]) / segment : 0);
  };
  const nearest = (point: THREE.Vector3) => {
    let distance = 0, best = Infinity;
    const ab = new THREE.Vector3(), ap = new THREE.Vector3(), sample = new THREE.Vector3();
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      ab.subVectors(b, a); ap.subVectors(point, a);
      const alpha = ab.lengthSq() ? THREE.MathUtils.clamp(ap.dot(ab) / ab.lengthSq(), 0, 1) : 0;
      sample.copy(a).addScaledVector(ab, alpha);
      if (sample.distanceToSquared(point) < best) {
        best = sample.distanceToSquared(point);
        distance = cumulative[i] + alpha * ab.length();
      }
    }
    return distance;
  };
  return {length, direction, at, nearest};
}

export function createLinkMotion(root: THREE.Object3D, route: TrackRoute): AssetMotion {
  const track = createClosedTrack(route), duration = 48;
  const cabins: {node: THREE.Object3D; start: number; depth: number}[] = [];
  root.traverse(node => {
    if (!/^link_gondola_\d+$/.test(node.name)) return;
    const start = track.nearest(node.position);
    // Preserve suspension depth, then space every cabin by arc length.
    cabins.push({node, start, depth: node.position.z - track.at(start, new THREE.Vector3()).z});
  });
  if (cabins.length !== 8) throw new Error('摩天轮需要八个独立车厢吊点');
  cabins.sort((a, b) => a.node.name.localeCompare(b.node.name));
  const phase = Number.isFinite(route.gondolaPhase) ? route.gondolaPhase! * track.length : cabins[0].start;
  cabins.forEach((cabin, i) => { cabin.start = phase + track.direction * i * track.length / cabins.length; });
  const point = new THREE.Vector3();
  return timeline('双心轨道', duration, time => {
    const travel = track.direction * wrap(time, duration) / duration * track.length;
    for (const {node, start, depth} of cabins) { node.position.copy(track.at(start + travel, point)); node.position.z += depth; }
    // Only translation is animated: each complete cabin remains upright.
  });
}

/** Adapted from 咕噜蛋Daria / carousel-lamp, lib/carousel-motion.ts and carousel-scene.ts.
 * Attribution and the original license are retained in public/assets/carousel/LICENSE.txt.
 * Same 28-second turn, gentle start and three out-of-phase horse lifts.
 */
export function createCarouselMotion(root: THREE.Object3D): AssetMotion {
  const frames = root.getObjectByName('frames'), horses = root.getObjectByName('horses'), rods = root.getObjectByName('rods');
  if (!frames || !horses || !rods || !frames.parent) throw new Error('旋转木马缺少动画部件');
  const assembly = new THREE.Group(); assembly.name = 'rotating-carousel-assembly';
  frames.parent.add(assembly);
  root.updateMatrixWorld(true);
  for (const part of [horses, rods, frames]) assembly.attach(part);
  const mounts = horses.children.filter(node => /^horse-\d+$/.test(node.name)).map(node => ({node, y: node.position.y}));
  if (mounts.length !== 3) throw new Error('旋转木马需要三匹独立木马');
  const pendants = frames.children.filter(node => node.name.startsWith('Pastel_heart_pendant'));
  const mobiles = frames.children.filter(node => /^photo-mobile-\d+$/.test(node.name));
  const hems = (angle: number) => 4.83 - .15 * Math.sin(wrap(angle / TAU * 16, 1) * Math.PI);
  const swings = mobiles.map(mobile => {
    const original = mobile.position.clone();
    // v004's extra heart pendants were siblings; keep them on their own chain.
    for (const pendant of pendants) {
      if (Math.hypot(pendant.position.x - original.x, pendant.position.z - original.z) < .01) mobile.attach(pendant);
    }
    let top = original.y;
    for (const child of mobile.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const box = new THREE.Box3().setFromObject(child), size = box.getSize(new THREE.Vector3());
      if (size.y > .5 && size.x < .03 && size.z < .03) {
        top = frames.worldToLocal(new THREE.Vector3(box.max.x, box.max.y, box.max.z)).y;
        break;
      }
    }
    const pivot = new THREE.Group(); pivot.name = `sway-${mobile.name}`;
    pivot.position.set(original.x, top, original.z); frames.add(pivot);
    pivot.updateMatrixWorld(true); pivot.attach(mobile);
    const phase = Math.atan2(original.x, original.z);
    return {pivot, top, phase};
  });
  return timeline('木马旋转', 28, time => {
    const ease = 1 - Math.exp(-time * 2.5);
    const angle = -TAU / 28 * (time - ease / 2.5);
    assembly.rotation.y = wrap(angle, TAU);
    mounts.forEach(({node, y}, i) => { node.position.y = y + .1 * ease * Math.sin(angle * 4 + i * TAU / 3); });
    swings.forEach(({pivot, top, phase}, i) => {
      // Travel just under the existing scalloped hem, keeping the suspension attached.
      pivot.position.y = top + hems(phase + angle) - hems(phase);
      // Small bounded sway about the actual string top; pauses preserve the exact pose.
      pivot.rotation.x = ease * (-.012 + .014 * Math.sin(time * 1.1 + i));
      pivot.rotation.z = ease * (.012 + .018 * Math.sin(time * 1.35 + i * 1.7));
    });
  });
}

export function createCraftMotion(root: THREE.Object3D): AssetMotion {
  const neon = root.getObjectByName('craft_neon');
  if (!neon) throw new Error('Craft 缺少霓虹灯管');
  const tubes: THREE.Object3D[] = [];
  neon.traverse(node => { if (/^Core_(light_rib|luminous_ring)/.test(node.name)) tubes.push(node); });
  if (tubes.length !== 17) throw new Error('Craft 内圈灯管部件不完整');
  const originalTubes = tubes.map(node => ({node, parent: node.parent!, matrix: node.matrix.clone()}));
  const rotor = new THREE.Group(); rotor.name = 'craft-core-neon-rotor'; neon.add(rotor);
  root.updateMatrixWorld(true); tubes.forEach(node => rotor.attach(node)); rotor.scale.set(1.28, 1, 1.28);
  const hologram = createCraftHologram(root);
  const pulses: {material: THREE.MeshStandardMaterial; intensity: number; phase: number}[] = [];
  const originalMaterials: {mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]}[] = [];
  const clones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  const codeTime = {value: 0};
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    const code = /^(Craft_code|Bracket_icon|Design_line_\d+)$/.test(node.name);
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const animated = materials.map(material => {
      if (!(material instanceof THREE.MeshStandardMaterial) || material.emissive.getHex() === 0) return material;
      if (!code && clones.has(material)) return clones.get(material)!;
      const clone = material.clone();
      if (code) {
        clone.onBeforeCompile = shader => {
          shader.uniforms.uCodeTime = codeTime;
          shader.vertexShader = `varying vec3 vCodePosition;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCodePosition = position;');
          shader.fragmentShader = `uniform float uCodeTime;\nvarying vec3 vCodePosition;\n${shader.fragmentShader}`.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            float cursor = fract(vCodePosition.x * .9 - uCodeTime * .24);
            float sweep = smoothstep(.48, .72, cursor) * (1.0 - smoothstep(.82, 1.0, cursor));
            totalEmissiveRadiance *= .48 + 1.15 * sweep;`);
        };
        clone.customProgramCacheKey = () => 'lucas-code-flow-v1';
      } else {
        clones.set(material, clone);
        pulses.push({material: clone, intensity: clone.emissiveIntensity, phase: pulses.length * 1.3});
      }
      return clone;
    });
    if (animated.some((material, i) => material !== materials[i])) {
      originalMaterials.push({mesh: node, material: node.material});
      node.material = Array.isArray(node.material) ? animated : animated[0];
    }
  });
  if (!pulses.length) throw new Error('代码工坊缺少灯光材质');
  const motion = timeline('灯管与全息', 24, time => {
    codeTime.value = time;
    rotor.rotation.y = -TAU * wrap(time, 24) / 24;
    hologram.setTime(time);
    for (const {material, intensity, phase} of pulses) material.emissiveIntensity = intensity * (.83 + .17 * Math.sin(time * TAU / 6 + phase));
  }, () => {
    hologram.dispose();
    for (const {node, parent, matrix} of originalTubes) { parent.add(node); node.matrix.copy(matrix); node.matrix.decompose(node.position,node.quaternion,node.scale); }
    rotor.removeFromParent();
    const disposable = new Set<THREE.Material>();
    for (const {mesh, material} of originalMaterials) {
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (m !== material && !(Array.isArray(material) && material.includes(m))) disposable.add(m);
      mesh.material = material;
    }
    disposable.forEach(material => material.dispose());
  });
  const seek = motion.seek;
  motion.seek = time => { seek(time); hologram.seek(motion.time); };
  motion.setPlayback = hologram.setPlayback;
  return motion;
}

export async function loadAssetMotion(asset: AssetRecord, signal?: AbortSignal) {
  if (asset.id === 'link' && asset.modelUrl) {
    const response = await fetch(publicUrl(asset.modelUrl.replace(/[^/]+$/, 'route.json')), {signal});
    if (!response.ok) throw new Error('无法读取摩天轮轨道');
    const route = await response.json() as TrackRoute;
    return (root: THREE.Object3D) => createLinkMotion(root, route);
  }
  if (asset.id === 'carousel') return createCarouselMotion;
  if (asset.id === 'craft') return createCraftMotion;
  return undefined;
}
import { publicUrl } from './publicUrl';

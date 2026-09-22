/** Adapted from Carousel Lamp © 2026 咕噜蛋Daria; see /assets/carousel/LICENSE.txt. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const paint = (color: string, metalness = 0.04) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.54, metalness });
const brass = paint('#b58b3b', 0.64);
function consolidate(group: THREE.Group) {
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>(),
    originals = new Set<THREE.BufferGeometry>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material))
      return;
    const geometry = object.geometry.clone();
    geometry.deleteAttribute('uv');
    geometry.applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld),
    );
    const batch = batches.get(object.material) ?? [];
    batch.push(geometry);
    batches.set(object.material, batch);
    originals.add(object.geometry);
  });
  group.clear();
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry)
      throw new Error('Unable to combine carousel ornament geometry');
    solid(group, geometry, material);
    geometries.forEach((g) => g.dispose());
  }
  originals.forEach((g) => g.dispose());
}

function solid(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: number[] = [0, 0, 0],
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(position[0], position[1], position[2]);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function oval(
  parent: THREE.Object3D,
  material: THREE.Material,
  position: number[],
  scale: number[],
) {
  const object = solid(
    parent,
    new THREE.SphereGeometry(1, 24, 16),
    material,
    position,
  );
  object.scale.set(scale[0], scale[1], scale[2]);
  return object;
}
function curve(
  parent: THREE.Object3D,
  material: THREE.Material,
  points: number[][],
  radius: number,
) {
  const path = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  return solid(
    parent,
    new THREE.TubeGeometry(path, 24, radius, 8, false),
    material,
  );
}
/** A tapered solid loft, rather than a flat silhouette, for carved necks and limbs. */
function loft(
  parent: THREE.Object3D,
  material: THREE.Material,
  points: number[][],
  widths: number[],
  depths: number[],
) {
  const path = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  const segments = 24,
    sides = 14,
    frames = path.computeFrenetFrames(segments, false),
    positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      p = path.getPointAt(t),
      u = t * (widths.length - 1),
      j = Math.min(widths.length - 2, Math.floor(u)),
      f = u - j;
    const w = THREE.MathUtils.lerp(widths[j], widths[j + 1], f),
      d = THREE.MathUtils.lerp(depths[j], depths[j + 1], f);
    for (let k = 0; k <= sides; k++) {
      const angle = (k / sides) * Math.PI * 2,
        v = p
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(angle) * w)
          .addScaledVector(frames.binormals[i], Math.sin(angle) * d);
      positions.push(v.x, v.y, v.z);
      if (i < segments && k < sides) {
        const a = i * (sides + 1) + k,
          b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  // Cap the loft at both ends so oblique views never reveal open tubes.
  for (const end of [0, segments]) {
    const p = path.getPointAt(end / segments),
      center = positions.length / 3;
    positions.push(p.x, p.y, p.z);
    for (let k = 0; k < sides; k++) {
      const a = end * (sides + 1) + k;
      if (end === 0) indices.push(center, a + 1, a);
      else indices.push(center, a, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return solid(parent, geometry, material);
}
export function createHorse(index: number) {
  const group = new THREE.Group();
  group.name = `solid-carousel-horse-${index + 1}`;
  const ivory = paint('#fff6f5'),
    mane = paint(['#d7b597', '#d5b8aa', '#dec1a6'][index % 3]),
    saddle = paint('#e997b8'),
    trim = paint('#dfb884', 0.35),
    hoof = paint('#45454f'),
    eye = paint('#25262b');
  ivory.name='Porcelain horse body';
  mane.name='Champagne carved mane';
  oval(group, ivory, [0, 0, 0], [0.4, 0.205, 0.15]);
  oval(group, ivory, [-0.235, 0.015, 0], [0.19, 0.215, 0.155]);
  oval(group, ivory, [0.24, -0.015, 0], [0.2, 0.19, 0.16]);
  loft(
    group,
    ivory,
    [
      [-0.23, 0.06, 0],
      [-0.3, 0.27, 0],
      [-0.4, 0.47, 0],
      [-0.46, 0.49, 0],
    ],
    [0.17, 0.145, 0.1, 0.1],
    [0.135, 0.11, 0.085, 0.08],
  );
  // Continuous tapered face: brow, long nasal bridge and a compact muzzle.
  loft(group,ivory,[[-.43,.55,0],[-.49,.51,0],[-.555,.425,0],[-.61,.35,0]],
    [.075,.095,.065,.060],[.072,.080,.062,.054]);
  const muzzle=oval(group,ivory,[-.62,.338,0],[.066,.049,.060]);
  muzzle.rotation.z=-.48;
  for (const z of [-0.06, 0.06]) {
    const ear = oval(group, ivory, [-0.41, 0.625, z], [0.033, 0.077, 0.025]);
    ear.rotation.z = -0.17;
    const inner = oval(
      group,
      paint('#edb1c3'),
      [-0.425, 0.635, z],
      [0.017, 0.043, 0.026],
    );
    inner.rotation.z = -0.17;
  }
  for (const z of [-1, 1]) {
    oval(group, eye, [-0.505, 0.51, z * 0.077], [0.027, 0.034, 0.012]);
    oval(group, paint('#ffffff'), [-0.512,.521,z*.088],[.008,.010,.004]);
    oval(group, hoof, [-0.645, 0.345, z * 0.049], [0.012, 0.017, 0.006]);
    curve(group,saddle,[[-.654,.313,z*.036],[-.629,.303,z*.052],[-.602,.313,z*.05]],.0035);
    const front =
      z === 1
        ? [
            [-0.24, -0.11, z * 0.135],
            [-0.38, -0.22, z * 0.18],
            [-0.49, -0.24, z * 0.18],
            [-0.49, -0.43, z * 0.18],
          ]
        : [
            [-0.23, -0.11, z * 0.135],
            [-0.34, -0.205, z * 0.18],
            [-0.43, -0.23, z * 0.18],
            [-0.43, -0.41, z * 0.18],
          ];
    const back =
      z === 1
        ? [
            [0.23, -0.1, z * 0.135],
            [0.35, -0.26, z * 0.18],
            [0.27, -0.40, z * 0.18],
            [0.29, -0.49, z * 0.18],
          ]
        : [
            [0.24, -0.1, z * 0.135],
            [0.40, -0.25, z * 0.18],
            [0.33, -0.38, z * 0.18],
            [0.35, -0.47, z * 0.18],
          ];
    for (const leg of [front, back]) {
      loft(
        group,
        ivory,
        leg,
        [0.073, 0.057, 0.037, 0.032],
        [0.06, 0.049, 0.034, 0.032],
      );
      const tip = leg[3];
      const shoe = oval(
        group,
        hoof,
        [tip[0] - 0.01, tip[1] - 0.025, tip[2]],
        [0.053, 0.048, 0.043],
      );
      shoe.rotation.z = -0.16;
    }
    curve(
      group,
      saddle,
      [
        [-0.425, 0.57, z * 0.078],
        [-0.52, 0.48, z * 0.083],
        [-0.60, 0.36, z * 0.065],
      ],
      0.009,
    );
    curve(
      group,
      saddle,
      [
        [-0.645, 0.365, z * 0.045],
        [-0.615, 0.38, z * 0.067],
        [-0.59, 0.35, z * 0.059],
      ],
      0.012,
    );
    curve(
      group,
      trim,
      [
        [-0.60, 0.36, z * 0.068],
        [-0.36, 0.19, z * 0.175],
        [-0.04, 0.19, z * 0.172],
      ],
      0.006,
    );
  }
  // A thick curved saddle pad follows the back and drops down both sides.
  const cloth=paint('#ffffff');cloth.name='Blue pink saddlecloth';
  oval(group, cloth, [0.01, 0.083, 0], [0.25, 0.172, 0.213]);
  oval(group, saddle, [0.03, 0.24, 0], [0.15, 0.045, 0.105]);
  for (const side of [-1, 1]) {
    oval(group, trim, [0.02, 0.085, side * 0.214], [0.025, 0.025, 0.008]);
    const stirrup = solid(
      group,
      new THREE.TorusGeometry(0.047, 0.009, 7, 20),
      trim,
      [0.1, -0.1, side * 0.225],
    );
    stirrup.scale.y = 1.3;
    curve(
      group,
      mane,
      [
        [0.1, 0.13, side * 0.225],
        [0.1, 0.01, side * 0.24],
        [0.1, -0.1, side * 0.225],
      ],
      0.012,
    );
  }
  // Forelock covers the poll and falls forward between the ears.
  for(let i=0;i<5;i++){
    const z=(i-2)*.022;
    curve(group,mane,[[-.36,.585,z],[-.425,.61,z],[-.48,.58,z],[-.49,.545,z*.7]],.026);
  }
  for (let i = 0; i < 10; i++) {
    const y = 0.56 - i * 0.039,
      x = -0.35 + i * 0.020;
    curve(
      group,
      mane,
      [
        [x, y, -0.018],
        [x + 0.08, y - 0.015, 0.012],
        [x + 0.09, y - 0.095, 0.018],
      ],
      0.032 - i * 0.0015,
    );
  }
  for (let i = 0; i < 5; i++) {
    const z = (i - 2) * 0.025;
    curve(
      group,
      mane,
      [
        [0.35, 0.06, z],
        [0.53, 0.08, z],
        [0.61, -0.12, z],
        [0.53, -0.31, z],
        [0.58, -0.35, z],
      ],
      0.027,
    );
  }
  consolidate(group);
  return group;
}
export function addPole(
  parent: THREE.Object3D,
  x: number,
  z: number,
  top: number,
) {
  const bottom = 0.75,
    pole = solid(
      parent,
      new THREE.CylinderGeometry(0.018, 0.021, top - bottom, 12),
      paint('#ddc9a1', 0.24),
      [x, (top + bottom) / 2, z],
    );
  pole.name = 'connected-carousel-pole';
  for (const y of [bottom + 0.025, top - 0.035]) {
    solid(parent, new THREE.CylinderGeometry(0.058, 0.067, 0.065, 16), brass, [
      x,
      y,
      z,
    ]);
  }
  const path: THREE.Vector3[] = [];
  for (let i = 0; i <= 220; i++) {
    const t = i / 220,
      a = t * Math.PI * 2 * 12;
    path.push(
      new THREE.Vector3(
        x + Math.sin(a) * 0.023,
        bottom + 0.08 + t * (top - bottom - 0.16),
        z + Math.cos(a) * 0.023,
      ),
    );
  }
  const helix = new THREE.CatmullRomCurve3(path);
  solid(parent, new THREE.TubeGeometry(helix, 220, 0.004, 4, false), brass);
}

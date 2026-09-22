import * as THREE from 'three';

// User-confirmed inscription calibration, 2026-09-22.
// Image dimensions are relative to the original UV mapping; offsets use UV units.
export const ISLAND_INSCRIPTION_PRESET = {
  scaleX: 1.04,
  scaleY: 1.2,
  offsetX: 0,
  offsetY: 0.02,
  rotation: 0,
};

export function applyIslandTexturePreset(root: THREE.Object3D) {
  const applied = new Set<THREE.Texture>();
  const p = ISLAND_INSCRIPTION_PRESET;
  const adjustment = new THREE.Matrix3().setUvTransform(
    p.offsetX, p.offsetY, 1 / p.scaleX, 1 / p.scaleY,
    THREE.MathUtils.degToRad(p.rotation), .5, .5,
  );
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial)
        || !/Glitter inscription/i.test(material.name)
        || !material.map || applied.has(material.map)) continue;
      const map = material.map;
      map.updateMatrix();
      map.matrixAutoUpdate = false;
      map.matrix.premultiply(adjustment);
      applied.add(map);
    }
  });
}

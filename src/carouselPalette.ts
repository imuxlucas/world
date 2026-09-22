import * as THREE from 'three';

/** Non-destructive color grading, before lighting so shadows retain their depth. */
export function applyCarouselPalette(root: THREE.Object3D) {
  const seen = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || seen.has(material)) continue;
      seen.add(material);
      if (/^Porcelain horse body(?:\.\d+)?$/.test(material.name)) {
        // Warm pearl white, below the bright plinth; bypass the whitening/exposure grade.
        material.color.set('#e5dfdc');
        material.metalness = 0.06;
        material.roughness = 0.32;
        if (material instanceof THREE.MeshPhysicalMaterial) {
          material.clearcoat = 0.38;
          material.clearcoatRoughness = 0.26;
          material.sheen = 0.16;
          material.sheenColor.set('#fff3eb');
          material.sheenRoughness = 0.55;
        }
        material.needsUpdate = true;
        continue;
      }
      const isBaseBand = material.name === 'Blue pink petal base band';
      if (material.map) {
        material.map.anisotropy = 16;
        material.map.needsUpdate = true;
      }
      if (isBaseBand && material.map) {
        // Reflect the final UV, including the atlas repeat/offset: petals point up.
        const map = material.map;
        map.updateMatrix();
        map.matrixAutoUpdate = false;
        const uv = map.matrix.elements;
        uv[1] *= -1;
        uv[4] *= -1;
        uv[7] = 1 - uv[7];
      }
      // Warm, readable trim instead of dark mirror-like gold in the shared park light.
      if (/Champagne trim|gold/i.test(material.name)) {
        material.color.set('#edb260');
        material.metalness = Math.min(material.metalness, 0.38);
        material.roughness = 0.3;
      }
      const previous = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          #include <map_fragment>
          // Grade the complete albedo (texture and enamel tint), not the scene.
          vec3 paint = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
          float lightness = dot(paint, vec3(0.2126, 0.7152, 0.0722));
          float chroma = max(max(paint.r, paint.g), paint.b) - min(min(paint.r, paint.g), paint.b);
          paint = (paint - 0.5) * 1.28 + 0.54;
          float gray = dot(paint, vec3(0.2126, 0.7152, 0.0722));
          paint = mix(vec3(gray), paint, 1.42);
          // Clear sky blue and rose pink remain distinct from the pale island artwork.
          float bluePaint = smoothstep(0.025, 0.13, paint.b - paint.r) * smoothstep(0.01, 0.10, paint.b - paint.g);
          float rosePaint = smoothstep(0.05, 0.18, paint.r - paint.g) * smoothstep(0.02, 0.12, paint.b - paint.g);
          paint = mix(paint, vec3(0.16, 0.65, 0.94), bluePaint * 0.32);
          paint = mix(paint, vec3(0.98, 0.36, 0.65), rosePaint * 0.28);
          float porcelain = smoothstep(0.65, 0.91, lightness) * (1.0 - smoothstep(0.035, 0.16, chroma));
          paint = mix(paint, vec3(1.0), porcelain * 0.94);
          diffuseColor.rgb = pow(clamp(paint, 0.0, 1.0), vec3(2.2));
        `);
        // Local exposure compensation: do not brighten the island or other rides.
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
          outgoingLight *= ${isBaseBand ? '1.08' : '1.38'};
          #include <opaque_fragment>
        `);
      };
      material.customProgramCacheKey = () => `carousel-palette-v3-${isBaseBand ? 'base' : 'body'}`;
      material.needsUpdate = true;
    }
  });
}

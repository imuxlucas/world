import * as THREE from 'three';

/** Warm paper-white island against cool porcelain rides; keep colored ornament. */
export function applyParkPalette(root: THREE.Object3D, id: string) {
  if (!['island', 'carousel', 'link'].includes(id)) return;
  const warm = id === 'island';
  const seen = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(m instanceof THREE.MeshStandardMaterial) || seen.has(m)) continue;
      seen.add(m);
      if (!warm && !/porcelain|pearl.*enamel|soft white cotton|ivory piping|ivory roof|Tulip column|saddlecloth|petal base/i.test(m.name)) continue;
      if (warm) {
        m.roughness = Math.max(m.roughness, 0.46);
        if (m instanceof THREE.MeshPhysicalMaterial) {
          m.clearcoat = Math.min(m.clearcoat, 0.16);
          m.clearcoatRoughness = 0.38;
        }
      }
      const previous = m.onBeforeCompile;
      const previousKey = m.customProgramCacheKey();
      m.onBeforeCompile = (shader, renderer) => {
        previous.call(m, shader, renderer);
        // Run after the carousel's existing albedo grade, not before its whitening.
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
          #include <color_fragment>
          vec3 temperaturePaint = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
          float temperatureHi = max(max(temperaturePaint.r, temperaturePaint.g), temperaturePaint.b);
          float temperatureLo = min(min(temperaturePaint.r, temperaturePaint.g), temperaturePaint.b);
          float neutralMask = (1.0 - smoothstep(0.07, 0.25, temperatureHi - temperatureLo))
            * smoothstep(0.60, 0.86, temperatureHi);
          vec3 temperatureTint = ${warm ? 'vec3(1.025, 0.982, 0.895)' : 'vec3(0.90, 0.94, 0.985)'};
          temperaturePaint = mix(temperaturePaint, temperaturePaint * temperatureTint, neutralMask);
          diffuseColor.rgb = pow(clamp(temperaturePaint, 0.0, 1.0), vec3(2.2));
        `);
      };
      m.customProgramCacheKey = () => `${previousKey}-warm-cool-v1-${id}`;
      m.needsUpdate = true;
    }
  });
}

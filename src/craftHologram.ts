import { publicUrl } from './publicUrl';
import * as THREE from 'three';

const VIDEO_URL = publicUrl('/assets/craft/hologram/winter-rgb-alpha.mp4');
const POSTER_URL = publicUrl('/assets/craft/hologram/poster-rgb-alpha.png');
export const HOLOGRAM_HEIGHT = 1.8;
export const HOLOGRAM_WIDTH = HOLOGRAM_HEIGHT * 224 / 492;

/** One video carries both RGB and its matte, keeping the two channels frame-exact. */
export function createCraftHologram(root: THREE.Object3D) {
  const core = root.getObjectByName('craft_core');
  const pedestal = root.getObjectByName('Core_base');
  if (!core || !pedestal) throw new Error('Craft 缺少中央光柱底座');
  root.updateMatrixWorld(true);
  const floor = new THREE.Box3().setFromObject(pedestal, true);
  const origin = core.worldToLocal(new THREE.Vector3((floor.min.x + floor.max.x) / 2, floor.max.y + .001, (floor.min.z + floor.max.z) / 2));
  const group = new THREE.Group(); group.name = 'craft-hologram'; group.position.copy(origin); core.add(group);
  const restored: {mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]; matrix: THREE.Matrix4}[] = [];
  for (const name of ['Core_glass_volume', 'Core_neck']) {
    const mesh = root.getObjectByName(name);
    if (!(mesh instanceof THREE.Mesh)) continue;
    restored.push({mesh, material: mesh.material, matrix: mesh.matrix.clone()});
    const glass = new THREE.MeshPhysicalMaterial({color: 0xb8edff, transparent: true, opacity: .055, roughness: .18, metalness: 0, depthWrite: false, side: THREE.DoubleSide});
    glass.envMapIntensity = .3; mesh.material = glass;
    // The inner tube fits the complete figure and stays inside the existing roof aperture.
    if (name === 'Core_glass_volume') mesh.applyMatrix4(new THREE.Matrix4().makeScale(1.28, 1, 1.28));
  }
  const video = document.createElement('video');
  video.dataset.craftHologram = 'true'; video.muted = true; video.defaultMuted = true;
  video.loop = true; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1; video.style.display = 'none';
  const texture = new THREE.VideoTexture(video); texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const poster = new THREE.TextureLoader().load(POSTER_URL); poster.colorSpace = THREE.NoColorSpace;
  const uniforms = {uFrame: {value: poster as THREE.Texture}, uTime: {value: 0}};
  const geometry = new THREE.PlaneGeometry(HOLOGRAM_WIDTH, HOLOGRAM_HEIGHT);
  geometry.translate(0, HOLOGRAM_HEIGHT / 2, 0);
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 centre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        // Rotate about world-up, so the image faces every azimuth while its feet stay grounded.
        vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
        float sx = length(modelMatrix[0].xyz), sy = length(modelMatrix[1].xyz);
        vec3 world = centre + right * position.x * sx + vec3(0.0, position.y * sy, 0.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uFrame;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 sampleUv = clamp(vUv, vec2(0.003), vec2(0.997));
        vec3 source = texture2D(uFrame, vec2(sampleUv.x * 0.5, sampleUv.y)).rgb;
        float matte = smoothstep(0.06, 0.94, texture2D(uFrame, vec2(0.5 + sampleUv.x * 0.5, sampleUv.y)).r);
        if (matte < 0.01) discard;
        vec2 grid = vUv * vec2(92.0, 246.0);
        float grain = 1.0 - smoothstep(0.30, 0.57, length(fract(grid) - 0.5));
        float detail = 1.0 - smoothstep(0.65, 1.4, max(fwidth(grid.x), fwidth(grid.y)));
        float dots = mix(1.0, mix(0.68, 1.0, grain), detail);
        float scan = 0.92 + 0.08 * sin(vUv.y * 680.0 - uTime * 2.4);
        float sweep = pow(0.5 + 0.5 * sin(vUv.y * 11.0 - uTime * 0.9), 12.0);
        vec3 tint = mix(vec3(0.23, 0.70, 1.0), vec3(0.84, 0.64, 1.0), vUv.y);
        vec3 srgb = clamp(mix(source, tint, 0.22) + tint * (0.075 + sweep * 0.08), 0.0, 1.0);
        vec3 linearColor = mix(srgb / 12.92, pow((srgb + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), srgb));
        gl_FragColor = vec4(linearColor, matte * dots * scan * 0.90);
        #include <colorspace_fragment>
      }`,
  });
  const image = new THREE.Mesh(geometry, material); image.name = 'craft-hologram-video';
  image.userData.noShadow = true; image.frustumCulled = false; image.renderOrder = 8; group.add(image);

  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(96 * 3);
  for (let i = 0; i < 96; i++) {
    const angle = i * 2.399963, radius = .33 + .04 * Math.sin(i * 1.7);
    positions.set([Math.cos(angle) * radius, (i * .618034 % 1) * HOLOGRAM_HEIGHT, Math.sin(angle) * radius], i * 3);
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.ShaderMaterial({
    uniforms: {uTime: uniforms.uTime}, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: `uniform float uTime; void main() { vec3 p=position; p.y=mod(p.y+uTime*0.045,2.2); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); gl_PointSize=1.7; }`,
    fragmentShader: `void main() { float d=length(gl_PointCoord-0.5); if(d>0.5)discard; gl_FragColor=vec4(0.22,0.66,1.0,(1.0-d*2.0)*0.20); #include <colorspace_fragment> }`.replace('#include <colorspace_fragment>', '\n#include <colorspace_fragment>\n'),
  }));
  particles.name = 'craft-hologram-particles'; particles.frustumCulled = false; group.add(particles);

  let disposed = false, requestedPlaying = false, playPending = false, pendingSeek = 0, lastBlockedAttempt = 0;
  const seek = (time: number) => {
    pendingSeek = Math.max(0, time);
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = pendingSeek % video.duration;
  };
  const tryPlay = () => {
    if (disposed || document.hidden || !requestedPlaying || playPending || !video.paused) return;
    playPending = true;
    void video.play().catch(() => { lastBlockedAttempt = performance.now(); }).finally(() => { playPending = false; if (!requestedPlaying) video.pause(); });
  };
  const ready = () => { uniforms.uFrame.value = texture; if (pendingSeek) seek(pendingSeek); tryPlay(); };
  video.addEventListener('loadeddata', ready);
  const retry = () => { lastBlockedAttempt = 0; tryPlay(); };
  const visibility = () => { if (document.hidden) video.pause(); else tryPlay(); };
  window.addEventListener('pointerdown', retry); window.addEventListener('keydown', retry);
  document.addEventListener('visibilitychange', visibility);
  document.body.appendChild(video); video.src = VIDEO_URL; video.load();
  return {
    group, video, image,
    setTime(time: number) { uniforms.uTime.value = time; },
    seek,
    setPlayback(playing: boolean, rate = 1) {
      requestedPlaying = playing;
      if (video.playbackRate !== rate) video.playbackRate = rate;
      if (!playing) { if (!video.paused) video.pause(); }
      else if (performance.now() - lastBlockedAttempt > 1500 || lastBlockedAttempt === 0) tryPlay();
    },
    dispose() {
      disposed = true; requestedPlaying = false;
      window.removeEventListener('pointerdown', retry); window.removeEventListener('keydown', retry);
      document.removeEventListener('visibilitychange', visibility);
      video.removeEventListener('loadeddata', ready); video.pause(); video.removeAttribute('src'); video.load(); video.remove();
      texture.dispose(); poster.dispose(); geometry.dispose(); material.dispose(); particleGeometry.dispose(); particles.material.dispose(); group.removeFromParent();
      for (const {mesh, material: original, matrix} of restored) {
        (mesh.material as THREE.Material).dispose(); mesh.material = original; mesh.matrix.copy(matrix); mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      }
    },
  };
}

import { publicUrl } from '../../publicUrl';
/**
 * Adapted from Carousel Lamp by 咕噜蛋Daria (2026).
 * https://github.com/Daria1216/carousel-lamp
 * Author has authorized this project's use, per Lucas's confirmation.
 * Full upstream license: /assets/carousel/LICENSE.txt
 * Changes: renderer/storage/UI removed; seven named asset parts; local textures;
 * blank memory frames; garden and renderer-only volumetric effects omitted.
 */
import * as THREE from 'three';
import { createHorse, addPole } from './ornaments';
import { refineCarousel } from './refine-v003';

export async function createCarouselAsset(): Promise<THREE.Group> {
  const root = new THREE.Group();
  root.name = 'carousel';
  root.userData = {
    source: 'Carousel Lamp · 咕噜蛋Daria',
    sourceUrl: 'https://github.com/Daria1216/carousel-lamp',
    revision: 'authorized-parts-v01',
    units: 'meters',
    rotationAxis: 'y',
  };
  const part = (name: string, label: string) => {
    const g = new THREE.Group();
    g.name = name;
    g.userData.label = label;
    root.add(g);
    return g;
  };
  const base = part('base', '圆形底座');
  const column = part('column', '彩绘中心柱');
  const canopy = part('canopy', '伞顶与花檐');
  const horses = part('horses', '三匹雕刻木马');
  const rods = part('rods', '连接吊杆');
  const frames = part('frames', '拍立得与吊饰');
  const lights = part('lights', '隐藏式灯环');
  let current = base;
  const textures = new Set<THREE.Texture>();
  const material = (color: string, roughness = 0.65) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.03 });
  const cream = material('#f2e7c9'),
    red = material('#b35142'),
    sky = material('#648dae'),
    green = material('#79914f'),
    yellow = material('#d3a846');
  const gold = new THREE.MeshStandardMaterial({
    color: '#bc9446',
    roughness: 0.34,
    metalness: 0.68,
  });
  const trimColors = [red, sky, green, yellow];
  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D = current,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function ring(
    radius: number,
    y: number,
    tube = 0.025,
    mat: THREE.Material = gold,
  ) {
    const m = mesh(
      new THREE.TorusGeometry(radius, tube, 8, 96),
      mat,
      current,
      0,
      y,
    );
    m.rotation.x = Math.PI / 2;
    return m;
  }
  const loader = new THREE.TextureLoader();
  const [painted, columnPaint, basePaint] = await Promise.all(
    ['carousel-panels.png', 'carousel-column.png', 'carousel-base.png'].map(async (file) => {
      const t = await loader.loadAsync(publicUrl('/assets/carousel/') + file);
      t.name = file;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      textures.add(t);
      return t;
    }),
  );
  function panels(
    repeat: number,
    source: THREE.Texture = painted,
    offset = 0,
    height = 1,
  ) {
    const t = source.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(repeat, height);
    t.offset.y = offset;
    textures.add(t);
    return new THREE.MeshStandardMaterial({
      map: t,
      color: '#ffffff',
      roughness: 0.63,
      metalness: 0.035,
    });
  }
  const stageMetal = new THREE.MeshStandardMaterial({
    color: '#b68a26',
    roughness: 0.34,
    metalness: 0.72,
  });
  // Solid, tiered architecture remains real geometry so the whole lamp can be orbited.
  mesh(new THREE.CylinderGeometry(1.42, 1.36, 0.16, 96), sky, current, 0, 0.12);
  mesh(
    new THREE.CylinderGeometry(1.43, 1.43, 0.38, 96),
    panels(2, basePaint, 0, 0.56),
    current,
    0,
    0.39,
  );
  mesh(
    new THREE.CylinderGeometry(1.5, 1.46, 0.1, 96),
    panels(2, basePaint, 0.56, 0.44),
    current,
    0,
    0.63,
  );
  mesh(
    new THREE.CylinderGeometry(1.4, 1.46, 0.07, 96),
    stageMetal,
    current,
    0,
    0.71,
  );
  ring(1.43, 0.2, 0.025);
  ring(1.44, 0.58, 0.025);
  ring(1.47, 0.7, 0.022);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const foot = mesh(
      new THREE.SphereGeometry(0.13, 16, 12),
      sky,
      current,
      Math.sin(a) * 1.08,
      0.045,
      Math.cos(a) * 1.08,
    );
    foot.scale.set(1, 0.48, 1);
  }
  current = column;
  const sections = [
    { y: 1.17, h: 0.86, r1: 0.34, r2: 0.48 },
    { y: 2.1, h: 1, r1: 0.28, r2: 0.34 },
    { y: 3.14, h: 1, r1: 0.32, r2: 0.28 },
    { y: 4.15, h: 1, r1: 0.44, r2: 0.32 },
  ];
  sections.forEach((s, i) => {
    // Reserve the red pointed-arch band for the capital above these sections.
    const sectionPaint = panels(
      1,
      columnPaint,
      [0, 0.23, 0.48, 0.23][i],
      [0.23, 0.25, 0.255, 0.25][i],
    );
    if (i === 3) sectionPaint.color.set('#a9cfff');
    mesh(
      new THREE.CylinderGeometry(s.r1, s.r2, s.h, 48),
      sectionPaint,
      current,
      0,
      s.y,
    );
    ring(s.r2 + 0.02, s.y - s.h / 2, 0.035, trimColors[i]);
    ring(s.r1 + 0.025, s.y + s.h / 2, 0.027, gold);
  });
  // The capital continues into the roof. Light comes from a concealed ring, not a loose white orb.
  mesh(
    new THREE.CylinderGeometry(0.53, 0.44, 0.52, 64),
    panels(1, columnPaint, 0.735, 0.265),
    current,
    0,
    4.91,
  );
  ring(0.53, 5.17, 0.033, gold);
  mesh(new THREE.CylinderGeometry(0.24, 0.38, 0.92, 48), cream, current, 0, 5.61);
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 48), gold, current, 0, 6.1);
  current = lights;
  const concealedLight = new THREE.MeshStandardMaterial({
    color: '#e0bd75',
    emissive: '#ffae4b',
    emissiveIntensity: 0,
    roughness: 0.45,
  });
  const lightRing = ring(0.75, 5.28, 0.042, concealedLight);
  lightRing.castShadow = false;
  current = canopy;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6,
      from = new THREE.Vector3(0, 5.98, 0),
      to = new THREE.Vector3(
        Math.sin(angle) * 1.83,
        5.4,
        Math.cos(angle) * 1.83,
      ),
      delta = to.clone().sub(from);
    const rib = mesh(
      new THREE.CylinderGeometry(0.012, 0.012, delta.length(), 8),
      gold,
    );
    rib.position.copy(from).add(to).multiplyScalar(0.5);
    rib.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
  }

  // A shallow striped canopy and scalloped fascia, with warm luminous lining.
  const roofProfile = [
    new THREE.Vector2(0.08, 6.22),
    new THREE.Vector2(0.22, 6.1),
    new THREE.Vector2(0.55, 5.93),
    new THREE.Vector2(1.04, 5.68),
    new THREE.Vector2(1.58, 5.46),
    new THREE.Vector2(2.13, 5.33),
  ];
  const roofMaterials = [
    material('#678fae'),
    material('#eee0bd'),
    material('#829ab1'),
    material('#eddfbd'),
  ];
  for (let i = 0; i < 16; i++) {
    const m = mesh(
      new THREE.LatheGeometry(
        roofProfile,
        10,
        (i * Math.PI) / 8,
        Math.PI / 8 + 0.001,
      ),
      roofMaterials[i % 4],
    );
    m.material.side = THREE.DoubleSide;
  }
  const shadeMat = new THREE.MeshStandardMaterial({
    color: '#fff0ca',
    emissive: '#ffc276',
    emissiveIntensity: 0.15,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const lining = mesh(
    new THREE.LatheGeometry(
      roofProfile.map((p) => new THREE.Vector2(p.x * 0.985, p.y - 0.028)),
      96,
    ),
    shadeMat,
    current,
  );
  lining.castShadow = false;
  const fascia = new THREE.CylinderGeometry(2.15, 2.15, 0.62, 224, 1, true);
  const positions = fascia.attributes.position;
  for (let i = 0; i <= 224; i++) {
    const fraction = ((i / 224) * 14) % 1;
    positions.setY(i, 0.31 + Math.sin(fraction * Math.PI) * 0.15);
  }
  positions.needsUpdate = true;
  fascia.computeVertexNormals();
  // Crop to the flower arches, excluding the unrelated horizontal borders.
  const fasciaMaterial = panels(2, painted, .14, .68);
  fasciaMaterial.side = THREE.DoubleSide;
  mesh(fascia, fasciaMaterial, current, 0, 5.3);
  ring(2.15, 4.99, 0.035, red);
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI * 2) / 14;
    mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      trimColors[i % 4],
      current,
      Math.sin(a) * 2.15,
      5.49,
      Math.cos(a) * 2.15,
    );
  }
  mesh(new THREE.SphereGeometry(0.13, 20, 16), red, current, 0, 6.33);
  ring(0.18, 6.18, 0.03, gold);
  current = rods;
  ring(0.96, 5.43, 0.014, gold);
  ring(0.96, 0.765, 0.012, gold);
  for (let i = 0; i < 3; i++) {
    const angle = 0.3 + (i * Math.PI * 2) / 3;
    const x = Math.sin(angle) * 0.96, z = Math.cos(angle) * 0.96;
    const horse = createHorse(i);
    horse.name = 'horse-' + (i + 1);
    horse.position.set(x, 1.4, z);
    horse.rotation.y = angle;
    horse.scale.setScalar(1.05);
    horses.add(horse);
    const rod = new THREE.Group();
    rod.name = 'rod-' + (i + 1);
    rods.add(rod);
    addPole(rod, x, z, 5.43);
  }
  current = frames;
  let photoIndex = 0;
  const neutral = material('#fff9e8');
  function labelFrame(c: CanvasRenderingContext2D, index: number) {
    c.fillStyle = '#fff9ed';
    c.fillRect(0, 560, 512, 80);
    c.fillStyle = '#856d5a';
    c.font = '22px sans-serif';
    c.textAlign = 'center';
    c.fillText(
      String(index + 1).padStart(2, '0') + '   /   dear memory',
      256,
      601,
    );
  }
  function frameTexture(index: number, image?: HTMLImageElement) {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 640;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#fff9ed';
    c.fillRect(0, 0, 512, 640);
    if (image) {
      const s = Math.max(440 / image.width, 520 / image.height);
      c.save();
      c.beginPath();
      c.rect(36, 30, 440, 520);
      c.clip();
      c.drawImage(
        image,
        36 + (440 - image.width * s) / 2,
        30 + (520 - image.height * s) / 2,
        image.width * s,
        image.height * s,
      );
      c.restore();
    } else {
      c.fillStyle = '#e7dfd2';
      c.fillRect(36, 30, 440, 520);
    }
    labelFrame(c, index);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.add(t);
    return t;
  }
  function line(parent: THREE.Object3D, length: number) {
    mesh(
      new THREE.CylinderGeometry(0.008, 0.008, length, 6),
      gold,
      parent,
      0,
      -length / 2,
    );
  }
  function gem(parent: THREE.Object3D, y: number, index: number, size = 0.046) {
    const m = new THREE.MeshPhysicalMaterial({
      color: ['#b5cbdf', '#e6b5ae', '#e5d3a3', '#b7caab'][index % 4],
      roughness: 0.16,
      metalness: 0.1,
      transmission: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    mesh(new THREE.IcosahedronGeometry(size, 1), m, parent, 0, y);
  }
  const charmShape = new THREE.Shape();
  for (let point = 0; point < 10; point++) {
    const angle = (point * Math.PI) / 5 + Math.PI / 2,
      radius = point % 2 ? 0.045 : 0.1;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    if (point === 0) charmShape.moveTo(x, y);
    else charmShape.lineTo(x, y);
  }
  charmShape.closePath();
  const charmGeometry = new THREE.ExtrudeGeometry(charmShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  const charmMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e8d7b4',
    roughness: 0.2,
    metalness: 0.25,
    iridescence: 1,
    clearcoat: 1,
    transparent: true,
    opacity: 0.88,
  });
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12 + 0.15,
      p = new THREE.Group();
    p.position.set(Math.sin(a) * 2.04, 5.12, Math.cos(a) * 2.04);
    p.rotation.y = a;
    p.userData.phase = i * 1.37;
    p.userData.sway = { x: 0, z: 0, vx: 0, vz: 0 };
    p.name = 'photo-mobile-' + (i + 1);
    frames.add(p);
    const len = 0.8 + (i % 4) * 0.31,
      double = [1, 4, 7, 10].includes(i),
      total = len + 0.87 + (double ? 1.1 : 0);
    line(p, total);
    gem(p, -0.24, i);
    gem(p, -0.52, i + 1, 0.032);
    for (let j = 0; j < (double ? 2 : 1); j++) {
      const index = photoIndex++,
        group = new THREE.Group();
      group.name = 'polaroid-' + (index + 1);
      group.position.y = -len - 0.42 - j * 1.1;
      group.rotation.z = Math.sin(i * 4.1 + j) * 0.07;
      p.add(group);
      const frame = mesh(
        new THREE.BoxGeometry(0.63, 0.8, 0.027),
        neutral.clone(),
        group,
      );
      frame.userData.photo = index;
      const face = mesh(
        new THREE.PlaneGeometry(0.62, 0.79),
        new THREE.MeshStandardMaterial({
          map: frameTexture(index),
          roughness: 0.83,
          side: THREE.DoubleSide,
        }),
        group,
        0,
        0,
        0.017,
      ) as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
      face.userData.photo = index;
      const back = mesh(
        new THREE.PlaneGeometry(0.62, 0.79),
        face.material,
        group,
        0,
        0,
        -0.017,
      );
      back.rotation.y = Math.PI;
      back.userData.photo = index;
      mesh(
        new THREE.BoxGeometry(0.048, 0.14, 0.07),
        trimColors[index % 4],
        group,
        0,
        0.42,
        0.04,
      );
    }
    if (i % 3 === 1) mesh(charmGeometry, charmMaterial, p, 0, -total - 0.12);
    gem(p, -total, i + 2, 0.075);
    gem(p, -total + 0.18, i + 1, 0.035);
    if (i % 3 === 0) {
      const bell = mesh(
        new THREE.ConeGeometry(0.07, 0.1, 16, 1, true),
        gold,
        p,
        0,
        -total - 0.14,
      );
      bell.rotation.z = Math.PI;
    }
  }
  // Ensure distinct, useful names survive GLB export and Blender import.
  let meshIndex = 0;
  let materialIndex = 0;
  const materials = new Set<THREE.Material>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    if (!node.name) node.name = (node.parent?.name || 'part') + '-mesh-' + (++meshIndex);
    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of list) {
      if (!materials.has(mat)) {
        materials.add(mat);
        if (!mat.name) mat.name = 'carousel-painted-' + (++materialIndex);
      }
    }
  });
  await refineCarousel(root);
  root.updateMatrixWorld(true);
  return root;
}

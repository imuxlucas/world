"""Extract the authorized upstream geometry into a renderer-free asset factory.

Source: Daria1216/carousel-lamp, © 2026 咕噜蛋Daria.
This deterministic adaptation preserves painted textures and original proportions.
"""
from pathlib import Path
import shutil

PROJECT = Path(__file__).resolve().parents[2]
VENDOR = PROJECT / 'asset-sources/vendor/carousel-lamp'
DEST = PROJECT / 'src/assets/carousel'
PUBLIC = PROJECT / 'public/assets/carousel'
DEST.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
source = (VENDOR / 'lib/carousel-scene.ts').read_text()

def between(start, end):
    return source[source.index(start):source.index(end)]

header = '''/**
 * Adapted from Carousel Lamp by 咕噜蛋Daria (2026).
 * https://github.com/Daria1216/carousel-lamp
 * Author has authorized this project's use, per Lucas's confirmation.
 * Full upstream license: /assets/carousel/LICENSE.txt
 * Changes: renderer/storage/UI removed; seven named asset parts; local textures;
 * blank memory frames; garden and renderer-only volumetric effects omitted.
 */
import * as THREE from 'three';
import { createHorse, addPole } from './ornaments';

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
'''
helpers = between('  const textures = new Set<THREE.Texture>();', '  const loader = new THREE.TextureLoader();')
helpers = helpers.replace('root', 'current')
loading = '''  const loader = new THREE.TextureLoader();
  const [painted, columnPaint, basePaint] = await Promise.all(
    ['carousel-panels.png', 'carousel-column.png', 'carousel-base.png'].map(async (file) => {
      const t = await loader.loadAsync('/assets/carousel/' + file);
      t.name = file;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      textures.add(t);
      return t;
    }),
  );
'''
panels = between('  function panels(', '  const stageMetal =')
architecture = between('  const stageMetal =', '  // Intentionally no floor plane, contact-shadow decal, or ground glow.')
architecture = architecture.replace('root', 'current')
architecture = architecture.replace('  const sections = [', "  current = column;\n  const sections = [")
architecture = architecture.replace('  const concealedLight =', "  current = lights;\n  const concealedLight =")
architecture = architecture.replace('  for (let i = 0; i < 6; i++) {', "  current = canopy;\n  for (let i = 0; i < 6; i++) {")
horses = '''  current = rods;
  ring(0.96, 5.7, 0.014, gold);
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
    addPole(rod, x, z, 5.7);
  }
  current = frames;
  let photoIndex = 0;
'''
frames = between("  const neutral = material('#fff9e8');", '  const projections = createMemoryProjections')
frames = frames.replace('  const faceFrames: THREE.Mesh[] = [];\n', '')
frames = frames.replace('renderer.capabilities.getMaxAnisotropy()', '4')
frames = frames.replace('rotatingStage.add(p);', "p.name = 'photo-mobile-' + (i + 1);\n    frames.add(p);")
frames = frames.replace('    pivots.push(p);\n', '')
frames = frames.replace('const index = faces.length,', 'const index = photoIndex++,')
frames = frames.replace('      hits.push(frame);\n', '').replace('      faceFrames.push(frame);\n', '').replace('      faces.push(face);\n', '').replace('      hits.push(face);\n', '').replace('      hits.push(back);\n', '')
frames = frames.replace('      group.position.y =', "      group.name = 'polaroid-' + (index + 1);\n      group.position.y =")
footer = '''  // Ensure distinct, useful names survive GLB export and Blender import.
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
  root.updateMatrixWorld(true);
  return root;
}
'''
(DEST / 'index.ts').write_text(header + helpers + loading + panels + architecture + horses + frames + footer)
ornaments = (VENDOR / 'lib/carousel-ornaments.ts').read_text()
ornaments = ornaments[:ornaments.index('export function addGarden')] + ornaments[ornaments.index('export function addPole'):]
(DEST / 'ornaments.ts').write_text('/** Adapted from Carousel Lamp © 2026 咕噜蛋Daria; see /assets/carousel/LICENSE.txt. */\n' + ornaments)
for name in ['carousel-panels.png', 'carousel-column.png', 'carousel-base.png']:
    shutil.copy2(VENDOR / 'public' / name, PUBLIC / name)
shutil.copy2(VENDOR / 'LICENSE', PUBLIC / 'LICENSE.txt')
print('Extracted authorized carousel factory and three local painted textures.')

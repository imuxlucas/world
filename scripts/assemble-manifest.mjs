import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = [];
const checks = [];
for (const id of ['carousel', 'craft', 'link', 'island', 'dog']) {
  const candidates = [`public/assets/${id}/parts.json`, `public/assets/${id}/v001/parts.json`];
  let asset;
  for (const file of candidates) {
    try { asset = JSON.parse(await fs.readFile(path.join(root, file), 'utf8')); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!asset) { checks.push({ id, available: false }); continue; }
  if (asset.id !== id || !Array.isArray(asset.parts)) throw new Error(`Invalid parts record: ${id}`);
  if (!asset.thumbnail && asset.thumbnailUrl) asset.thumbnail = asset.thumbnailUrl;
  const partIds = asset.parts.map(p => p.id);
  if (new Set(partIds).size !== partIds.length) throw new Error(`Duplicate part IDs in ${id}`);
  if (asset.modelUrl) {
    const filename = path.join(root, 'public', asset.modelUrl);
    const buffer = await fs.readFile(filename);
    if (buffer.toString('utf8', 0, 4) !== 'glTF') throw new Error(`Not GLB: ${filename}`);
    const jsonLength = buffer.readUInt32LE(12);
    const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));
    const nodeNames = new Set((gltf.nodes || []).map(n => n.name));
    const missing = asset.parts.flatMap(p => p.nodeNames).filter(n => !nodeNames.has(n));
    if (missing.length) throw new Error(`Missing semantic nodes in ${id}: ${missing.join(', ')}`);
    let triangles = 0;
    for (const node of gltf.nodes || []) {
      if (node.mesh === undefined) continue;
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        const count = gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count;
        const mode = primitive.mode ?? 4;
        triangles += mode === 4 ? count / 3 : mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0;
      }
    }
    asset.stats = { meshes: gltf.nodes.filter(n => n.mesh !== undefined).length, triangles: Math.round(triangles), materials: (gltf.materials || []).length, bytes: buffer.length };
    checks.push({ id, available: true, semanticParts: asset.parts.length, missing: [], ...asset.stats });
  } else checks.push({ id, available: id === 'carousel', semanticParts: asset.parts.length, runtimeFactory: id === 'carousel' });
  const thumbnailFile = `public/assets/${id}/thumbnail.png`;
  try { await fs.access(path.join(root, thumbnailFile)); asset.thumbnail = `/assets/${id}/thumbnail.png`; } catch {}
  assets.push(asset);
}
if (!assets.length) throw new Error('No real asset records yet');
await fs.mkdir(path.join(root, 'public/assets'), { recursive: true });
await fs.writeFile(path.join(root, 'public/assets/manifest.json'), JSON.stringify({ version: 1, assets }, null, 2) + '\n');
await fs.mkdir(path.join(root, 'artifacts'), { recursive: true });
await fs.writeFile(path.join(root, 'artifacts/asset-validation.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));

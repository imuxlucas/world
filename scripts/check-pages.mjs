import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist';
const entries = ['index.html', 'demos/lip-prompt/index.html', 'demos/tad-universal/index.html'];
let checked = 0;
function asset(url) {
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  const relative = clean.replace(/^\/world\//, '').replace(/^\//, '');
  const target = join(root, relative);
  assert(existsSync(target), `Missing published asset: ${url}`);
  if (statSync(target).isDirectory()) assert(existsSync(join(target, 'index.html')), `Missing entry: ${url}`);
  checked++;
}
for (const entry of entries) {
  const html = readFileSync(join(root, entry), 'utf8');
  assert(html.includes('/world/assets/'), `${entry} must use /world/`);
  for (const match of html.matchAll(/(?:src|href)="(\/world\/[^"?#]+)(?:[^\"]*)"/g)) asset(match[1]);
}
const manifest = JSON.parse(readFileSync(join(root, 'assets/manifest.json'), 'utf8'));
for (const item of manifest.assets) {
  if (item.modelUrl) asset(item.modelUrl);
  if (item.thumbnail) asset(item.thumbnail);
  if (item.id === 'link') asset(item.modelUrl.replace('model.glb', 'route.json'));
}
for (const file of readdirSync(join(root, 'assets')).filter(name => name.endsWith('.css'))) {
  const css = readFileSync(join(root, 'assets', file), 'utf8');
  for (const match of css.matchAll(/url\(["']?(\/world\/[^"')]+)["']?\)/g)) asset(match[1]);
}
for (let id = 1; id <= 3; id++) for (const state of ['before', 'after']) asset(`/demos/mobile-comparison/${id}${state}.png`);
for (let id = 1; id <= 7; id++) for (const state of ['before', 'after']) {
  asset(`/media/kr1-comparison/${id}${state}.${[1, 2, 4, 5].includes(id) ? 'gif' : 'png'}`);
  asset(`/media/kr1-comparison/${id}${state}-preview.jpg`);
}
for (const cover of ['ai-see', 'aha-moment', 'grok-bot']) asset(`/media/workflow-folder/${cover}.png`);
const publicGuide = readFileSync(join(root, 'media/workflow-finder/resources/1.md'), 'utf8');
assert(!/^-\s*(?:密码|password|邮箱)\s*[:：]/im.test(publicGuide), 'Public guide contains login information');
assert(!/https?:\/\/\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\/admin/.test(publicGuide), 'Public guide contains an internal admin URL');
console.log(`Pages checks passed: ${entries.length} entries and ${checked} asset references.`);

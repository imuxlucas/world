import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/orbitLayout.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { layoutOrbit, orbitCardDistance } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let checked = 0;
for (const width of [32, 180, 270, 320]) for (const gallery of ['prompt', 'paired']) {
  const heights = Array.from({ length: 14 }, (_, i) => width / (gallery === 'paired'
    ? (i % 7 === 0 ? 1.6 : 16 / 9)
    : [6, 10, 11].includes(i) ? 900 / 420 : i === 9 ? 1440 / 844 : i > 11 ? 2880 / 1688 : 16 / 9));
  const { radius, angles } = layoutOrbit(width, heights);
  for (let i = 0; i < heights.length; i++) {
    const next = (i + 1) % heights.length;
    const angle = ((angles[next] - angles[i] + 360) % 360) * Math.PI / 180;
    const gap = orbitCardDistance(width, heights[i], heights[next], radius, angle);
    assert(Math.abs(gap - 8) < .001, `${gallery}, width ${width}, pair ${i}: ${gap}px`);
    checked++;
  }
}
console.log(`Orbit checks passed: ${checked} adjacent card gaps, including circle closure, all 8px.`);

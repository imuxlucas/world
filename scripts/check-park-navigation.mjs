import fs from 'node:fs/promises';
import {transform} from 'esbuild';
import assert from 'node:assert/strict';
const source=await fs.readFile('src/parkNavigation.ts','utf8');const {code}=await transform(source,{loader:'ts',format:'esm'});
const n=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
assert.ok(n.DOG_STOPS.length>=6);
const paths=[];
for(const start of [{x:0,z:2.8},...n.DOG_STOPS])for(const goal of n.DOG_STOPS){
 const path=n.findPath(start,goal);assert.ok(path.length,'Unreachable roaming stop');let previous=start;
 for(const p of path){assert.ok(n.clearSegment(previous,p),'Unsafe path segment');previous=p;}
 assert.ok(n.distance(previous,goal)<1e-6);paths.push(path);
}
for(const a of n.PARK_LAYOUT){assert.ok(Math.hypot(a.x,a.z)+a.radius<4.93);for(const b of n.PARK_LAYOUT)if(a!==b)assert.ok(n.distance(a,b)>a.radius+b.radius);}
await fs.writeFile('artifacts/park-navigation-check.json',JSON.stringify({pathsChecked:paths.length,stops:n.DOG_STOPS.length,dogRadius:n.DOG_RADIUS,allSegmentsClear:true,platformFootprintsSeparated:true},null,2));
console.log('Navigation and layout checks passed:',paths.length,'paths');

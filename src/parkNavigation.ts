export type Point = { x: number; z: number };
export const DECK_Y = .566;
export const PARK_LAYOUT = [
  { id: 'link', x: 0, z: -2.15, scale: 1.05, radius: 2.36 },
  { id: 'carousel', x: -2.5, z: 1.45, scale: .60, radius: 1.27 },
  { id: 'craft', x: 2.55, z: 1.4, scale: 1.18, radius: 1.405 },
] as const;
export const DOG_SCALE = .27;
export const DOG_RADIUS = .30;
export const distance = (a: Point, b: Point) => Math.hypot(a.x-b.x,a.z-b.z);
export function walkable(p: Point) {
  return Math.hypot(p.x,p.z) < 4.55 && PARK_LAYOUT.every(o => distance(p,o)>o.radius+DOG_RADIUS+.065);
}
export function clearSegment(a: Point,b: Point) {
  const steps=Math.max(1,Math.ceil(distance(a,b)/.035));
  for(let i=0;i<=steps;i++) if(!walkable({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps})) return false;
  return true;
}
const STEP=.18, N=25;
const key=(x:number,z:number)=>`${x},${z}`;
const decode=(s:string):Point=>{const [x,z]=s.split(',').map(Number);return {x:x*STEP,z:z*STEP};};
export function findPath(start: Point,goal: Point): Point[] {
  if(!walkable(start)||!walkable(goal)) return [];
  if(clearSegment(start,goal)) return [goal];
  function nearest(p:Point) {
    let best='',d=Infinity;
    for(let x=-N;x<=N;x++) for(let z=-N;z<=N;z++) {
      const q={x:x*STEP,z:z*STEP}, dd=distance(p,q);
      if(dd<d&&walkable(q)&&clearSegment(p,q)){best=key(x,z);d=dd;}
    }
    return best;
  }
  const origin=nearest(start),target=nearest(goal);if(!origin||!target)return [];
  const open=new Set([origin]),came=new Map<string,string>(),g=new Map([[origin,0]]),closed=new Set<string>();
  while(open.size) {
    let current='',score=Infinity;
    for(const k of open){const f=g.get(k)!+distance(decode(k),decode(target));if(f<score){score=f;current=k;}}
    if(current===target){
      const raw:Point[]=[goal];let k=current;
      while(k!==origin){raw.unshift(decode(k));k=came.get(k)!;}raw.unshift(decode(origin));
      const result:Point[]=[];let from=start,index=0;
      while(index<raw.length){let far=index;for(let j=index;j<raw.length;j++){if(clearSegment(from,raw[j]))far=j;else break;}result.push(raw[far]);from=raw[far];index=far+1;}
      return result;
    }
    open.delete(current);closed.add(current);const [cx,cz]=current.split(',').map(Number);
    for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) {
      if(!dx&&!dz)continue;const x=cx+dx,z=cz+dz,k=key(x,z);
      if(Math.abs(x)>N||Math.abs(z)>N||closed.has(k))continue;
      if(!clearSegment(decode(current),decode(k)))continue;
      const cost=g.get(current)!+STEP*Math.hypot(dx,dz);
      if(cost<(g.get(k)??Infinity)){came.set(k,current);g.set(k,cost);open.add(k);}
    }
  }
  return [];
}
// The wider Link base closes the two rear passages; keep roaming stops in the connected front area.
export const DOG_STOPS:Point[]=[{x:0,z:3.6},{x:-.4,z:1},{x:1.1,z:.65},{x:2.9,z:3.25},{x:3.5,z:2.8},{x:1,z:3.8},{x:-1.35,z:3.8},{x:-3.9,z:2.2},{x:-2.7,z:3.5},{x:-1,z:.7}].filter(walkable);

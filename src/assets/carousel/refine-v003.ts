import { publicUrl } from '../../publicUrl';
import * as THREE from 'three';

/** Lucas's pastel porcelain art direction; original hanging assembly is retained. */
export async function refineCarousel(root: THREE.Group) {
  const loader=new THREE.TextureLoader();
  const [baseMap,columnMap,canopyMap,saddleMap]=await Promise.all(
    ['base','column','canopy','saddle'].map(async name=>{
      const t=await loader.loadAsync(publicUrl(`/assets/carousel/v002/${name}-paint.png`));
      t.name=`Lucas ${name} enamel v002`;t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=8;t.wrapS=THREE.RepeatWrapping;return t;
    })
  );
  const mat=(name:string,color:string,metalness=.04,roughness=.3)=>{
    const m=new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.4,clearcoatRoughness:.22});m.name=name;return m;
  };
  const white=mat('Porcelain ivory','#fff9f7'),pink=mat('Rose enamel','#efa5c4'),
    blue=mat('Powder blue enamel','#9fcbee'),gold=mat('Champagne trim','#dbb387',.62,.26);
  const painted=(name:string,map:THREE.Texture)=>{
    const m=mat(name,'#ffffff');m.map=map;return m;
  };
  let serial=0;
  const mesh=(parent:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material|THREE.Material[],name:string,y=0)=>{
    const o=new THREE.Mesh(g,m);o.name=`${name}-${++serial}`;o.position.y=y;
    o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  };
  const torus=(parent:THREE.Object3D,r:number,y:number,t:number,m:THREE.Material,name:string)=>{
    const o=mesh(parent,new THREE.TorusGeometry(r,t,10,128),m,name,y);o.rotation.x=Math.PI/2;return o;
  };
  const sphere=(parent:THREE.Object3D,r:number,p:THREE.Vector3,m:THREE.Material,name:string)=>{
    const o=mesh(parent,new THREE.SphereGeometry(r,16,12),m,name);o.position.copy(p);return o;
  };
  const tube=(parent:THREE.Object3D,points:THREE.Vector3[],r:number,m:THREE.Material,name:string,closed=false)=>
    mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,closed),Math.max(32,points.length*3),r,8,closed),m,name);
  const polar=(a:number,r:number,y:number)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
  const part=(name:string)=>root.getObjectByName(name)!;
  const base=part('base');base.clear();
  // Full disks meet at y=0; no ball feet or unsupported recessed underside.
  mesh(base,new THREE.CylinderGeometry(1.61,1.63,.14,128),white,'Ground contact lower step',.07);
  torus(base,1.61,.135,.025,white,'Rounded lower step lip');
  mesh(base,new THREE.CylinderGeometry(1.49,1.51,.13,128),white,'Upper porcelain step',.205);
  const band=baseMap.clone();band.repeat.set(3,.61);band.offset.y=.195;
  mesh(base,new THREE.CylinderGeometry(1.49,1.49,.29,128),[painted('Blue pink petal base band',band),white,white],'Petal painted drum',.405);
  mesh(base,new THREE.CylinderGeometry(1.51,1.49,.10,128),white,'Upper stage lip',.60);
  mesh(base,new THREE.CylinderGeometry(1.47,1.5,.095,128),white,'Flat porcelain stage',.6975);
  torus(base,1.485,.55,.019,pink,'Rose drum bead');
  torus(base,1.50,.652,.015,gold,'Fine stage champagne line');
  torus(base,1.40,.746,.008,pink,'Fine floor painted circle');
  const column=part('column');column.clear();
  for(let i=0;i<4;i++){
    const y=.745+i*1.065,h=1.065,r=.30+(i===0?.025:0);
    const texture=columnMap.clone();texture.repeat.set(1,.30);texture.offset.y=.35;
    mesh(column,new THREE.CylinderGeometry(r,r,h,64),[painted(`Tulip column section ${i+1}`,texture),white,white],'Tulip column',y+h/2);
    torus(column,r+.007,y+.01,.018,gold,'Column division');
  }
  mesh(column,new THREE.CylinderGeometry(.40,.30,.27,64),white,'Column capital',5.14);
  torus(column,.40,5.27,.02,gold,'Capital bead');
  const canopy=part('canopy');canopy.clear();
  const roofProfile=[new THREE.Vector2(.10,6.18),new THREE.Vector2(.22,6.01),new THREE.Vector2(.53,5.80),new THREE.Vector2(.96,5.55),new THREE.Vector2(1.48,5.32),new THREE.Vector2(2.04,5.16)];
  const roofMat=painted('Painted blue pink ivory roof',canopyMap);roofMat.side=THREE.DoubleSide;
  for(let i=0;i<16;i++){
    const g=new THREE.LatheGeometry(roofProfile,24,i*Math.PI/8,Math.PI/8);
    const roofPositions=g.attributes.position;
    for(let j=0;j<roofPositions.count;j++){
      if(Math.hypot(roofPositions.getX(j),roofPositions.getZ(j))>2.03){
        const a=Math.atan2(roofPositions.getX(j),roofPositions.getZ(j));
        roofPositions.setY(j,5.16+.15*Math.abs(Math.sin(a*8)));
      }
    }
    g.computeVertexNormals();
    const uv=g.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setXY(j,(i+uv.getX(j))/16,.42+uv.getY(j)*.35);
    mesh(canopy,g,roofMat,'Striped roof panel');
    tube(canopy,roofProfile.map(p=>polar(i*Math.PI/8,p.x,p.y+.012)),.012,white,'Roof seam');
  }
  const lining=mesh(canopy,new THREE.LatheGeometry(roofProfile.map(p=>new THREE.Vector2(p.x*.994,p.y-.025)),192),white,'Roof porcelain underside');
  (lining.material as THREE.MeshPhysicalMaterial).side=THREE.DoubleSide;
  // Each sculpted valance panel has a scalloped upper AND lower edge.
  const n=16,segments=24;
  const rail=mat('Rose metallic scalloped rail','#eeb0bf',.55,.22);
  const bulbPink=mat('Pink valance bulb','#fff2f8');bulbPink.emissive.set('#ff80c4');bulbPink.emissiveIntensity=2.4;
  const bulbBlue=mat('Blue valance bulb','#f2fcff');bulbBlue.emissive.set('#86ceff');bulbBlue.emissiveIntensity=1.8;
  const flower=new THREE.Shape();
  flower.moveTo(0,-.16);flower.bezierCurveTo(-.02,-.08,-.03,-.02,-.075,.025);
  flower.bezierCurveTo(-.16,.09,-.17,-.04,-.10,-.065);
  flower.bezierCurveTo(-.20,-.10,-.23,.07,-.13,.11);
  flower.bezierCurveTo(-.06,.14,-.045,.04,-.025,.025);
  flower.bezierCurveTo(-.085,.13,-.03,.18,0,.23);
  flower.bezierCurveTo(.03,.18,.085,.13,.025,.025);
  flower.bezierCurveTo(.045,.04,.06,.14,.13,.11);
  flower.bezierCurveTo(.23,.07,.20,-.10,.10,-.065);
  flower.bezierCurveTo(.17,-.04,.16,.09,.075,.025);
  flower.bezierCurveTo(.03,-.02,.02,-.08,0,-.16);
  const flowerGeometry=new THREE.ExtrudeGeometry(flower,{depth:.012,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,steps:1,curveSegments:12});
  for(let k=0;k<n;k++){
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
    for(let j=0;j<=segments;j++){
      const t=j/segments,a=(k+t)*Math.PI*2/n,wave=Math.sin(t*Math.PI);
      for(let edge=0;edge<2;edge++){
        const y=edge===0?5.16+.15*wave:4.83-.15*wave;
        const p=polar(a,2.045,y);positions.push(p.x,p.y,p.z);
        // Sample only the clean atlas regions, outside its generated margins.
        uvs.push((k%8+t)/8,edge===0?.285:.115);
      }
      if(j<segments){const p=j*2;indices.push(p,p+1,p+2,p+1,p+3,p+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
    const fasciaMat=white.clone();fasciaMat.side=THREE.DoubleSide;
    mesh(canopy,g,fasciaMat,'Scalloped fleur de lis panel');
    const mid=(k+.5)*Math.PI*2/n;
    const relief=mesh(canopy,flowerGeometry,blue,'Undistorted raised fleur de lis');relief.position.copy(polar(mid,2.063,4.94));relief.rotation.y=mid;relief.scale.set(.78,.88,1);
    const bud=sphere(canopy,.035,polar(mid,2.094,5.08),pink,'Pink fleur bud');bud.scale.set(.72,1.55,.6);
    for(const edge of [0,1]){
      const pts=[];
      for(let j=0;j<=segments;j++){const t=j/segments;pts.push(polar((k+t)*Math.PI*2/n,2.055,edge===0?5.16+.15*Math.sin(t*Math.PI):4.83-.15*Math.sin(t*Math.PI)));}
      tube(canopy,pts,.027,rail,'Rose metal scalloped piping');
      for(const t of [.22,.5,.78]){
        const a=(k+t)*Math.PI*2/n,y=edge===0?5.16+.15*Math.sin(t*Math.PI):4.83-.15*Math.sin(t*Math.PI);
        sphere(canopy,.028,polar(a,2.078,y),white,'Small rail pearl');
      }
      for(const t of [.10,.36,.64,.90]){
        const a=(k+t)*Math.PI*2/n,y=edge===0?5.16+.15*Math.sin(t*Math.PI):4.83-.15*Math.sin(t*Math.PI);
        sphere(part('lights'),.023,polar(a,2.083,y),k%2?bulbBlue:bulbPink,'Valance colored bulb');
      }
    }
    const a=k*Math.PI*2/n;
    sphere(canopy,.048,polar(a,2.055,5.16),white,'Ivory seam pearl');
    sphere(canopy,.035,polar(a,2.055,4.83),white,'Ivory hem pearl');
    const charm=mesh(canopy,new THREE.OctahedronGeometry(.065),gold,'Champagne diamond');
    charm.position.copy(polar(a,2.073,4.99));charm.scale.set(.55,1.4,.4);
    tube(canopy,[polar(a,2.073,5.13),polar(a,2.073,5.06)],.008,gold,'Diamond connector');
  }
  torus(canopy,.14,6.18,.032,gold,'Finial collar');
  sphere(canopy,.13,new THREE.Vector3(0,6.34,0),pink,'Pink finial');
  mesh(canopy,new THREE.CylinderGeometry(.018,.018,.58,16),gold,'Flag pole',6.65);
  sphere(canopy,.061,new THREE.Vector3(0,6.96,0),gold,'Flag pearl');
  const flag=new THREE.PlaneGeometry(.60,.28,24,12);const p=flag.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i)+.30;p.setXYZ(i,x,p.getY(i)+6.73,.06*Math.sin(x*12)*(x/.6));}
  flag.computeVertexNormals();const flagMat=pink.clone();flagMat.side=THREE.DoubleSide;
  mesh(canopy,flag,flagMat,'Waving rose flag');
  // Attach each photo string below its local scalloped hem; preserve photo heights.
  for (const mobile of part('frames').children) {
    if (!mobile.name.startsWith('photo-mobile-')) continue;
    const a=(Math.atan2(mobile.position.x,mobile.position.z)+Math.PI*2)%(Math.PI*2);
    const t=(a/(Math.PI*2)*16)%1;
    const top=4.83-.15*Math.sin(t*Math.PI)-.027-mobile.position.y;
    const rope=mobile.children.find(o=>o instanceof THREE.Mesh && o.geometry instanceof THREE.CylinderGeometry) as THREE.Mesh<THREE.CylinderGeometry>|undefined;
    if (rope) {
      const oldLength=rope.geometry.parameters.height,bottom=-oldLength;
      rope.geometry.dispose();
      rope.geometry=new THREE.CylinderGeometry(.008,.008,top-bottom,6);
      rope.position.y=(top+bottom)/2;
    }
    const beads=mobile.children.filter(o=>o instanceof THREE.Mesh && o.geometry instanceof THREE.IcosahedronGeometry && o.position.y>-.62).sort((a,b)=>b.position.y-a.position.y);
    beads.forEach((bead,i)=>{bead.position.y=top-.11-i*.16;});
  }
  // Keep rods, hanging lines and photo shapes; recolor their original materials.
  for(const id of ['rods','frames','lights']){
    let idx=0;
    part(id).traverse(node=>{
      if(!(node instanceof THREE.Mesh))return;
      if(node.name.startsWith('Valance colored bulb'))return;
      const old=Array.isArray(node.material)?node.material[0]:node.material;
      const m=old.clone() as THREE.MeshStandardMaterial;
      if(id==='rods'){m.color.set('#dbb18b');m.metalness=.55;m.roughness=.28;}
      else if(id==='lights'){m.color.set('#ffe8ec');m.emissive?.set('#ffd4e8');m.emissiveIntensity=.12;}
      else if(m.map){
        // Original photo layout is preserved; blank memory windows gain pastel paper.
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;
        const c=canvas.getContext('2d')!;c.fillStyle='#fffafa';c.fillRect(0,0,256,320);
        c.fillStyle=idx++%2?'#e7c4d9':'#bed9ed';c.fillRect(18,15,220,260);
        m.map=new THREE.CanvasTexture(canvas);m.map.colorSpace=THREE.SRGBColorSpace;m.color.set('#ffffff');
      }else{const hsl={h:0,s:0,l:0};m.color.getHSL(hsl);m.color.set(hsl.s<.13||hsl.l>.78?'#fff9fa':idx++%2?'#efa5c4':'#a7cdec');}
      node.material=m;
    });
  }
  part('horses').traverse(node=>{
    if(!(node instanceof THREE.Mesh))return;
    const m=node.material as THREE.MeshStandardMaterial;
    if(m.name==='Blue pink saddlecloth'){
      const pos=node.geometry.attributes.position,uv=[];
      for(let i=0;i<pos.count;i++)uv.push(.5+(pos.getX(i)-.01)/.48,.5+(pos.getY(i)-.07)/.36);
      node.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));m.map=saddleMap;m.roughness=.3;
    }
  });
  root.userData.revision='Lucas detailed valance and sculpted horses v003';
}

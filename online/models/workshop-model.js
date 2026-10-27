import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const mats=new Map();
function material(color,metalness=0,roughness=.55,emissive=0){const key=[color,metalness,roughness,emissive].join();if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:emissive?.45:0}));return mats.get(key);}
function mesh(group,geometry,color,position=[0,0,0],metal=0,rough=.55){const m=new T.Mesh(geometry,material(color,metal,rough));m.position.set(...position);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function box(g,size,color,pos,r=.025,metal=0,rough=.55){return mesh(g,(r<.025?new T.BoxGeometry(...size):new RoundedBoxGeometry(...size,1,Math.min(r,...size.map(x=>x/3)))),color,pos,metal,rough);}
function cylinder(g,r1,r2,h,color,pos,segments=24){return mesh(g,new T.CylinderGeometry(r1,r2,h,segments),color,pos);}
function sphere(g,r,color,pos,scale=[1,1,1]){const m=mesh(g,new T.SphereGeometry(r,12,8),color,pos);m.scale.set(...scale);return m;}
export function compact(group){group.updateMatrixWorld(true);const byMaterial=new Map();for(const child of [...group.children]){if(!child.isMesh)continue;const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geometry.applyMatrix4(child.matrix);geometry.deleteAttribute('uv');geometry.deleteAttribute('tangent');const key=child.material.uuid;if(!byMaterial.has(key))byMaterial.set(key,{mat:child.material,geometries:[]});byMaterial.get(key).geometries.push(geometry);group.remove(child);}for(const {mat,geometries}of byMaterial.values()){const geometry=mergeVertices(mergeGeometries(geometries,false),.00001),m=new T.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;geometry.normalizeNormals();group.add(m);for(const geo of geometries)geo.dispose();}return group;}
export const POSITIONS=Array.from({length:16},(_,i)=>[(i%4-1.5)*2.35,0,-2.65+Math.floor(i/4)*1.8]);
export function createPrinter(){
 const root=new T.Group();root.name='PrintLabPrinter';const fixed=new T.Group();fixed.name='PrinterStructure';root.add(fixed);
 box(fixed,[1.12,.1,1.06],0xba8c63,[0,.83,0],.035);box(fixed,[1.16,.035,1.1],0xd5ad82,[0,.892,0],.025);
 for(const x of [-.46,.46])for(const z of [-.43,.43]){box(fixed,[.065,.78,.065],0x343e4e,[x,.39,z],.012,.65);box(fixed,[.09,.035,.09],0x192534,[x,.035,z],.008);}
 box(fixed,[.86,.13,.78],0x283547,[0,.99,0],.045,.45);box(fixed,[.78,.025,.67],0x394a5b,[0,1.065,0],.015,.65);
 for(const x of [-.37,.37])for(const z of [-.3,.3])box(fixed,[.055,1.04,.055],z>0?0xd8dfe2:0x64788c,[x,1.55,z],.015,.62,.3);
 for(const z of [-.3,.3])box(fixed,[.8,.075,.09],0xd2dde3,[0,2.09,z],.023,.52,.3);
 for(const x of [-.37,.37])box(fixed,[.08,.075,.68],0xc5d3dc,[x,2.09,0],.022,.55,.3);
 box(fixed,[.7,.055,.58],0x576574,[0,1.145,0],.012,.65);box(fixed,[.64,.02,.53],0x29434c,[0,1.185,0],.008,.3);
 for(const x of [-.22,.22]){cylinder(fixed,.012,.012,.9,0xb5c4ce,[x,1.56,-.23]);}
 for(let i=0;i<7;i++)box(fixed,[.008,.025,.25],0x152330,[.435,1.35+i*.045,0],.002);
 const display=box(fixed,[.24,.105,.025],0x111c2b,[.13,.99,.4],.015);display.rotation.x=-.12;
 const screen=box(fixed,[.17,.054,.012],0x99e9d0,[.11,1.005,.418],.008);screen.material=material(0x99e9d0,.15,.25,0x44a899);
 cylinder(fixed,.029,.029,.018,0x8c9caa,[.31,.99,.42]).rotation.x=Math.PI/2;
 box(fixed,[.18,.008,.025],0x83dabd,[-.19,1.071,.35],.003);
 const spool=new T.Group();spool.name='FilamentSpool';spool.position.set(-.53,1.84,-.04);spool.rotation.z=Math.PI/2;root.add(spool);
 cylinder(spool,.205,.205,.08,0xa6dc8d,[0,0,0],32);for(const y of [-.053,.053])cylinder(spool,.222,.222,.018,0x26394a,[0,y,0],32);cylinder(spool,.07,.07,.135,0x94a6b4,[0,0,0],24);compact(spool);
 const filament=new T.CatmullRomCurve3([new T.Vector3(-.51,2.03,-.04),new T.Vector3(-.38,2.22,.02),new T.Vector3(-.07,2.2,0),new T.Vector3(.06,1.69,0)]);mesh(fixed,new T.TubeGeometry(filament,16,.007,6,false),0xaedc8a);
 const gantry=new T.Group();gantry.name='Gantry';gantry.position.y=1.65;root.add(gantry);box(gantry,[.69,.035,.035],0xa7b6c5,[0,0,0],.006,.8,.3);box(gantry,[.68,.028,.028],0x1c2b3c,[0,.05,-.04],.004,.4);
 const head=new T.Group();head.name='NozzleHead';gantry.add(head);box(head,[.14,.13,.115],0xc5ea9c,[0,-.035,.035],.017);box(head,[.1,.045,.085],0x3d4b5a,[0,-.119,.035],.007,.4);cylinder(head,.025,.006,.064,0xcfa86b,[0,-.17,.035],16);
 const print=new T.Group();print.name='PrintedObject';print.position.set(0,1.2,.015);root.add(print);
 compact(fixed);return root;
}
export function createPrint(index){const g=new T.Group();g.name='print_'+index;
 if(index===0){const shape=new T.Shape();shape.moveTo(-.48,-.2);shape.lineTo(.36,-.2);shape.lineTo(.55,.08);shape.lineTo(.25,.23);shape.lineTo(-.43,.23);shape.closePath();const hull=mesh(g,new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1}),0x77bdce,[0,.22,-.16]);hull.rotation.x=Math.PI/2;hull.rotation.x=0;box(g,[.4,.34,.31],0xf3d6a2,[-.04,.53,0],.025);box(g,[.5,.055,.41],0xe89e8e,[-.04,.73,0],.02);cylinder(g,.045,.045,.2,0xe0b190,[.06,.85,0],16);box(g,[.19,.17,.014],0x315568,[-.04,.56,.165],.018);}
 if(index===1){cylinder(g,.21,.16,.3,0xc48769,[0,.15,0]);cylinder(g,.225,.225,.07,0xdbab86,[0,.3,0]);cylinder(g,.19,.19,.02,0x4c4341,[0,.34,0]);cylinder(g,.095,.1,.65,0x7aa978,[0,.64,0]);sphere(g,.095,0x86b680,[0,.96,0]);for(const [x,y,sign]of [[-.2,.62,-1],[.2,.76,1]]){cylinder(g,.055,.055,.23,0x78a97c,[x/2,y,0],16).rotation.z=Math.PI/2;cylinder(g,.055,.055,.18,0x7eaf7f,[x,y+.08,0],16);sphere(g,.055,0x8ebf8b,[x,y+.17,0]);}}
 if(index===2){cylinder(g,.15,.15,.67,0xe5e8e9,[0,.5,0],28);cylinder(g,0,.15,.27,0xd39493,[0,.97,0],28);cylinder(g,.16,.16,.09,0x91a1b4,[0,.18,0],24);const window=cylinder(g,.07,.07,.025,0x7bc6db,[0,.62,.15],24);window.rotation.x=Math.PI/2;for(let j=0;j<3;j++){const f=box(g,[.045,.3,.16],0xb19fd1,[0,.25,.16],.009);f.position.applyAxisAngle(new T.Vector3(0,1,0),j*Math.PI*2/3);f.rotation.y=j*Math.PI*2/3;}}
 if(index===3){sphere(g,.24,0xb19bcf,[0,.29,0],[1,.8,1.2]);sphere(g,.18,0xc0a7dc,[.1,.6,.1],[1,.85,1.15]);sphere(g,.12,0xcfb7e8,[.1,.56,.26],[1,.65,1]);for(const x of [-.13,.13]){box(g,[.1,.15,.2],0xa08bbe,[x,.09,.14],.04);sphere(g,.027,0x2a394e,[x*.5+.1,.65,.24]);}for(const sign of [-1,1]){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(sign*.43,.25);shape.lineTo(sign*.37,-.15);shape.lineTo(0,-.08);shape.closePath();const wing=mesh(g,new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false}),0xcea8df,[sign*.1,.45,-.08]);wing.rotation.y=sign*.3;}const tail=mesh(g,new T.ConeGeometry(.105,.45,16),0xab91c7,[0,.17,-.37]);tail.rotation.x=-1.2;}
 if(index===4){box(g,[.38,.32,.29],0xe9c987,[0,.7,0],.065);box(g,[.3,.21,.018],0x263b4c,[0,.71,.153],.04);for(const x of [-.075,.075])sphere(g,.027,0x94e8d0,[x,.73,.175]);box(g,[.3,.32,.24],0x90b7c8,[0,.36,0],.05);box(g,[.07,.07,.015],0xe8acac,[0,.38,.128],.02);for(const sign of [-1,1]){box(g,[.1,.28,.12],0xb0c9d3,[sign*.23,.38,0],.035);box(g,[.12,.13,.24],0x9b8bb5,[sign*.09,.1,.025],.035);}cylinder(g,.018,.018,.08,0x7e91a4,[0,.92,0],12);sphere(g,.035,0xb8e59a,[0,.98,0]);}
 if(index===5){box(g,[.65,.37,.47],0xd7c5d2,[0,.2,0],.025);for(const x of [-.36,.36]){cylinder(g,.12,.13,.73,0xdccdd9,[x,.4,0]);cylinder(g,0,.17,.26,0xa18bc2,[x,.9,0]);box(g,[.05,.11,.012],0x667e99,[x,.57,.122],.02);}box(g,[.13,.21,.02],0x796d91,[0,.13,.24],.04);for(let j=0;j<5;j++)box(g,[.07,.08,.08],0xe4d7e0,[-.27+j*.135,.43,.2],.006);}
 if(index===6){box(g,[.29,.32,.29],0xd6bd81,[0,.47,0],.025,.65);for(const sign of [-1,1]){box(g,[.45,.025,.58],0x567cad,[sign*.41,.47,0],.008,.35);for(let x=0;x<4;x++)box(g,[.006,.006,.57],0xb4c8dd,[sign*.41-.19+x*.125,.488,0],.001);for(let z=0;z<5;z++)box(g,[.44,.006,.006],0xb4c8dd,[sign*.41,.488,-.26+z*.13],.001);}cylinder(g,.012,.012,.35,0xbcc6d3,[0,.79,0],12);const dish=mesh(g,new T.SphereGeometry(.18,20,10,0,Math.PI*2,0,Math.PI*.4),0xcbd6df,[0,.84,0]);dish.rotation.z=.4;}
 if(index===7){for(const [x,z,h,color,angle]of [[0,0,1,0x9fd9de,.07],[-.25,.05,.65,0xb09bdb,-.25],[.23,.08,.77,0x99bddf,.28]]){const vertices=[],r=.16;const rings=[[0,r*.5],[.15,r],[h*.72,r],[h,0]];for(let layer=0;layer<3;layer++)for(let j=0;j<6;j++){const a=j*Math.PI/3,b=(j+1)*Math.PI/3;const p=(l,t)=>[Math.cos(t)*rings[l][1],rings[l][0],Math.sin(t)*rings[l][1]];vertices.push(...p(layer,a),...p(layer,b),...p(layer+1,a));if(rings[layer+1][1]>0)vertices.push(...p(layer+1,a),...p(layer,b),...p(layer+1,b));}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const m=mesh(g,geo,color,[x,0,z],.25,.22);m.rotation.z=-angle;}}
 compact(g);g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g);for(const m of g.children)m.position.y-=bounds.min.y;return g;}
function plant(g,x,z){cylinder(g,.22,.17,.42,0xc9a88e,[x,.21,z]);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const leaf=sphere(g,.22,j%2?0x7d9f77:0x8daf80,[x+Math.sin(a)*.16,.65+j*.045,z+Math.cos(a)*.16],[.35,1.55,.8]);leaf.rotation.z=-Math.sin(a)*.5;}}
export function createRoom(){const g=new T.Group();g.name='PrintLabWorkshop';
 box(g,[12.3,.38,10.3],0x35475d,[0,-.23,0],.12);box(g,[12,.1,10],0x9aa9b4,[0,-.015,0],.02);for(let x=-5;x<=5;x++)box(g,[.012,.002,10],0x788b9c,[x,.037,0],.001);for(let z=-4;z<=4;z++)box(g,[12,.002,.012],0x788b9c,[0,.038,z],.001);
 box(g,[12.2,4.2,.18],0xc6c5cf,[0,2.05,-5],.03);box(g,[.18,4.2,10.1],0xb1b7c8,[-6,2.05,0],.03);box(g,[.18,1.15,10.1],0xadb7c8,[6,.52,0],.025);
 box(g,[12,.12,.075],0x8a9bad,[0,.12,-4.87],.012);box(g,[.075,.12,10],0x8a9bad,[-5.87,.12,0],.012);box(g,[.075,.12,10],0x8a9bad,[5.87,.12,0],.012);
 for(const x of [-3.8,3.8]){box(g,[2.35,1.55,.12],0xf5e7d5,[x,2.65,-4.83],.07);box(g,[2.12,1.31,.035],0xb9dfe3,[x,2.65,-4.75],.045);box(g,[.055,1.35,.065],0xf5e7d5,[x,2.65,-4.71],.01);box(g,[2.2,.055,.065],0xf5e7d5,[x,2.65,-4.71],.01);box(g,[2.6,.09,.4],0xc8aa88,[x,1.84,-4.64],.025);}
 box(g,[2.5,1.05,.14],0xe8d7bf,[0,3.08,-4.82],.055);box(g,[2.29,.87,.04],0x283449,[0,3.08,-4.72],.018);
 box(g,[5.5,.06,.07],0x596b7a,[0,4.19,-2.2],.01,.6);for(const x of [-2.4,2.4]){box(g,[.02,.37,.02],0x596b7a,[x,4,-2.2],.005,.6);box(g,[.05,.06,2.8],0x596b7a,[x,4.19,-3.6],.01,.6);box(g,[.7,.07,.7],0x495968,[x,3.82,-2.2],.04,.6);box(g,[.61,.02,.61],0xffedcb,[x,3.77,-2.2],.025);}
 box(g,[1.3,.86,.65],0x698095,[-5.21,.47,-3.9],.04);box(g,[1.4,.075,.75],0xd2ad85,[-5.21,.94,-3.9],.025);for(let j=0;j<3;j++)box(g,[.57,.025,.012],0x334657,[-5.18,.3+j*.2,-3.57],.003);
 const shelf=new T.Group();box(shelf,[.43,.08,2.5],0xc19975,[0,0,0],.018);for(let j=0;j<4;j++){box(shelf,[.25,.3,.36],j%2?0xb6a8cc:0xaac3b9,[0,.2,-.9+j*.6],.018);box(shelf,[.25,.025,.36],0xe8d3b5,[0,.37,-.9+j*.6],.005);}shelf.position.set(-5.74,2.5,-.7);g.add(shelf);plant(g,-5.2,3.9);plant(g,5.1,-3.8);
 box(g,[1.7,.24,.9],0x7c8a9d,[4.6,.24,3.75],.1);box(g,[1.7,.28,.25],0x8c9aab,[4.6,.44,4.04],.07);for(const x of [4,5.2])box(g,[.25,.4,.87],0x8a9aac,[x,.37,3.75],.07);
 box(g,[1.1,.02,1.1],0x5e7d82,[-4.6,.05,2.6],.06);box(g,[.8,.55,.64],0xc4a17d,[-4.6,.34,2.6],.025);box(g,[.83,.03,.67],0xe0c5a0,[-4.6,.63,2.6],.008);box(g,[.12,.58,.02],0xb38c67,[-4.6,.35,2.93],.003);
 compact(g);return g;}

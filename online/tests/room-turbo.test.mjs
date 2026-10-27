import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newState,act,advance} from '../worker/engine.js';
import {ROOM_TEXT} from '../web/room-text.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
test('turbo doubles work for exactly 10 seconds and locks for 45 seconds',()=>{
 const now=1793140000000,s=newState(now);s.auto=true;act(s,'startAll',{},now);act(s,'turbo',{},now+1000);assert.equal(s.turboUntil,now+11000);assert.equal(s.coolUntil,now+46000);
 advance(s,now+6000);assert.equal(s.printed,1);advance(s,now+11000);assert.equal(s.printed,2);advance(s,now+20000);assert.equal(s.printed,3);
 const restored=JSON.parse(JSON.stringify(s));assert.throws(()=>act(restored,'turbo',{},now+45000),/cooldown/);act(restored,'turbo',{},now+46000);assert.equal(restored.coolUntil,now+91000);
});
test('boost handles manual printing, printers started mid-boost and legacy saves',()=>{
 const now=1793140000000,s=newState(now);delete s.turboUntil;act(s,'startAll',{},now);act(s,'turbo',{},now+1000);s.printers.push({level:1,model:0,material:0,end:0});act(s,'start',{index:1},now+6000);assert.equal(s.printed,1);advance(s,now+10000);assert.equal(s.printed,2);advance(s,now+60000);assert.equal(s.printed,2);
});
test('prestige does not bypass the longer cooldown and offline catch-up does not extend turbo',()=>{
 const now=1793140000000,s=newState(now);s.auto=true;act(s,'startAll',{},now);act(s,'turbo',{},now+1000);advance(s,now+86400000);assert.equal(s.printed,900);s.stage=5;s.cash=200000;s.coolUntil=now+86430000;act(s,'prestige',{},now+86401000);assert.equal(s.coolUntil,now+86430000);assert.equal(s.turboUntil,0);
});
test('all real GLB files parse with meshes, PBR materials and expected object names',async()=>{
 const loader=new GLTFLoader();for(const file of ['room','printer','prints','workshop']){const buffer=fs.readFileSync('web/assets/'+file+'.glb');assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(4),2);const gltf=await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');let meshes=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.getAttribute('position').count>0);assert.ok(o.material.isMeshStandardMaterial);}});assert.ok(meshes>3,file+' has real meshes');if(file==='printer'){for(const name of ['NozzleHead','Gantry','PrintedObject','FilamentSpool'])assert.ok(gltf.scene.getObjectByName(name),name);}if(file==='prints')for(let i=0;i<8;i++)assert.ok(gltf.scene.getObjectByName('print_'+i));}
});
test('3D interaction and turbo controls have complete translations in ten languages',()=>{const keys=Object.keys(ROOM_TEXT.en);assert.equal(Object.keys(ROOM_TEXT).length,10);for(const dict of Object.values(ROOM_TEXT)){assert.deepEqual(Object.keys(dict),keys);assert.ok(Object.values(dict).every(v=>v.trim().length));}});

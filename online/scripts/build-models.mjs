import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createRoom,createPrinter,createPrint,POSITIONS} from '../models/workshop-model.js';
// GLTFExporter uses the browser FileReader contract for its binary buffers.
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(r=>{this.result='data:'+blob.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
fs.mkdirSync('web/assets',{recursive:true});const exporter=new GLTFExporter();
async function save(name,object){const bytes=await exporter.parseAsync(object,{binary:true,trs:true,onlyVisible:true});fs.writeFileSync('web/assets/'+name,Buffer.from(bytes));console.log(name,bytes.byteLength+' bytes');}
const room=createRoom(),printer=createPrinter(),prints=new T.Group();prints.name='PrintableCollection';for(let i=0;i<8;i++)prints.add(createPrint(i));
await save('room.glb',room);await save('printer.glb',printer);await save('prints.glb',prints);
const workshop=new T.Scene();workshop.name='PrintLab_ModelledWorkshop';workshop.add(room.clone(true));for(let i=0;i<2;i++){const p=printer.clone(true);p.position.set(...POSITIONS[i+1]);const m=createPrint(i);m.scale.setScalar(.42);p.getObjectByName('PrintedObject').add(m);workshop.add(p);}const assistant=createPrint(4);assistant.name='AssistantBot';assistant.scale.setScalar(.85);assistant.position.set(0,.05,3.9);workshop.add(assistant);const sun=new T.DirectionalLight(0xffedce,4);sun.position.set(-3,7,5);sun.name='WarmKey';sun.lookAt(0,0,0);sun.target.position.set(0,0,-1);sun.add(sun.target);workshop.add(sun);const fill=new T.DirectionalLight(0xc3d7ff,2);fill.position.set(5,5,-2);fill.lookAt(0,0,0);fill.target.position.set(0,0,-1);fill.add(fill.target);workshop.add(fill);const cam=new T.PerspectiveCamera(42,1.7,.1,100);cam.position.set(13,11,16);cam.lookAt(0,1,0);cam.name='WorkshopCamera';workshop.add(cam);await save('workshop.glb',workshop);
fs.writeFileSync('web/assets/model-manifest.json',JSON.stringify({format:'glTF 2.0 binary',author:'PRINT LAB',models:['room.glb','printer.glb','prints.glb','workshop.glb'],printerSlots:16,printableModels:8,source:'models/workshop-model.js'},null,2));

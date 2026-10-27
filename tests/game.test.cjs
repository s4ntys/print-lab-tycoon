const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map(),listeners=[];
function node(){return {textContent:'',innerHTML:'',dataset:{},querySelector(){return null;},style:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect(){return {left:0,top:0,width:100};},append(){},remove(){},showModal(){},close(){}};}
const document={hidden:false,body:node(),querySelector(s){if(!elements.has(s))elements.set(s,node());return elements.get(s);},querySelectorAll(){return [];},createElement:node,addEventListener(type,fn){if(type==='click')listeners.push(fn);}};
let cookie='';Object.defineProperty(document,'cookie',{get(){return cookie;},set(s){cookie=s.split(';')[0];}});
const context=vm.createContext({document,console,Date,Intl,URL,Blob,innerWidth:1200,innerHeight:900,window:{addEventListener(){}},location:{pathname:'/print-lab-tycoon/',protocol:'https:'},setTimeout(){return 1;},clearTimeout(){},setInterval(){},confirm(){return true;}});
const run=s=>vm.runInContext(s,context);
vm.runInContext(readFileSync('game.js','utf8'),context);
// Simulate a pre-expansion save before loading the new game features.
run('delete state.claimed; delete state.daily; delete state.sound;');
vm.runInContext(readFileSync('play.js','utf8'),context);
function click(id,dataset={}){const button={id,dataset,disabled:false,hasAttribute(k){return Object.hasOwn(dataset,k.replace('data-',''));},getBoundingClientRect(){return {left:0,top:0,width:100};},classList:{remove(){},add(){}},offsetWidth:100};listeners.forEach(fn=>fn({target:{closest(){return button;}}}));}
assert.equal(run('Array.isArray(state.claimed)&&state.daily===\'\'&&state.sound===false'),true,'legacy save migration');
click('daily');assert.equal(run('state.money'),220);click('daily');assert.equal(run('state.money'),220,'daily reward only once');
run('state.printed=5');click('',{goal:'0'});assert.equal(run('state.money'),300);click('',{goal:'0'});assert.equal(run('state.money'),300,'milestone only once');
run('state.printers[0].end=Date.now()+8000; beforeTurbo=state.printers[0].end');click('turbo');assert.equal(run('beforeTurbo-state.printers[0].end'),800,'turbo speeds up production');
click('turbo');assert.equal(run('heat'),18,'rapid duplicate turbo ignored');
run('lastTap=0;heat=90');click('turbo');assert.equal(run('overheatUntil>Date.now()'),true,'turbo overheats');
run('state.stock=[2,0,0,0];state.stockCredits=[36,0,0,0];event={type:"market",end:Date.now()+10000};beforeSale=state.money');elements.get('#sell').onclick();assert.equal(run('state.money-beforeSale'),54,'market event adds 50 percent');
run('event={type:"gift",end:Date.now()+10000};beforeGift=state.money');click('eventGift');click('eventGift');assert.equal(run('state.money-beforeGift'),75,'gift claimed once');
run('state=fresh();state.auto=true;state.saved=Date.now()-86400000;state.printers[0].end=state.saved+8000;offline()');assert.ok(run('state.printed>=899&&state.printed<=901'),'offline production limited to two hours');
run('state=fresh();state.printers=Array.from({length:6},()=>({level:10,model:3,end:Date.now()+1000}));state.unlocked=[true,true,true,true];state.claimed=[0,1,2,3,4];save()');assert.ok(cookie.length<3800,'full save fits cookie');
assert.equal(run('valid({...state,money:-1})'),false,'invalid save rejected');
console.log('PASS: legacy saves, daily reward, milestones, turbo, overheating, market bonus, gifts, offline cap, cookie size, validation');

vm.runInContext(readFileSync('visitors.js','utf8'),context);
run('state=fresh();delete state.stockCredits;state.stock=[3,0,0,0];normalizeInventory()');assert.equal(run('stockValue()'),54,'legacy stock keeps value');
run('state=fresh();state.printers[0].material=1;complete(state.printers[0])');assert.equal(run('stockValue()'),14,'draft material sells for less');assert.equal(run('duration(state.printers[0])'),5200,'draft material prints faster');
run('state=fresh();state.room=1;state.printers[0].material=2;complete(state.printers[0])');assert.equal(run('stockValue()'),32,'silk premium pricing');assert.equal(run('Math.round(duration(state.printers[0]))'),11200,'silk prints slower');
run('state=fresh();state.customer={person:0,model:0,qty:2,reward:140,expires:Date.now()+90000,deadline:0}');click('acceptOrder');assert.ok(run('state.customer.deadline>Date.now()'),'accept starts deadline');
click('prepareOrder');assert.ok(run('state.printers[0].end>Date.now()'),'prepare launches idle printer');
run('state.stock=[1,0,0,0];state.stockCredits=[18,0,0,0]');click('deliverOrder');assert.equal(run('state.reputation'),0,'cannot deliver too few items');
run('state.stock=[3,0,0,0];state.stockCredits=[54,0,0,0];beforeDelivery=state.money');click('deliverOrder');assert.equal(run('state.stock[0]'),1,'delivery consumes exact quantity');assert.equal(run('stockValue()'),18,'remaining inventory keeps its value');assert.equal(run('state.money-beforeDelivery'),140);assert.equal(run('state.reputation'),1);click('deliverOrder');assert.equal(run('state.reputation'),1,'cannot deliver twice');
run('state.customer={person:0,model:0,qty:1,reward:100,expires:Date.now()+1000,deadline:Date.now()-1}');click('deliverOrder');assert.equal(run('state.reputation'),1,'expired delivery rejected');
run('state.money=3000;state.reputation=1');click('expandRoom');assert.equal(run('state.room'),0,'room requires reputation');run('state.reputation=2');click('expandRoom');assert.equal(run('state.room'),1);assert.equal(run('state.money'),2400);run('state.reputation=6');click('expandRoom');assert.equal(run('state.room'),2);assert.equal(run('state.money'),200);assert.equal(run('Math.round(duration({level:1,model:0}))'),6667,'top room speeds up production');
run('state.printers=Array.from({length:6},()=>({level:10,model:3,material:2,end:Date.now()+1000}));state.unlocked=[true,true,true,true];state.claimed=[0,1,2,3,4];state.customer={person:3,model:3,qty:8,reward:9000,expires:Date.now()+90000,deadline:Date.now()+180000};save()');assert.ok(cookie.length<3800,'expanded full save fits one cookie');
console.log('PASS: legacy inventory, material speed/value, customer acceptance, preparation, stock consumption, duplicate and expired delivery, room requirements and bonuses, expanded save size');

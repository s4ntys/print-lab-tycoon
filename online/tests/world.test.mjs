import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newState,act,advance,cycle,price} from '../worker/engine.js';
import {DICT,EXTRA,KEYS,COUNTRIES,languageFor} from '../web/i18n.js';
import worker from '../dist/server/index.js';
import {database} from '../scripts/local-db.mjs';
test('server engine: production, stock, deliveries, costs, stages and prestige',()=>{
 const start=1793140000000,s=newState(start);act(s,'startAll',{},start);advance(s,start+8000);assert.equal(s.printed,1);assert.equal(s.stock[0],1);act(s,'sell',{},start+9000);assert.equal(s.cash,168);assert.equal(s.earned,18);
 assert.throws(()=>act(s,'stage',{},start+10000),/locked/);s.rep=6;s.cash=3000;act(s,'stage',{},start+11000);act(s,'stage',{},start+12000);assert.equal(s.stage,2);assert.equal(s.cash,200);
 act(s,'configure',{index:0,model:0,material:2},start+13000);assert.ok(cycle(s,s.printers[0])>8000);assert.equal(price(s,s.printers[0]),32);
 s.contract={model:0,qty:2,reward:140,person:0,expires:start+140000,deadline:start+180000};s.stock[0]=3;s.stockValue[0]=96;act(s,'deliver',{},start+14000);assert.equal(s.stock[0],1);assert.equal(s.stockValue[0],32);assert.equal(s.rep,7);assert.throws(()=>act(s,'deliver',{},start+15000),/stock/);
 s.stage=5;s.cash=200000;s.active=30000;const earned=s.earned,printed=s.printed;act(s,'prestige',{},start+16000);assert.equal(s.prestige,1);assert.equal(s.earned,earned);assert.equal(s.printed,printed);assert.equal(s.stage,0);assert.equal(s.printers.length,1);assert.ok(cycle(s,s.printers[0])<8000);
});
test('server engine rejects forged money and caps offline time; UTC dailies reset',()=>{
 const now=1793140000000,s=newState(now);s.auto=true;act(s,'startAll',{},now);advance(s,now+86400000);assert.equal(s.printed,900);assert.equal(s.active,0);s.dailyPrinted=100;s.dailyClaimed=[0];advance(s,now+172800000);assert.equal(s.dailyClaimed.length,0);assert.equal(s.dailyPrinted,900);
 assert.throws(()=>act(s,'setMoney',{cash:1e15},now+172801000),/invalid/);
});
test('server clock: absent time excluded, turbo cooldown and reward replay blocked',()=>{
 const now=1793140000000,s=newState(now);act(s,'heartbeat',{},now+5000);assert.equal(s.active,5000);act(s,'heartbeat',{},now+60000);assert.equal(s.active,5000);act(s,'gift',{},now+61000);assert.throws(()=>act(s,'gift',{},now+62000),/claimed/);act(s,'startAll',{},now+63000);act(s,'turbo',{},now+63300);assert.throws(()=>act(s,'turbo',{},now+63400),/cooldown/);
});
test('all ten languages cover every UI key, all stages, models and errors',()=>{
 assert.equal(Object.keys(DICT).length,10);for(const [lang,dict]of Object.entries(DICT)){assert.deepEqual(Object.keys(dict),KEYS);for(const v of Object.values(dict))assert.ok(v.trim());assert.equal(EXTRA[lang].models.length,8);assert.equal(EXTRA[lang].stages.length,8);assert.equal(EXTRA[lang].errors.length,17);}assert.equal(COUNTRIES.length,249);assert.equal(languageFor('SK'),'sk');assert.equal(languageFor('JP'),'ja');assert.equal(languageFor('IN'),'en');
});
test('real SQLite API: protected identity, server authority, uniqueness, CSRF, recovery rotation and leaderboard',async()=>{
 const env={DB:database()},original=Date.now;let time=1793140000000;Date.now=()=>time;
 async function call(path,body,cookie='',origin='https://test.local'){const r=await worker.fetch(new Request('https://test.local/api/'+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json',Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return {status:r.status,body:await r.json(),cookie:r.headers.get('Set-Cookie')};}
 try{
 const a=await call('join',{name:'Player_A',country:'SK',language:'sk'});assert.equal(a.status,201);assert.match(a.cookie,/HttpOnly/);assert.match(a.cookie,/Secure/);assert.match(a.cookie,/SameSite=Strict/);assert.match(a.cookie,/__Host-pl_session=/);const cookie=a.cookie.split(';')[0];
 const duplicate=await call('join',{name:'player_a',country:'US',language:'en'});assert.equal(duplicate.body.error,'taken');
 const forged=await call('me',null,'__Host-pl_session='+'0'.repeat(64));assert.equal(forged.status,401);
 const csrf=await call('action',{action:'gift',revision:0},cookie,'https://evil.test');assert.equal(csrf.status,403);
 time+=1000;const sell=await call('action',{action:'sell',revision:0,payload:{id:'someone',cash:1e9,score:1e9}},cookie);assert.equal(sell.body.error,'stock');
 time+=1000;const gift=await call('action',{action:'gift',revision:0,payload:{score:1e9}},cookie);assert.equal(gift.body.state.earned,125);
 const conflict=await call('action',{action:'gift',revision:0},cookie);assert.equal(conflict.body.error,'conflict');
 time+=1000;const rename=await call('action',{action:'profile',revision:1,payload:{name:'Stolen_Name',country:'DE',language:'de'}},cookie);assert.equal(rename.body.error,'locked');
 time+=1000;const settings=await call('action',{action:'profile',revision:1,payload:{name:'Player_A',country:'JP',language:'ja'}},cookie);assert.equal(settings.status,200);assert.equal(settings.body.player.language,'ja');assert.equal(settings.body.player.country,'JP');
 time+=1000;const racing=await Promise.all([call('action',{action:'heartbeat',revision:2},cookie),call('action',{action:'heartbeat',revision:2},cookie)]);assert.equal(racing.filter(x=>x.status===200).length,1);assert.equal(racing.filter(x=>x.body.error==='conflict').length,1);
 const board=await call('board');assert.equal(board.body.rows[0].score,125);assert.equal(board.body.rows[0].name,'Player_A');assert.ok(!JSON.stringify(board.body).includes('token'));assert.ok(!JSON.stringify(board.body).includes(a.body.recovery));
 const restore=await call('recover',{code:a.body.recovery});assert.equal(restore.status,200);assert.notEqual(restore.body.recovery,a.body.recovery);assert.equal((await call('me',null,cookie)).status,401);assert.equal((await call('recover',{code:a.body.recovery})).status,401);assert.equal((await call('me',null,restore.cookie.split(';')[0])).status,200);
 }finally{Date.now=original;env.DB.raw.close();}
});

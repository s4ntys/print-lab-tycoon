import {MODELS,STAGES,MILESTONES,newState,advance,act,cycle,price,printerCost,levelCost,researchCost,capacity} from './engine.js';
import {ASSETS} from './assets.js';
const LANGUAGES=['en','sk','cs','de','es','fr','pt','pl','zh','ja'];
const COUNTRIES='AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://*.chatgpt.com https://chatgpt.com"};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...security,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}});
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
async function hash(t){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))),n=>n.toString(16).padStart(2,'0')).join('');}
function cookieName(url){return url.protocol==='https:'?'__Host-pl_session':'pl_session';}
function sessionCookie(token,url){return `${cookieName(url)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;}
function tokenFrom(req,url){const n=cookieName(url)+'=';return (req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(n))?.slice(n.length);}
function profile(b){const name=String(b.name||'').normalize('NFKC').trim();if(!/^[A-Za-z0-9_]{3,20}$/.test(name))throw Error('name');if(!COUNTRIES.includes(b.country)||!LANGUAGES.includes(b.language))throw Error('invalid');return {name,key:name.toLowerCase(),country:b.country,language:b.language};}
async function limited(db,req,type,max,window){const now=Date.now(),key=type+':'+Math.floor(now/window)+':'+await hash(req.headers.get('CF-Connecting-IP')||'local');const r=await db.prepare('INSERT INTO join_limits(bucket,count,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+window).first();return r.count<=max;}
function publicPlayer(p){return {id:p.id.slice(0,8),name:p.name,country:p.country,language:p.language};}
function snapshot(p,s,now){return {player:publicPlayer(p),state:s,revision:p.revision,now,models:MODELS,stages:STAGES,milestones:MILESTONES};}
async function persist(db,p,s,now,fields={}){const r=await db.prepare('UPDATE players SET state=?, revision=revision+1, score=?, active_ms=?, updated_at=?, name=?, name_key=?, country=?, language=? WHERE id=? AND revision=?').bind(JSON.stringify(s),Math.floor(s.earned),Math.floor(s.active),now,fields.name||p.name,fields.key||p.name_key,fields.country||p.country,fields.language||p.language,p.id,p.revision).run();return r.meta.changes===1;}
export default {async fetch(req,env){const url=new URL(req.url),path=url.pathname;try{
 if(!path.startsWith('/api/')){const asset=ASSETS[path==='/'?'/index.html':path];if(!asset)return new Response('404',{status:404,headers:security});return new Response(asset.body,{headers:{...security,'Content-Type':asset.type,'Cache-Control':path.endsWith('.html')?'no-cache':'public, max-age=300'}});}
 if(!env.DB)return json({error:'unavailable'},503);
 if(req.method==='POST'&&(req.headers.get('Origin')!==url.origin||!req.headers.get('Content-Type')?.startsWith('application/json')))return json({error:'origin'},403);
 if(req.method==='POST'&&Number(req.headers.get('Content-Length')||0)>4096)return json({error:'invalid'},413);
 const db=env.DB,now=Date.now();
 if(path==='/api/board'&&req.method==='GET'){
  const country=url.searchParams.get('country'),filter=COUNTRIES.includes(country)?country:null;
  const rows=filter?await db.prepare('SELECT id,name,country,score,active_ms,created_at,state FROM players WHERE country=? ORDER BY score DESC, created_at ASC LIMIT 50').bind(filter).all():await db.prepare('SELECT id,name,country,score,active_ms,created_at,state FROM players ORDER BY score DESC, created_at ASC LIMIT 50').all();
  return json({rows:rows.results.map((r,i)=>{const s=JSON.parse(r.state);return {rank:i+1,id:r.id.slice(0,8),name:r.name,country:r.country,score:r.score,active:r.active_ms,stage:s.stage,prestige:s.prestige};}),now});
 }
 let b={};if(req.method==='POST'){const raw=await req.text();if(raw.length>4096)return json({error:'invalid'},413);try{b=JSON.parse(raw);}catch{return json({error:'invalid'},400);}if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'invalid'},400);}
 const token=tokenFrom(req,url);let p=token&&/^[a-f0-9]{64}$/.test(token)?await db.prepare('SELECT * FROM players WHERE token_hash=?').bind(await hash(token)).first():null;
 if(path==='/api/join'&&req.method==='POST'){
  if(p)return json({error:'existing'},409);
  if(!await limited(db,req,'join',12,86400000))return json({error:'rate'},429);
  const f=profile(b),id=crypto.randomUUID(),t=secret(),recovery=secret(),s=newState(now);offerInitial(s,now);
  try{await db.prepare('INSERT INTO players(id,name,name_key,country,language,token_hash,recovery_hash,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,f.name,f.key,f.country,f.language,await hash(t),await hash(recovery),JSON.stringify(s),now,now).run();}catch(e){if(String(e).includes('UNIQUE'))return json({error:'taken'},409);throw e;}
  return json({...snapshot({id,name:f.name,country:f.country,language:f.language,revision:0},s,now),recovery},201,{'Set-Cookie':sessionCookie(t,url)});
 }
 if(path==='/api/recover'&&req.method==='POST'){
  if(!await limited(db,req,'recover',8,60000))return json({error:'rate'},429);
  if(typeof b.code!=='string'||!/^[a-f0-9]{64}$/.test(b.code))return json({error:'recovery'},401);
  const old=await db.prepare('SELECT * FROM players WHERE recovery_hash=?').bind(await hash(b.code)).first();if(!old)return json({error:'recovery'},401);
  const t=secret(),r=secret();const result=await db.prepare('UPDATE players SET token_hash=?,recovery_hash=?,revision=revision+1 WHERE id=? AND recovery_hash=?').bind(await hash(t),await hash(r),old.id,old.recovery_hash).run();if(result.meta.changes!==1)return json({error:'recovery'},401);old.revision++;
  return json({...snapshot(old,JSON.parse(old.state),now),recovery:r},200,{'Set-Cookie':sessionCookie(t,url)});
 }
 if(!p)return json({error:'auth'},401);
 if(path==='/api/me'&&req.method==='GET')return json(snapshot(p,JSON.parse(p.state),now));
 if(path==='/api/action'&&req.method==='POST'){
  if(b.revision!==p.revision)return json({error:'conflict'},409);
  const s=JSON.parse(p.state);if(now-(s.requestAt||0)<180)return json({error:'rate'},429);s.requestAt=now;
  let f={};if(b.action==='profile'){f=profile(b.payload||{});if(f.key!==p.name_key)throw Error('locked');advance(s,now,true);}else act(s,b.action,b.payload||{},now);
  try{if(!await persist(db,p,s,now,f))return json({error:'conflict'},409);}catch(e){if(String(e).includes('UNIQUE'))return json({error:'taken'},409);throw e;}
  p={...p,...(f.name?{name:f.name,name_key:f.key,country:f.country,language:f.language}:{}),revision:p.revision+1};return json(snapshot(p,s,now));
 }
 return json({error:'invalid'},404);
 }catch(e){const known=['name','invalid','funds','busy','locked','stock','cooldown','claimed'];return json({error:known.includes(e.message)?e.message:'server'},known.includes(e.message)?400:500);}}};
function offerInitial(s,now){s.contract={person:0,model:0,qty:2,reward:140,expires:now+120000,deadline:0};}

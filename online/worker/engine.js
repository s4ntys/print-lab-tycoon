export const MODELS=[{icon:'⛵',time:8000,value:18,cost:0},{icon:'🌵',time:14000,value:40,cost:300},{icon:'🚀',time:22000,value:80,cost:1200},{icon:'🐉',time:35000,value:155,cost:4000},{icon:'🤖',time:45000,value:280,cost:12000},{icon:'🏰',time:55000,value:490,cost:35000},{icon:'🛰️',time:65000,value:850,cost:100000},{icon:'💎',time:80000,value:1450,cost:280000}];
export const STAGES=[{cost:0,rep:0,capacity:2},{cost:600,rep:2,capacity:3},{cost:2200,rep:6,capacity:4},{cost:8000,rep:12,capacity:6},{cost:25000,rep:22,capacity:8},{cost:80000,rep:38,capacity:10},{cost:220000,rep:60,capacity:12},{cost:650000,rep:90,capacity:16}];
export const MILESTONES=[10,50,200,750,2500,10000];
export function newState(now){return {v:4,cash:150,earned:0,printed:0,sold:0,rep:0,stage:0,prestige:0,printers:[{level:1,model:0,material:0,end:0}],unlocked:[true,false,false,false,false,false,false,false],stock:Array(8).fill(0),stockValue:Array(8).fill(0),auto:false,research:[0,0,0,0],milestones:[],contract:null,contracts:0,day:new Date(now).toISOString().slice(0,10),dailyPrinted:0,dailyEarned:0,dailyContracts:0,dailyClaimed:[],giftDay:'',streak:0,last:now,presence:now,active:0,heat:0,lastTurbo:0,coolUntil:0};}
export function cycle(s,p){return Math.max(250,MODELS[p.model].time*[1,.65,1.4][p.material]/Math.pow(1.18,p.level-1)/(1+s.research[0]*.12)/(1+s.prestige*.12)/(1+s.stage*.04));}
export function price(s,p){return Math.round(MODELS[p.model].value*[1,.75,1.8][p.material]*(1+s.research[1]*.15)*(1+s.prestige*.1));}
export function capacity(s){return STAGES[s.stage].capacity;}
export function printerCost(s){return Math.round(160*Math.pow(1.62,s.printers.length-1));}
export function levelCost(p){return Math.round(75*Math.pow(1.55,p.level-1));}
export function researchCost(s,i){return Math.round([500,700,900,650][i]*Math.pow(1.9,s.research[i]));}
function addMoney(s,n){s.cash+=n;s.earned+=n;s.dailyEarned+=n;}
export function advance(s,now,active=false){
 const dt=Math.max(0,now-s.last),day=new Date(now).toISOString().slice(0,10);
 if(s.day!==day){s.day=day;s.dailyPrinted=0;s.dailyEarned=0;s.dailyContracts=0;s.dailyClaimed=[];}
 if(active){const gap=now-s.presence;if(gap>=0&&gap<=20000)s.active+=gap;s.presence=now;}
 s.heat=Math.max(0,s.heat-dt*.007);const cap=(2+s.research[2]*2)*3600000;
 for(const p of s.printers){if(!p.end)continue;if(dt>cap)p.end+=dt-cap;const time=cycle(s,p);if(p.end<=now){const n=s.auto?1+Math.floor((now-p.end)/time):1;s.stock[p.model]+=n;s.stockValue[p.model]+=n*price(s,p);s.printed+=n;s.dailyPrinted+=n;p.end=s.auto?p.end+n*time:0;}}
 if(s.contract&&now>(s.contract.deadline||s.contract.expires))s.contract=null;s.last=now;
}
export function offer(s,now,rand=Math.random){const models=s.unlocked.map((v,i)=>v?i:-1).filter(i=>i>=0),model=models[Math.floor(rand()*models.length)],qty=Math.min(6,2+Math.floor(s.stage/2));s.contract={person:Math.floor(rand()*4),model,qty,reward:Math.round((MODELS[model].value*qty*2.2+60)*(1+s.research[3]*.2)),expires:now+120000,deadline:0};}
function take(s,cost){if(s.cash<cost)throw Error('funds');s.cash-=cost;}
export function act(s,action,payload={},now=Date.now()){
 advance(s,now,true);const i=payload.index,p=Number.isInteger(i)?s.printers[i]:null;
 if(action==='heartbeat')return;
 if(action==='start'){if(!p)throw Error('invalid');if(!p.end)p.end=now+cycle(s,p);}
 else if(action==='startAll'){for(const x of s.printers)if(!x.end)x.end=now+cycle(s,x);}
 else if(action==='configure'){if(!p||p.end)throw Error('busy');const m=payload.model,t=payload.material;if(!Number.isInteger(m)||!s.unlocked[m]||!Number.isInteger(t)||t<0||t>2||(t===2&&s.stage<2))throw Error('locked');p.model=m;p.material=t;}
 else if(action==='upgrade'){if(!p||p.end)throw Error('busy');if(p.level>=Math.min(20,4+s.stage*2))throw Error('locked');take(s,levelCost(p));p.level++;}
 else if(action==='buy'){if(s.printers.length>=capacity(s))throw Error('locked');take(s,printerCost(s));s.printers.push({level:1,model:0,material:0,end:0});}
 else if(action==='unlock'){if(!Number.isInteger(i)||i<1||i>=MODELS.length||s.unlocked[i]||!s.unlocked[i-1])throw Error('locked');take(s,MODELS[i].cost);s.unlocked[i]=true;}
 else if(action==='sell'){const total=s.stockValue.reduce((a,b)=>a+b,0);if(!total)throw Error('stock');s.sold+=s.stock.reduce((a,b)=>a+b,0);addMoney(s,total);s.stock.fill(0);s.stockValue.fill(0);}
 else if(action==='auto'){if(s.auto)throw Error('invalid');take(s,650);s.auto=true;for(const x of s.printers)if(!x.end)x.end=now+cycle(s,x);}
 else if(action==='research'){if(!Number.isInteger(i)||i<0||i>3||s.research[i]>=10)throw Error('locked');const old=s.research[0];take(s,researchCost(s,i));s.research[i]++;if(i===0)for(const x of s.printers)if(x.end)x.end=now+(x.end-now)*(1+old*.12)/(1+s.research[0]*.12);}
 else if(action==='stage'){const next=STAGES[s.stage+1];if(!next||s.rep<next.rep)throw Error('locked');take(s,next.cost);s.stage++;}
 else if(action==='turbo'){if(now<s.coolUntil||now-s.lastTurbo<250||!s.printers.some(x=>x.end))throw Error('cooldown');s.lastTurbo=now;s.heat=Math.min(100,s.heat+18);for(const x of s.printers)if(x.end)x.end=Math.max(now+100,x.end-800);if(s.heat>=100)s.coolUntil=now+6500;}
 else if(action==='offer'){if(s.contract)throw Error('busy');offer(s,now);}
 else if(action==='accept'){if(!s.contract||s.contract.deadline)throw Error('invalid');s.contract.deadline=now+180000;}
 else if(action==='prepare'){const c=s.contract;if(!c||!c.deadline)throw Error('invalid');for(const x of s.printers)if(!x.end){x.model=c.model;x.end=now+cycle(s,x);}}
 else if(action==='deliver'){const c=s.contract;if(!c||!c.deadline||s.stock[c.model]<c.qty)throw Error('stock');s.stockValue[c.model]=Math.max(0,s.stockValue[c.model]-Math.round(s.stockValue[c.model]/s.stock[c.model]*c.qty));s.stock[c.model]-=c.qty;if(!s.stock[c.model])s.stockValue[c.model]=0;addMoney(s,c.reward);s.rep++;s.contracts++;s.dailyContracts++;s.contract=null;}
 else if(action==='milestone'){if(!Number.isInteger(i)||!MILESTONES[i]||s.printed<MILESTONES[i]||s.milestones.includes(i))throw Error('locked');s.milestones.push(i);addMoney(s,MILESTONES[i]*12);}
 else if(action==='daily'){const values=[s.dailyPrinted,s.dailyEarned,s.dailyContracts],goals=[25,1000,3];if(!Number.isInteger(i)||i<0||i>2||values[i]<goals[i]||s.dailyClaimed.includes(i))throw Error('locked');s.dailyClaimed.push(i);addMoney(s,[200,400,600][i]);}
 else if(action==='gift'){if(s.giftDay===s.day)throw Error('claimed');const yesterday=new Date(now-86400000).toISOString().slice(0,10);s.streak=s.giftDay===yesterday?Math.min(7,s.streak+1):1;s.giftDay=s.day;addMoney(s,100+s.streak*25);}
 else if(action==='prestige'){if(s.stage<5||s.cash<200000)throw Error('locked');const old={earned:s.earned,prestige:s.prestige+1,active:s.active,presence:s.presence,printed:s.printed,contracts:s.contracts,day:s.day,dailyPrinted:s.dailyPrinted,dailyEarned:s.dailyEarned,dailyContracts:s.dailyContracts,dailyClaimed:s.dailyClaimed,giftDay:s.giftDay,streak:s.streak,milestones:s.milestones};Object.assign(s,newState(now),old);s.cash=150+old.prestige*100;}
 else throw Error('invalid');
}

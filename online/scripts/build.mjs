import fs from 'node:fs';
const files={'/index.html':['web/index.html','text/html; charset=utf-8'],'/style.css':['web/style.css','text/css; charset=utf-8'],'/client.js':['web/client.js','text/javascript; charset=utf-8'],'/i18n.js':['web/i18n.js','text/javascript; charset=utf-8']};
const assets=Object.fromEntries(Object.entries(files).map(([url,[file,type]])=>[url,{body:fs.readFileSync(file,'utf8'),type}]));
const engine=fs.readFileSync('worker/engine.js','utf8').replaceAll('export ','');
const worker=fs.readFileSync('worker/index.js','utf8').replace(/^import .*;\r?\n/gm,'');
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai/drizzle/meta',{recursive:true});
fs.writeFileSync('dist/server/index.js',`const ASSETS=${JSON.stringify(assets)};\n${engine}\n${worker}`);
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
const src=fs.readFileSync('dist/server/index.js','utf8');const m=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));if(typeof m.default.fetch!=='function')throw Error('Missing fetch');console.log('Built worker, frontend and migrations.');

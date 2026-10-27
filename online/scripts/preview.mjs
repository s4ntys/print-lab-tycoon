import http from 'node:http';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {database} from './local-db.mjs';
fs.mkdirSync('outputs',{recursive:true});const DB=database('outputs/preview.sqlite');
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const request=new Request('http://127.0.0.1:4180'+req.url,{method:req.method,headers:req.headers,...(body.length?{body,duplex:'half'}:{})});const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end('Preview error');console.error(e.message);}}).listen(4180,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4180'));

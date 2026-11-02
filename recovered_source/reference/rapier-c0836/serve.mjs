import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = process.cwd();
const mime={'.html':'text/html; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const target=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/info' ? '/index.html':new URL(req.url,'http://localhost').pathname));
    if(!(target===root||target.startsWith(root+sep))) throw Error('Unsafe path');
    let path=target;const s=await stat(path); if(s.isDirectory())path=resolve(path,'index.html');
    const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch(e){res.writeHead(404);res.end('Not found');}
});
server.listen(8765,'127.0.0.1',()=>console.log('Open http://127.0.0.1:8765/'));

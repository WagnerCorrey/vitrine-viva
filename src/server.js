import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createStore,check,AppError} from './store.js';
import {extract} from './extract.js';
import {telegram} from './telegram.js';
const base=resolve(fileURLToPath(new URL('..',import.meta.url)),'public');
for(const flag of ['port','host']){const i=process.argv.indexOf('--'+flag);if(i>=0&&process.argv[i+1])process.env[flag.toUpperCase()]=process.argv[i+1];}
const dataDir=resolve(process.env.DATA_DIR||'data');await mkdir(dataDir,{recursive:true});
export const store=createStore(resolve(dataDir,'vitrine.sqlite'));
const bot=telegram(store),sessions=new Map(),limits=new Map();
const host=process.env.HOST||'127.0.0.1',password=process.env.ADMIN_PASSWORD||'jupara-demo';
if(host!=='127.0.0.1'&&host!=='localhost'&&password==='jupara-demo'&&process.env.ALLOW_DEMO_NETWORK!=='true')throw Error('Defina ADMIN_PASSWORD antes de expor o servidor.');
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
function authorized(req){const sid=req.headers.cookie?.match(/(?:^|;\s*)vv_session=([^;]+)/)?.[1];const expiry=sessions.get(sid);if(!expiry||expiry<Date.now()){sessions.delete(sid);return false;}return true;}
async function body(req){let n=0,chunks=[];for await(const chunk of req){n+=chunk.length;check(n<8500000,'Envio muito grande.',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{throw new AppError('JSON inválido.');}}
function rate(req,group,max){const key=group+req.socket.remoteAddress;const now=Date.now();let bucket=limits.get(key);if(!bucket||bucket.until<now){bucket={n:0,until:now+60000};limits.set(key,bucket);}check(++bucket.n<=max,'Muitas tentativas. Aguarde um minuto.',429);}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 try{
 const url=new URL(req.url,'http://localhost');const path=url.pathname;
 if(req.method!=='GET'&&req.method!=='HEAD'){check(req.headers['content-type']?.startsWith('application/json'),'Use JSON.',415);if(req.headers.origin)check(new URL(req.headers.origin).host===req.headers.host,'Origem inválida.',403);}
 const admin=authorized(req);
 if(path==='/api/session'&&req.method==='GET')return json(res,200,{admin});
 if(path==='/api/login'&&req.method==='POST'){rate(req,'login',12);const b=await body(req);check(equal(b.password,password),'Senha incorreta.',401);const sid=randomBytes(32).toString('hex');sessions.set(sid,Date.now()+8*3600000);res.setHeader('Set-Cookie',`vv_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return json(res,200,{ok:true});}
 if(path==='/api/logout'&&req.method==='POST'){const sid=req.headers.cookie?.match(/vv_session=([^;]+)/)?.[1];sessions.delete(sid);res.setHeader('Set-Cookie','vv_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
 if(path==='/api/catalog'&&req.method==='GET')return json(res,200,{settings:store.settings(),products:store.all('product')});
 if(path==='/api/orders'&&req.method==='POST'){rate(req,'order',20);const o=store.createOrder(await body(req));void bot.notify(o);return json(res,201,o);}
 const orderMatch=path.match(/^\/api\/orders\/([a-z0-9-]+)(?:\/(complete|cancel|reopen))?$/);
 if(orderMatch){const [,id,action]=orderMatch;const token=req.headers['x-order-token'];const o=store.get('order',id);check(o&&equal(o.token,token||''),'Pedido não encontrado.',404);if(req.method==='GET'&&!action)return json(res,200,o);if(req.method==='POST'){const b=await body(req);if(action==='complete')return json(res,200,store.complete(id,token,b.choices));if(action==='cancel')return json(res,200,store.cancel(id,token));if(action==='reopen'){const r=store.reopen(id,token);void bot.notify(r);return json(res,200,r);}}}
 if(path.startsWith('/api/admin')){
 check(admin,'Entre no painel da lojista.',401);
 if(path==='/api/admin/state'&&req.method==='GET')return json(res,200,{settings:store.settings(),products:store.all('product'),orders:store.all('order'),drafts:store.all('draft').filter(d=>d.status==='pending'),events:store.all('event').slice(0,50),integrations:{gemini:!!process.env.GEMINI_API_KEY,telegram:bot.enabled,tray:false}});
 if(path==='/api/admin/settings'&&req.method==='POST')return json(res,200,store.saveSettings(await body(req)));
 if(path==='/api/admin/products'&&req.method==='POST')return json(res,201,store.addProduct(await body(req)));
 const editProduct=path.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);if(editProduct&&req.method==='POST')return json(res,200,store.updateProduct(editProduct[1],await body(req)));
 if(path==='/api/admin/movement'&&req.method==='POST'){const b=await body(req);return json(res,200,store.movement(b.productId,b.delta,b.reason));}
 if(path==='/api/admin/extract'&&req.method==='POST'){rate(req,'extract',15);const b=await body(req);let items=[];if(b.kind==='review'){const o=store.get('order',b.orderId);check(o?.status==='pending','Pedido não está pendente.');items=o.items;}const data=await extract({...b,items});if(b.kind==='review')return json(res,200,data);if(b.attachment?.mime.startsWith('image/')&&b.attachment.data.length<2800000&&data.products.length===1)data.products[0].image=`data:${b.attachment.mime};base64,${b.attachment.data}`;return json(res,201,store.draft('product',data));}
 const draftMatch=path.match(/^\/api\/admin\/drafts\/([a-z0-9-]+)\/(confirm|discard)$/);if(draftMatch&&req.method==='POST'){const [,id,action]=draftMatch;const b=await body(req);if(action==='confirm')return json(res,200,store.confirmDraft(id,b));const d=store.get('draft',id);check(d?.status==='pending','Rascunho indisponível.',404);d.status='discarded';store.put('draft',d);return json(res,200,{ok:true});}
 const reviewMatch=path.match(/^\/api\/admin\/orders\/([a-z0-9-]+)\/review$/);if(reviewMatch&&req.method==='POST'){const b=await body(req);return json(res,200,store.reviewOrder(reviewMatch[1],b.lines));}
 if(path==='/api/admin/export'&&req.method==='GET'){res.setHeader('Content-Disposition','attachment; filename="vitrine-viva-produtos.json"');return json(res,200,{version:1,exportedAt:new Date().toISOString(),settings:store.settings(),products:store.all('product').map(({image,...p})=>p),trayIntegration:'not_implemented'});}
 }
 if(path.startsWith('/api/'))throw new AppError('Rota não encontrada.',404);
 check(req.method==='GET'||req.method==='HEAD','Método inválido.',405);
 const relative=decodeURIComponent(path==='/'?'/index.html':path);
 const file=resolve(base,'.'+relative);
 check(file.startsWith(base+sep),'Caminho inválido.',403);
 let bytes;
 try{bytes=await readFile(file);}catch{throw new AppError('Arquivo não encontrado.',404);}
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'}[extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});
 res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){json(res,e.status||500,{error:e.status?e.message:'Falha interna. Consulte o servidor.'});if(!e.status)console.error(e.name, 'Falha interna na solicitação.');}
});
server.listen(Number(process.env.PORT||3000),host,()=>{console.log(`Vitrine Viva em http://${host}:${process.env.PORT||3000}`);console.log('Painel: /#admin • Consulte .env para a senha.');bot.start();});
process.on('SIGTERM',()=>{bot.stop();server.close(()=>{store.db.close();process.exit(0);});});

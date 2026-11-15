import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
test('HTTP: autenticação, isolamento do pedido e jornada real de API',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'vitrine-test-'));const port=39000+Math.floor(Math.random()*1000);
 const child=spawn(process.execPath,['src/server.js'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dir,ADMIN_PASSWORD:'senha-de-teste',TELEGRAM_BOT_TOKEN:'',TELEGRAM_CHAT_ID:'',GEMINI_API_KEY:''},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('Timeout do servidor')),8000);child.stdout.on('data',d=>{if(d.toString().includes('Vitrine Viva em')){clearTimeout(timer);ok();}});child.on('error',no);});
  const base=`http://127.0.0.1:${port}`;const call=(p,data,cookie,token)=>fetch(base+'/api'+p,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(token?{'X-Order-Token':token}:{})},body:data?JSON.stringify(data):undefined});
  assert.equal((await fetch(base)).status,200);
  assert.equal((await call('/admin/state')).status,401);
  assert.equal((await call('/login',{password:'errada'})).status,401);
  const login=await call('/login',{password:'senha-de-teste'});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  const state=await (await call('/admin/state',null,cookie)).json();assert.equal(state.products.length,6);
  const p=state.products.find(p=>p.name.includes('Caderno azul'));
  const created=await call('/orders',{items:[{productId:p.id,qty:1}],customer:'Teste',requestId:crypto.randomUUID()});assert.equal(created.status,201);const o=await created.json();
  assert.equal((await call('/orders/'+o.id)).status,404);
  assert.equal((await call(`/orders/${o.id}/complete`,{choices:{}},null,o.token)).status,409);
  assert.equal((await call(`/admin/orders/${o.id}/review`,{lines:[{productId:p.id,available:true}]},cookie)).status,200);
  assert.equal((await call(`/orders/${o.id}/complete`,{choices:{}},null,o.token)).status,200);
  const final=await(await call('/catalog')).json();assert.equal(final.products.find(x=>x.id===p.id).stock,4);
  const csrf=await fetch(base+'/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://outro.site',Cookie:cookie},body:JSON.stringify(state.settings)});assert.equal(csrf.status,403);
  await call('/logout',{},cookie);assert.equal((await call('/admin/state',null,cookie)).status,401);
 }finally{const ended=once(child,'exit');child.kill('SIGTERM');await ended;await rm(dir,{recursive:true,force:true});}
});

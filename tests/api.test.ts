import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,verify,createPublicKey} from 'node:crypto';
import {createAPI} from '../apps/api/server';
import {canonical,verifyBundle} from '../packages/shared/domain';
const payload={experiment:'api-test',label:'API test',seed:1,metrics:{f1:.9},config:{},environment:{},notes:'',synthetic:true};
test('API auth, append-only semantics, idempotency, signed freeze and restart persistence',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'evidraft-api-'));const pushToken=randomBytes(32).toString('hex'),readToken=randomBytes(32).toString('hex');const options={directory,pushToken,readToken,origin:'http://127.0.0.1:5173'};let server=await createAPI(options);
 const start=async()=>{await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+(server.address() as {port:number}).port;};let url=await start();
 const req=(path:string,method='GET',token=readToken,body?:unknown,origin?:string)=>fetch(url+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await req('/v1/runs','GET','bad')).status,401);
  assert.equal((await req('/v1/runs','GET',pushToken)).status,403);
  assert.equal((await req('/v1/runs','POST',readToken,payload)).status,403);
  assert.equal((await req('/v1/runs','POST',pushToken,payload,'https://evil.example')).status,403);
  const results=await Promise.all([req('/v1/runs','POST',pushToken,payload),req('/v1/runs','POST',pushToken,payload)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);const run=(await results[0].json()).run;
  assert.equal((await req('/v1/runs/'+run.id,'PATCH',pushToken,{metrics:{f1:1}})).status,404);
  assert.equal((await req('/v1/runs','POST',pushToken,{...payload,metrics:{$gt:1}})).status,400);
  const frozen=await req('/v1/freezes','POST',readToken,{title:'API test',body:'{{run:'+run.id+'.metrics.f1 | 3dp}}'});assert.equal(frozen.status,201);const bundle=await frozen.json();assert.equal((await verifyBundle(bundle)).valid,true);assert.equal(verify(null,Buffer.from(canonical(bundle.manifest)),createPublicKey(bundle.publicKey),Buffer.from(bundle.signature,'base64')),true);
  await new Promise<void>(r=>server.close(()=>r()));server=await createAPI(options);url=await start();assert.equal((await (await req('/v1/runs')).json()).runs.length,1);
 }finally{await new Promise<void>(r=>server.close(()=>r()));await rm(directory,{recursive:true,force:true});}
});
test('API fails closed without distinct strong tokens',async()=>{await assert.rejects(()=>createAPI({directory:'/tmp/evidraft-invalid',pushToken:'x',readToken:'x',origin:'http://localhost'}));});

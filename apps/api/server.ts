import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve as pathResolve} from 'node:path';
import {createHash,timingSafeEqual,generateKeyPairSync,sign,createPrivateKey,createPublicKey} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {createRun,freeze,auditEvent,canonical,type Run,type Audit,type Draft} from '../../packages/shared/domain';

type Data={runs:Run[];audit:Audit[]};
type Options={directory:string;pushToken:string;readToken:string;origin:string};
const DraftSchema=z.object({title:z.string().min(1).max(200),body:z.string().max(100000)}).strict();
export async function createAPI(options:Options){
 if(options.pushToken.length<32||options.readToken.length<32||options.pushToken===options.readToken)throw new Error('Configure distinct read and push tokens of at least 32 characters');
 await mkdir(options.directory,{recursive:true,mode:0o700});const file=pathResolve(options.directory,'ledger.json');let data:Data;
 try{data=JSON.parse(await readFile(file,'utf8'));for(const r of data.runs){if((await createRun(r.payload,r.createdAt)).hash!==r.hash||r.id!==r.hash)throw new Error('Stored run integrity mismatch');}}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')data={runs:[],audit:[]};else throw e;}
 const keyFile=pathResolve(options.directory,'signing-key.pem');let privateKey;
 try{privateKey=createPrivateKey(await readFile(keyFile));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;privateKey=generateKeyPairSync('ed25519').privateKey;await writeFile(keyFile,privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600,flag:'wx'});}
 const publicKey=createPublicKey(privateKey).export({format:'pem',type:'spki'}).toString();
 const equal=(a:string,b:string)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
 let queue=Promise.resolve();const mutate=<T,>(fn:()=>Promise<T>):Promise<T>=>{const result=queue.then(fn);queue=result.then(()=>{},()=>{});return result;};
 const limits=new Map<string,{at:number;count:number}>();
 const respond=(res:ServerResponse,status:number,body:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
 async function body(req:IncomingMessage){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1_000_000)throw new Error('Body exceeds 1 MB');}return JSON.parse(raw);}
 async function persist(next:Data){await writeFile(file+'.tmp',JSON.stringify(next),{mode:0o600});await rename(file+'.tmp',file);data=next;}
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
  const origin=req.headers.origin;if(origin&&origin!==options.origin){respond(res,403,{error:'Origin not allowed'});return;}
  if(origin){res.setHeader('Access-Control-Allow-Origin',options.origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','authorization,content-type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.writeHead(204);res.end();return;}
  if(req.url==='/healthz'||req.url==='/readyz'){respond(res,200,{status:'ok',mode:'single-owner-local',persistence:'atomic-file'});return;}
  const token=req.headers.authorization?.replace(/^Bearer /,'')??'';const canRead=equal(token,options.readToken),canPush=equal(token,options.pushToken);
  if(!canRead&&!canPush){respond(res,401,{error:'A scoped bearer token is required'});return;}
  const client=req.socket.remoteAddress??'unknown';const now=Date.now();for(const [k,v]of limits)if(now-v.at>60000)limits.delete(k);let limit=limits.get(client);if(!limit){limit={at:now,count:0};limits.set(client,limit);}if(++limit.count>120){respond(res,429,{error:'Rate limit exceeded'});return;}
  try{
   if(req.method==='GET'&&req.url==='/v1/runs'){if(!canRead){respond(res,403,{error:'read scope required'});return;}respond(res,200,{runs:data.runs});return;}
   if(req.method==='GET'&&req.url==='/v1/signing-key'){if(!canRead){respond(res,403,{error:'read scope required'});return;}respond(res,200,{publicKey});return;}
   if(req.method==='POST'&&req.url==='/v1/runs'){
    if(!canPush){respond(res,403,{error:'push scope required'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){respond(res,415,{error:'Use application/json'});return;}
    const run=await createRun(await body(req));const result=await mutate(async()=>{const existing=data.runs.find(r=>r.id===run.id);if(existing)return {run:existing,duplicate:true};if(data.runs.length>=10000)throw new Error('Local ledger capacity reached');const event=await auditEvent(data.audit.at(-1)?.hash??'genesis','push',run.id);await persist({runs:[...data.runs,run],audit:[...data.audit,event]});return {run,duplicate:false};});respond(res,result.duplicate?200:201,result);return;
   }
   if(req.method==='POST'&&req.url==='/v1/freezes'){if(!canRead){respond(res,403,{error:'read scope required'});return;}const doc=DraftSchema.parse(await body(req));const bundle=await freeze(doc,data.runs);const signature=sign(null,Buffer.from(canonical(bundle.manifest)),privateKey).toString('base64');respond(res,201,{...bundle,signature,publicKey});return;}
   respond(res,404,{error:'Endpoint not found. Ledger runs cannot be updated or deleted.'});
  }catch(e){respond(res,400,{error:e instanceof z.ZodError?'Payload does not match the strict run/document schema':(e as Error).message});}
 });server.requestTimeout=15000;server.headersTimeout=10000;return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const server=await createAPI({directory:process.env.DATA_DIR??'.data',pushToken:process.env.PUSH_TOKEN??'',readToken:process.env.READ_TOKEN??'',origin:process.env.WEB_ORIGIN??'http://127.0.0.1:5173'});
 const port=Number(process.env.PORT??3001);server.listen(port,'127.0.0.1',()=>console.log(`Evidraft single-owner API: http://127.0.0.1:${port}`));
 process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close());
}

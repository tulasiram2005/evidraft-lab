import { z } from 'zod';

const key = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/);
const safeRecord = z.record(key, z.union([z.string().max(500), z.number().finite(), z.boolean()]));
export const RunInput = z.object({experiment:key, label:z.string().min(1).max(100), seed:z.number().int().nonnegative(), metrics:z.record(key,z.number().finite()).refine(v=>Object.keys(v).length>0&&Object.keys(v).length<=30), config:safeRecord, environment:safeRecord, gitCommit:z.string().regex(/^[a-f0-9]{40}$/).optional(), notes:z.string().max(2000).default(''), synthetic:z.boolean()}).strict();
export type RunPayload = z.infer<typeof RunInput>;
export type Run = {id:string; hash:string; createdAt:string; payload:RunPayload};
export type Audit = {at:string; action:string; detail:string; previous:string; hash:string};
export type Binding = {expression:string; runId:string; metric:string; dp:number; start:number; end:number};
export type Finding = {id:string; status:'verified'|'mismatch'|'unbound'|'ambiguous'; text:string; reason:string; expected?:number; actual?:number};
export type Draft = {title:string; body:string};
export type Bundle = {format:'evidraft/1'; document:Draft; runs:Run[]; manifest:{createdAt:string; documentHash:string; runHashes:string[]; synthetic:boolean; warnings:string[]}; hash:string; signature?:string; publicKey?:string};

export function canonical(value:unknown):string {
  if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
  if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('Non-finite number');return JSON.stringify(Object.is(value,-0)?0:value);}
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(typeof value==='object' && Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
  throw new Error('Only plain JSON values are supported');
}
export async function hash(value:unknown):Promise<string>{return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function createRun(input:unknown,createdAt=new Date().toISOString()):Promise<Run>{const payload=RunInput.parse(input);const digest=await hash(payload);return {id:digest,hash:digest,createdAt,payload};}
export function bindings(body:string):Binding[]{
  const regex=/\{\{run:([a-f0-9]{64})\.metrics\.([A-Za-z][A-Za-z0-9_-]{0,63})\s*\|\s*([0-6])dp\}\}/g;
  return Array.from(body.matchAll(regex),m=>({expression:m[0],runId:m[1],metric:m[2],dp:Number(m[3]),start:m.index!,end:m.index!+m[0].length}));
}
export function resolve(binding:Binding,runs:Run[]){
  const run=runs.find(r=>r.id===binding.runId);const value=run?.payload.metrics[binding.metric];
  const latest=run?[...runs].filter(r=>r.payload.experiment===run.payload.experiment).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))[0]:undefined;
  return {run,value,latest,stale:!!run&&!!latest&&latest.id!==run.id,broken:value===undefined};
}
export function compare(a:number,b:number,mode:'relative'|'points'|'absolute'){
  if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Values must be finite');
  if(mode==='relative'&&a===0)throw new Error('Relative change from zero is undefined');
  return mode==='relative'?(b-a)/Math.abs(a)*100:mode==='points'?(b-a)*100:b-a;
}
export function checkClaims(body:string,runs:Run[]):Finding[]{
  const out:Finding[]=[];let n=0;
  for(const paragraph of body.split(/\n\s*\n/)){
    const refs=bindings(paragraph); const values=refs.map(b=>resolve(b,runs));
    for(let i=0;i<refs.length;i++){const v=values[i];out.push({id:'binding-'+n++,status:v.broken?'ambiguous':'verified',text:refs[i].expression,reason:v.broken?'The referenced run or metric is missing.':'Bound value matches its immutable run. This does not validate the scientific method.'});}
    const cleaned=refs.reduce((s,b)=>s.replace(b.expression,'BOUND'),paragraph);
    const claim=/\b(improves?|increases?|decreases?|reduces?)\s+(?:[A-Za-z0-9_ -]+?\s+)?by\s+(-?\d+(?:\.\d+)?)\s*(%|percentage points|points)/gi;
    let found=false;
    for(const m of cleaned.matchAll(claim)){
      found=true; const actual=Number(m[2]);const mode=m[3]==='%'?'relative':'points';
      if(values.length!==2||values.some(v=>v.broken)){out.push({id:'claim-'+n++,status:'ambiguous',text:m[0],reason:'Use exactly two bound values in this paragraph, baseline first, then result.'});continue;}
      try{let expected=compare(values[0].value!,values[1].value!,mode);if(/decreas|reduc/i.test(m[1]))expected=-expected;const decimals=(m[2].split('.')[1]??'').length;const tolerance=0.5*10**(-decimals)+1e-10;out.push({id:'claim-'+n++,status:Math.abs(expected-actual)<tolerance?'verified':'mismatch',text:m[0],reason:`Calculated ${expected.toFixed(3)} ${mode==='relative'?'% relative change':'percentage points'} from the bound values.`,expected,actual});}catch(e){out.push({id:'claim-'+n++,status:'ambiguous',text:m[0],reason:(e as Error).message});}
    }
    const withoutClaim=cleaned.replace(claim,'');
    for(const m of withoutClaim.matchAll(/(?<![A-Za-z])\b\d+(?:\.\d+)?\s*%/g)){out.push({id:'unbound-'+n++,status:'unbound',text:m[0],reason:'This numeric percentage has no explicit evidence binding.'});}
    if(!found && /\b(significant|outperform|better than)\b/i.test(cleaned))out.push({id:'ambiguous-'+n++,status:'ambiguous',text:cleaned.slice(0,160),reason:'A comparative or statistical claim needs an explicit test and evidence. Numeric agreement alone is insufficient.'});
  }return out;
}
export function renderText(body:string,runs:Run[]){let result=body;for(const b of bindings(body)){const r=resolve(b,runs);result=result.replace(b.expression,r.value===undefined?'[MISSING EVIDENCE]':r.value.toFixed(b.dp));}return result;}
export async function freeze(document:Draft,runs:Run[]):Promise<Bundle>{
  const refs=bindings(document.body);const ids=new Set(refs.map(b=>b.runId));
  if(refs.some(b=>resolve(b,runs).broken))throw new Error('Cannot freeze with missing evidence. Repair the bindings first.');
  const selected=runs.filter(r=>ids.has(r.id)).sort((a,b)=>a.hash.localeCompare(b.hash));
  for(const run of selected)if(await hash(run.payload)!==run.hash)throw new Error('Run integrity check failed');
  const stale=refs.filter(b=>resolve(b,runs).stale).length;
  const issues=checkClaims(document.body,runs).filter(f=>f.status!=='verified');
  const warnings=[...(stale?[`${stale} stale bindings at freeze time`]:[]),...issues.map(f=>`${f.status}: ${f.text}`)];
  const manifest={createdAt:new Date().toISOString(),documentHash:await hash(document),runHashes:selected.map(r=>r.hash),synthetic:selected.some(r=>r.payload.synthetic),warnings};
  return {format:'evidraft/1',document:structuredClone(document),runs:structuredClone(selected),manifest,hash:await hash(manifest)};
}
export async function verifyBundle(input:unknown):Promise<{valid:boolean; reason:string}>{
  try{
    const b=input as Bundle;if(b.format!=='evidraft/1'||!Array.isArray(b.runs)||b.runs.length>1000)throw new Error('Unsupported bundle');
    if(typeof b.document.title!=='string'||typeof b.document.body!=='string')throw new Error('Invalid document');
    if(await hash(b.manifest)!==b.hash)throw new Error('Manifest hash mismatch');
    if(await hash(b.document)!==b.manifest.documentHash)throw new Error('Document hash mismatch');
    const seen=new Set<string>();for(const r of b.runs){RunInput.parse(r.payload);if(await hash(r.payload)!==r.hash||r.id!==r.hash||seen.has(r.hash))throw new Error('Run hash mismatch or duplicate');seen.add(r.hash);}
    if(canonical([...seen].sort())!==canonical([...b.manifest.runHashes].sort()))throw new Error('Run set mismatch');
    if(bindings(b.document.body).some(ref=>resolve(ref,b.runs).broken))throw new Error('Missing bound evidence');
    return {valid:true,reason:'Document, manifest and all bound run hashes match. Integrity is not proof of scientific validity or author identity.'};
  }catch(e){return {valid:false,reason:(e as Error).message};}
}
export async function auditEvent(previous:string,action:string,detail:string):Promise<Audit>{const event={at:new Date().toISOString(),action,detail,previous};return {...event,hash:await hash(event)};}
export function parseCSV(text:string):RunPayload[]{
  if(text.length>1_000_000)throw new Error('CSV exceeds 1 MB');
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  if(quoted)throw new Error('Unclosed CSV quote');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  const header=rows.shift()?.map(s=>s.trim());if(!header||header.join(',')!=='experiment,label,seed,metric,value')throw new Error('CSV header must be experiment,label,seed,metric,value');
  return rows.map(r=>{if(r.length!==5||r.some(c=>/^[=+@\t\r]/.test(c)))throw new Error('Invalid row or spreadsheet formula');if(!r[2].trim()||!r[4].trim())throw new Error('Missing numeric value');return RunInput.parse({experiment:r[0],label:r[1],seed:Number(r[2]),metrics:{[r[3]]:Number(r[4])},config:{},environment:{source:'csv'},notes:'',synthetic:false});});
}

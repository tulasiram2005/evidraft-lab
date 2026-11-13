import {readFile} from 'node:fs/promises';
import {RunInput} from '../shared/domain';
const path=process.argv[2];if(!path)throw new Error('Usage: npm run push-run -- results.json');
const payload=RunInput.parse(JSON.parse(await readFile(path,'utf8')));const base=new URL(process.env.EVIDRAFT_API??'http://127.0.0.1:3001');
if(base.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(base.hostname))throw new Error('Remote API requires HTTPS');
const token=process.env.PUSH_TOKEN;if(!token)throw new Error('PUSH_TOKEN is required');
const res=await fetch(new URL('/v1/runs',base),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const result=await res.json();if(!res.ok)throw new Error(JSON.stringify(result));console.log(JSON.stringify(result,null,2));

import {readFile} from 'node:fs/promises';
import {verify,createPublicKey} from 'node:crypto';
import {verifyBundle,canonical,type Bundle} from '../shared/domain';
const path=process.argv[2];if(!path)throw new Error('Usage: npm run verify -- bundle.json [trusted-public-key.pem]');
const raw=await readFile(path,'utf8');if(raw.length>5_000_000)throw new Error('Bundle exceeds 5 MB');const bundle=JSON.parse(raw) as Bundle;
const result=await verifyBundle(bundle);if(!result.valid){console.error('FAIL: '+result.reason);process.exitCode=1;}else if(bundle.signature){const trustedPath=process.argv[3];if(!trustedPath){console.error('Integrity PASS; signature trust UNVERIFIED. Supply an independently obtained public key.');process.exitCode=2;}else{const key=createPublicKey(await readFile(trustedPath));const valid=verify(null,Buffer.from(canonical(bundle.manifest)),key,Buffer.from(bundle.signature,'base64'));console.log(valid?'PASS: integrity and signature verified against supplied trusted key.':'FAIL: signature did not match trusted key.');process.exitCode=valid?0:1;}}else console.log('PASS: integrity only. This bundle is unsigned. '+result.reason);

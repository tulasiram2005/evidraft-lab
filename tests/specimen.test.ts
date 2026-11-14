import test from 'node:test';
import assert from 'node:assert/strict';
import {leaf,metricSummary,rulerScale} from '../packages/shared/specimen';
test('leaf is deterministic and independent of calls',()=>{const hash='0123456789abcdef'.repeat(4);const a=leaf(hash);leaf('f'.repeat(64));assert.deepEqual(leaf(hash),a);});
test('leaf matches reference width and rotation controls',()=>{assert.equal(leaf('0'.repeat(64)).rotation,-13);assert.equal(leaf('f'.repeat(64)).rotation,13);assert.equal(leaf('0'.repeat(64)).veinCount,3);assert.equal(leaf('f'.repeat(64)).veinCount,6);});
test('leaf rejects malicious or invalid input',()=>{for(const h of ['', '<svg>', 'g'.repeat(64), '0'.repeat(65)])assert.throws(()=>leaf(h));});
test('leaf remains finite across hex input variations',()=>{for(let i=0;i<256;i++){const shape=leaf(i.toString(16).padStart(2,'0').repeat(32));assert.ok(!/NaN|Infinity/.test(shape.outline+shape.veins));assert.ok(shape.outline.endsWith('Z'));assert.ok(Math.abs(shape.rotation)<=13);}});
test('specimen summaries are computed from actual runs',()=>{assert.deepEqual(metricSummary([.8,.9,1]),{min:.8,max:1,mean:.9});assert.throws(()=>metricSummary([]));assert.throws(()=>metricSummary([NaN]));});
test('claim ruler includes both marks, negative claims and zero gap',()=>{for(const [a,b]of [[12,9.834],[-2,3],[0,0]]){const s=rulerScale(a,b);assert.ok(s.min<=a&&s.min<=b&&s.max>=a&&s.max>=b);assert.equal(s.gap,a-b);assert.ok(s.max>s.min);}});

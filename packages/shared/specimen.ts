/** Geometry ported from the user's Cyanotype Herbarium reference. No DOM, random state or HTML. */
export function leaf(hash:string){
 if(!/^[a-f\d]{8,64}$/i.test(hash))throw new Error('Leaf requires a hexadecimal content hash');
 const n=(i:number)=>parseInt(hash[i],16)/15;
 const width=7+n(0)*7,sk=.3+n(2)*.35,exponent=Math.log(.5)/Math.log(sk),power=.55+n(1)*.7,rotation=(n(3)-.5)*26;
 const w=(t:number)=>width*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,exponent))),power),y=(t:number)=>36-t*32;
 let left='',right='';for(let i=0;i<=24;i++){const t=i/24;left+=`${i?'L':'M'}${(20-w(t)).toFixed(1)} ${y(t).toFixed(1)}`;right=`L${(20+w(t)).toFixed(1)} ${y(t).toFixed(1)}`+right;}
 const count=3+Math.floor(n(4)*3);let veins='M20 38V5';for(let i=1;i<=count;i++){const t=.1+i/(count+1)*.78,yy=y(t),x=w(t)*.92;veins+=`M20 ${yy}L${20-x} ${yy-x*.7}M20 ${yy}L${20+x} ${yy-x*.7}`;}
 return {outline:left+right+'Z',veins,rotation:Number(rotation.toFixed(1)),veinCount:count};
}
export function metricSummary(values:number[]){if(!values.length||values.some(v=>!Number.isFinite(v)))throw new Error('Finite measurements required');return {min:Math.min(...values),max:Math.max(...values),mean:values.reduce((a,b)=>a+b,0)/values.length};}
export function rulerScale(actual:number,expected:number){if(!Number.isFinite(actual)||!Number.isFinite(expected))throw new Error('Finite claims required');const lo=Math.min(0,actual,expected),hi=Math.max(1,actual,expected);const range=hi-lo;return {min:lo-range*.1,max:hi+range*.15,gap:actual-expected};}

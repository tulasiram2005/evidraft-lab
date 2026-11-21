import React, {useEffect, useRef, useState} from 'react';

type Manuscript = {id:string; owner_id:string; body:string; revision:number};
type Session = {access_token:string; user:{id:string}};
type Props = {source:string; close:()=>void};
const config = (import.meta as ImportMeta & {env:Record<string,string>}).env;
const url = config.VITE_SUPABASE_URL;
const key = config.VITE_SUPABASE_ANON_KEY;

export function SharedManuscript({source,close}:Props) {
  const [session, signIn] = useState<Session|null>(null);
  const [email,setEmail]=useState(''), [password,setPassword]=useState('');
  const [items,setItems]=useState<Manuscript[]>([]), [doc,setDoc]=useState<Manuscript|null>(null);
  const [body,setBody]=useState(''), [member,setMember]=useState(''), [role,setRole]=useState('viewer');
  const [status,notify]=useState(''), [busy,setBusy]=useState(false);
  const request = async (path:string, method='GET', payload?:unknown, prefer='return=representation')=>{
    const res=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+(session?.access_token||key),'Content-Type':'application/json',Prefer:prefer},body:payload===undefined?undefined:JSON.stringify(payload)});
    const data=await res.text();
    if(!res.ok) throw new Error(JSON.parse(data).message||'Request failed. Sign in again if your session expired.');
    return data?JSON.parse(data):null;
  };
  const run=async(action:()=>Promise<void>)=>{
    setBusy(true);notify('');
    try{await action();}catch(e){notify(e instanceof Error?e.message:'Request failed');}finally{setBusy(false);}
  };
  const open=(d:Manuscript)=>{setDoc(d);setBody(d.body);};
  const currentDraft=useRef({doc,body});
  currentDraft.current={doc,body};
  useEffect(()=>{
    if(!session)return;
    let active=true;
    const refresh=async()=>{
      try {
        const rows:Manuscript[]=await request('/rest/v1/shared_manuscripts?select=*&order=id');
        if(!active)return;
        setItems(rows);
        const {doc,body}=currentDraft.current;
        const current=rows.find(row=>row.id===doc?.id);
        if(doc&&!current){setDoc(null);notify('Access removed.');}
        if(current&&doc&&current.revision>doc.revision){
          if(body===doc.body)open(current);
          else notify('Another author saved a revision. Copy your edits before opening the latest version.');
        }
      }catch(e){if(active)notify(String(e));}
    };
    void refresh();const timer=setInterval(refresh,3000);
    return ()=>{active=false;clearInterval(timer);};
  },[session]);
  const dirty=!!doc&&body!==doc.body;
  const leave=()=>!dirty||window.confirm('Discard unsaved shared edits?');
  return <section className="paper" aria-label="Shared manuscripts"><button onClick={()=>{if(leave())close();}}>Back to research desk</button><h1>Shared manuscripts</h1>
    {!url||!key?<p>Cloud access is awaiting backend configuration.</p>:!session?<form onSubmit={e=>{e.preventDefault();void run(async()=>{signIn(await request('/auth/v1/token?grant_type=password','POST',{email,password}));setPassword('');});}}>
      <label>Email <input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password <input required type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button disabled={busy}>Sign in</button><button type="button" disabled={busy} onClick={()=>void run(async()=>{await request('/auth/v1/signup','POST',{email,password});notify('Check your email to confirm your account, then sign in.');})}>Create account</button>
    </form>:<fieldset disabled={busy}><p>Your member ID <code>{session.user.id}</code></p>
      <button onClick={()=>void run(async()=>{if(!leave())return;const [d]=await request('/rest/v1/shared_manuscripts','POST',{body:source});open(d);})}>Share a copy of local manuscript text</button>
      <ul>{items.map(d=><li key={d.id}><button onClick={()=>{if(leave())open(d);}}>{d.body.slice(0,48)||'Untitled manuscript'} · revision {d.revision}</button></li>)}</ul>
      {doc&&<><label>Shared source <textarea maxLength={100000} rows={18} value={body} onChange={e=>setBody(e.target.value)}/></label>
      <button disabled={!dirty} onClick={()=>void run(async()=>{const rows=await request('/rest/v1/shared_manuscripts?id=eq.'+doc.id+'&revision=eq.'+doc.revision,'PATCH',{body});if(!rows.length)throw new Error('Save declined. Check your editing role and the latest revision. Your edits are still here.');open(rows[0]);notify('Revision saved.');})}>Save revision</button>
      {doc.owner_id===session.user.id&&<div><label>Member ID <input value={member} onChange={e=>setMember(e.target.value)}/></label><select aria-label="Member role" value={role} onChange={e=>setRole(e.target.value)}><option>viewer</option><option>editor</option></select>
      <button onClick={()=>void run(async()=>{const path='/rest/v1/manuscript_members';const filter='?manuscript_id=eq.'+doc.id+'&user_id=eq.'+encodeURIComponent(member);const existing=await request(path+filter);if(existing.length)await request(path+filter,'PATCH',{role});else await request(path,'POST',{manuscript_id:doc.id,user_id:member,role});notify('Member role saved.');})}>Set role</button>
      <button onClick={()=>void run(async()=>{await request('/rest/v1/manuscript_members?manuscript_id=eq.'+doc.id+'&user_id=eq.'+encodeURIComponent(member),'DELETE');notify('Membership removed.');})}>Remove member</button></div>}</>}
      <button onClick={()=>{if(leave()){signIn(null);setDoc(null);setItems([]);setBody('');}}}>Sign out</button></fieldset>}
    <p role="status">{status}</p></section>;
}

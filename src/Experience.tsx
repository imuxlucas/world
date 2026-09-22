import {lazy,Suspense,useEffect,useState} from 'react';
const Studio=lazy(()=>import('./App'));
const Park=lazy(()=>import('./ParkScene'));
export default function Experience(){
  const [hash,setHash]=useState(()=>location.hash);
  useEffect(()=>{const update=()=>setHash(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  return <Suspense fallback={<div style={{background:'#fff',minHeight:'100vh',display:'grid',placeItems:'center',color:'#8a809b'}}>正在打开小小乐园…</div>}>{!hash||hash==='#park'||hash.startsWith('#park/')?<Park/>:<Studio/>}</Suspense>;
}

import OBR from '@owlbear-rodeo/sdk';
import {normalizeNotation,rollText} from './obr-roll-core.mjs';
export const hosted21=location.protocol==='https:'&&!['localhost','127.0.0.1'].includes(location.hostname);
export const asset21=path=>new URL(path.replace(/^\/+/,''),new URL('.',location.href)).href;
const LOCAL='http://localhost:17632',channel=new BroadcastChannel('folio-bridge21'),waiting=new Map();
let token='',retryAt=0,direct=!hosted21||localStorage.getItem('folio-direct21')==='on',popup=null,popupNonce='',online=false;
window.__folioBridgeOwner21=location.pathname.endsWith('/background.html');
let hello21;window.__folioAttach21=(child,nonce)=>{popup=child;popupNonce=nonce;online=false;clearInterval(hello21);let n=0;const hello=()=>{if(child.closed||online||++n>30){clearInterval(hello21);return;}child.postMessage({folio21:'hello',nonce},LOCAL);};hello();hello21=setInterval(hello,400);};
function bridgeOwner21(){const queue=[window.top],seen=new Set();for(let n=0;queue.length&&n<100;n++){const w=queue.shift();if(seen.has(w))continue;seen.add(w);try{if(w.__folioBridgeOwner21)return w;}catch{}try{for(let i=0;i<w.length;i++)queue.push(w.frames[i]);}catch{}}return window;}
export async function connectLocal21(usePopup=false){retryAt=0;if(usePopup){const nonce=crypto.randomUUID(),url=LOCAL+'/connect21.html#'+new URLSearchParams({origin:location.origin,nonce}),child=window.open(url,'folio-connection21','width=420,height=240');if(!child)throw Error('请允许弹出连接窗口后重试');bridgeOwner21().__folioAttach21(child,nonce);return;}direct=true;localStorage.setItem('folio-direct21','on');await remote21('/api/view?since=-1');}
window.addEventListener('message',event=>{if(event.origin!==LOCAL||event.source!==popup||event.data?.nonce!==popupNonce)return;const x=event.data;if(x.folio21==='ready'){online=true;channel.postMessage({kind:'status',online:true});return;}if(x.folio21==='reply'){channel.postMessage({kind:'reply',...x});receive21(x);}});
function receive21(x){const p=waiting.get(x.id);if(!p)return;waiting.delete(x.id);clearTimeout(p.timer);x.error?p.reject(Error(x.error)):p.resolve(x.result);}
channel.onmessage=event=>{const x=event.data;if(x.kind==='reply')receive21(x);if(x.kind==='rpc'&&window.__folioBridgeOwner21&&popup&&!popup.closed)popup.postMessage({folio21:'request',nonce:popupNonce,...x},LOCAL);if(x.kind==='status')online=x.online;if(x.kind==='status-query'&&window.__folioBridgeOwner21&&online)channel.postMessage({kind:'status',online:true});};
async function popup21(path,body){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{waiting.delete(id);reject(Error('本机连接窗口未响应，请打开 EXE 后重新连接'));},path.startsWith('/api/view')?3000:12000);waiting.set(id,{resolve,reject,timer});const x={kind:'rpc',id,path,body};if(window.__folioBridgeOwner21&&popup&&!popup.closed)popup.postMessage({folio21:'request',nonce:popupNonce,...x},LOCAL);else channel.postMessage(x);});}
export const bridgeStatus21=()=>({online,hosted:hosted21,direct});
async function remote21(path,body){if(hosted21&&online){try{return await popup21(path,body);}catch{online=false;}}
 if(!direct||Date.now()<retryAt)throw Error('打开电脑端手札后，点击“连接本机角色卡”');
 const base=hosted21?LOCAL:'',headers={...(body?{'Content-Type':'application/json'}:{})};
 try{if(!token){const r=await fetch(base+'/api/session',{signal:AbortSignal.timeout(1600),credentials:'omit'});if(!r.ok)throw Error('请更新并打开电脑端 EXE v0.21 或以上');const s=await r.json();if(s.app!=='adventurer-folio-owlbear')throw Error('本机端口不是旅人手札');token=s.token;}
 headers['X-Folio-Token']=token;const r=await fetch(base+path,{method:body?'POST':'GET',headers,signal:AbortSignal.timeout(12000),credentials:'omit',...(body?{body:JSON.stringify(body)}:{})});const x=await r.json();if(!r.ok){if(r.status===403)token='';throw Error(x.error||'本机手札连接中断');}online=false;return x;
 }catch(e){retryAt=Date.now()+5000;token='';throw e;}}
const storeKey='folio-web-jobs21';
async function transaction21(fn){const run=()=>{let x;try{x=JSON.parse(localStorage.getItem(storeKey)||'{"jobs":[],"results":[]}');}catch{x={jobs:[],results:[]};}const result=fn(x);x.jobs=x.jobs.slice(-120);x.results=x.results.slice(-200);localStorage.setItem(storeKey,JSON.stringify(x));return result;};return navigator.locks?navigator.locks.request(storeKey,run):run();}
async function browser21(path,body){const p=new URL(path,'https://folio.local'),id=body?.id||p.searchParams.get('id');return transaction21(x=>{const job=x.jobs.find(j=>j.id===id);
 if(p.pathname==='/api/request'){const notation=normalizeNotation(body.notation||'');rollText(notation,()=>1);const id='web21-'+body.id;if(!x.jobs.some(j=>j.id===id))x.jobs.push({...body,notation,id,roomId:OBR.room.id,confirmed:false,status:'queued',created:Date.now()});return {id};}
 if(p.pathname==='/api/work'){const worker=p.searchParams.get('worker'),room=p.searchParams.get('room'),jobs=x.jobs.filter(j=>j.roomId===room&&(j.status==='queued'||!j.confirmed&&['running','review'].includes(j.status)&&j.worker!==worker));for(const j of jobs){j.worker=worker;j.status='running';}return {jobs:structuredClone(jobs)};}
 if(!job)throw Error('掷骰草稿已失效，请重新打开');
 if(p.pathname==='/api/draft')return structuredClone(job);
 if(p.pathname==='/api/review-targets19'){job.targets19=body.targets19||[];return {ok:true};}
 if(p.pathname==='/api/review-open'){if(!job.confirmed)job.status='review';return {ok:true};}
 if(p.pathname==='/api/confirm'){if(job.confirmed||job.status==='done')throw Error('此草稿已经处理，不会重复掷骰');const notation=normalizeNotation(body.notation);rollText(notation,()=>1);Object.assign(job,{notation,confirmed:true,status:'queued',type:body.report?'report':'roll',engine:body.engine||'suite',audience:body.audience||'self',selectedTargets19:(job.targets19||[]).filter(t=>(body.targets19||[]).includes(t.id)),targetMode19:body.targetMode19==='separate'?'separate':'shared',otherNotation19:body.otherNotation19||notation});return {ok:true};}
 if(p.pathname==='/api/cancel'){if(job.confirmed)throw Error('已确认的骰子不能取消');job.status='done';return {ok:true};}
 if(p.pathname==='/api/result'){if(job.worker!==body.worker)throw Error('骰子任务不属于此后台');if(job.status==='done')return {duplicate:true};job.status='done';x.results.push({...body,label:job.label,actorName:job.actorName,time:Date.now(),roomId:job.roomId});return {ok:true};}
 throw Error('不支持的本机骰子操作');});}
export async function bridgeAPI21(path,body){const p=new URL(path,'https://folio.local');if(p.pathname==='/api/request'&&!body.characterId&&!body.once18?.length)return browser21(path,body);
 if(String(body?.id||p.searchParams.get('id')||'').startsWith('web21-'))return browser21(path,body);
 if(p.pathname==='/api/work'){const local=await browser21(path,body),remote=await remote21(path,body).catch(()=>({jobs:[]}));return {jobs:[...(remote.jobs||[]),...local.jobs]};}
 if(p.pathname==='/api/heartbeat')return remote21(path,body).catch(()=>({ok:true,standalone21:true}));
 if(p.pathname==='/api/view'){try{return await remote21(path,body);}catch{return {revision:-1,view:null,rooms:[],results:[],mainOnline:false,standalone21:true};}}
 return remote21(path,body);}
export async function backgroundOwner21(run){if(navigator.locks)return navigator.locks.request('folio-background21-'+OBR.room.id,{},async lock=>{await run();await new Promise(()=>{});});await run();}

channel.postMessage({kind:'status-query'});

setInterval(()=>{if(window.__folioBridgeOwner21&&online&&popup?.closed){online=false;channel.postMessage({kind:'status',online:false});}},800);

import plugin24 from '../plugin-version.json';
import OBR from '@owlbear-rodeo/sdk';
import {normalizeNotation,rollText} from './obr-roll-core.mjs';
export const hosted21=location.protocol==='https:'&&!['localhost','127.0.0.1'].includes(location.hostname);
export const asset21=path=>{const u=new URL(path.replace(/^\/+/ ,''),hosted21?'http://localhost:17632/':new URL('.',location.href));u.searchParams.set('v',plugin24.version);return u.href;};
const LOCAL='http://localhost:17632';let token='',retryAt=0;
window.__folioBridgeOwner21=location.pathname.endsWith('/background.html');
export const bridgeStatus21=()=>({online:!!token,hosted:false,direct:true});
export async function connectLocal21(force=false){if(force)token='';retryAt=0;return {ok:true,...await remote21('/api/view?since=-1')};}
async function remote21(path,body){
 if(Date.now()<retryAt)throw Error('本地服务正在重新连接，请确认新版手札已打开');
 const headers={...(body?{'Content-Type':'application/json'}:{})},base=hosted21?LOCAL:'';
 try{
  if(!token){const r=await fetch(base+'/api/session',{cache:'no-store',signal:AbortSignal.timeout(1600)});if(!r.ok)throw Error('本地服务不可用');const s=await r.json();if(s.app!=='adventurer-folio-owlbear')throw Error('本机端口不是旅人手札');if(s.pluginVersion&&s.pluginVersion!==plugin24.version)reload24(s.pluginVersion);token=s.token;}
  headers['X-Folio-Token']=token;const r=await fetch(base+path,{method:body?'POST':'GET',headers,cache:'no-store',signal:AbortSignal.timeout(12000),...(body?{body:JSON.stringify(body)}:{})});const version=r.headers.get('X-Folio-Version');if(version&&version!==plugin24.version)reload24(version);const x=await r.json();if(!r.ok){if(r.status===403)token='';const error=Error(x.error||'本机手札连接中断');error.http24=r.status;throw error;}retryAt=0;return x;
 }catch(e){if(e.http24)throw e;retryAt=Date.now()+1600;token='';if(e instanceof TypeError||e.name==='TimeoutError'||e.name==='AbortError')throw Error('本机手札暂未连接，请打开新版 EXE 后刷新房间');throw e;}
}
function reload24(version){if(/^\d+\.\d+\.\d+$/.test(version)){const u=new URL(location.href);u.searchParams.set('v',version);location.replace(u.href);}throw Error('本地插件已更新，正在重新载入');}
const storeKey='folio-web-jobs21';
async function transaction21(fn){const run=()=>{let x;try{x=JSON.parse(localStorage.getItem(storeKey)||'{"jobs":[],"results":[]}');}catch{x={jobs:[],results:[]};}const result=fn(x);x.jobs=x.jobs.slice(-120);x.results=x.results.slice(-200);localStorage.setItem(storeKey,JSON.stringify(x));return result;};return navigator.locks?navigator.locks.request(storeKey,run):run();}
async function browser21(path,body){const p=new URL(path,'https://folio.local'),id=body?.id||p.searchParams.get('id');return transaction21(x=>{const job=x.jobs.find(j=>j.id===id);
 if(p.pathname==='/api/request'){const notation=normalizeNotation(body.notation||'');rollText(notation,()=>1);const id='web21-'+body.id;if(!x.jobs.some(j=>j.id===id))x.jobs.push({...body,notation,id,roomId:OBR.room.id,confirmed:false,status:'queued',created:Date.now()});return {id};}
 if(p.pathname==='/api/work'){const worker=p.searchParams.get('worker'),room=p.searchParams.get('room'),jobs=x.jobs.filter(j=>j.roomId===room&&(j.status==='queued'||!j.confirmed&&['running','review'].includes(j.status)&&j.worker!==worker));for(const j of jobs){j.worker=worker;j.status='running';}return {jobs:structuredClone(jobs)};}
 if(!job)throw Error('掷骰草稿已失效，请重新打开');
 if(p.pathname==='/api/draft')return structuredClone(job);
 if(p.pathname==='/api/review-targets19'){job.targets19=body.targets19||[];return {ok:true};}
 if(p.pathname==='/api/review-open'){if(!job.confirmed&&['running','review'].includes(job.status))job.status='review';return {ok:true};}
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

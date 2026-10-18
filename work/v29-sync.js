/* Reacquire local session credentials after an EXE/bridge restart. Never read a room member's card. */
async function localFetch29(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{return await fetch(url,{...options,cache:'no-store',signal:controller.signal});}catch(e){if(e.name==='AbortError')throw Error('连接本机手札超时，请重试同步');throw e;}finally{clearTimeout(timer);}}
obrApi11=async function(path,body){for(let attempt=0;attempt<2;attempt++){
 if(!OBR11.token){const r=await localFetch29(OBR11.base+'/api/session');if(!r.ok)throw Error('本机手札服务尚未启动');const x=await r.json();if(x.app!=='adventurer-folio-owlbear')throw Error('本机端口不是旅人手札服务');OBR11.token=x.token;}
 const r=await localFetch29(OBR11.base+path,{method:body?'POST':'GET',headers:{'X-Folio-Token':OBR11.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),x=await r.json();if(r.status===403){OBR11.token='';if(attempt===0)continue;}if(!r.ok){const e=Error(x.error||'本机手札数据已更新');e.status=r.status;throw e;}
 if(path.startsWith('/api/inbox')&&Number(x.revision)<OBR11.revision&&!OBR11.sending){OBR11.revision=x.revision;OBR11.lastRaw='';queueOwl11();}return x;
 }};
let POLLING29=false,SYNC_QUEUE29=Promise.resolve();
const pollBefore29=owlPoll11;owlPoll11=async function(){if(POLLING29)return;POLLING29=true;try{return await pollBefore29();}finally{POLLING29=false;}};
async function publishManual29(id){
 try{const until=Date.now()+10000;while(OBR11.sending){if(Date.now()>until)throw Error('正在保存其他修改，请稍后再次同步');await new Promise(r=>setTimeout(r,40));}
  clearTimeout(OBR11.timer);OBR11.sending=true;let result,raw;
  try{for(let attempt=0;attempt<3;attempt++){const remote=await obrApi11('/api/state');raw=JSON.stringify(rawState10());try{result=await obrApi11('/api/state',{revision:remote.revision,raw,view:owlView11(),manualSync29:id});break;}catch(e){if(e.status!==409||attempt===2)throw e;}}
   OBR11.revision=result.revision;OBR11.lastRaw=raw;OBR11.error='';OBR11.dirty=raw!==JSON.stringify(rawState10());pendingBridge17(OBR11.dirty?OBR11.revision:null);
  }finally{OBR11.sending=false;updateOwlStatus11();if(OBR11.dirty)queueOwl11();}
 }catch(e){OBR11.error=e.message;updateOwlStatus11();await obrApi11('/api/manual-sync29-result',{id,error:e.message}).catch(()=>{});}
}
const commandBefore29=handleOwlCommand11;handleOwlCommand11=function(x){if(x.type==='manual-sync29'){SYNC_QUEUE29=SYNC_QUEUE29.catch(()=>{}).then(()=>publishManual29(x.id));return;}return commandBefore29(x);};
window.addEventListener('online',()=>{if(OBR11.enabled){OBR11.token='';void owlPoll11();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&OBR11.enabled)void owlPoll11();});

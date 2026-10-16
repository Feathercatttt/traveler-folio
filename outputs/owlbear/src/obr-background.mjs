import {bridgeAPI21 as api,asset21,connectLocal21,backgroundOwner21} from './obr-host21.mjs';
import {openWindow21,closeWindow21,installWindow21} from './obr-window21.mjs';
import {installTargets19,targetsForDraft19,clearTargets21} from './obr-targets19.mjs';
import {installTools19,updateToolsView19,initiativeResult19,diceEnabled19} from './obr-tools-background19.mjs';
import {ownDiceRoll19} from './obr-dice19.mjs';
import {installStatusHover18} from './obr-status-hover18.mjs';
import OBR from '@owlbear-rodeo/sdk';
import {syncMarked17} from './obr-marked-sync.mjs';
import {syncBoundTokens16,syncOtherCards19} from './obr-token-sync.mjs';
import {rollText,normalizeNotation} from './obr-roll-core.mjs';
const callbacks21=[];const onReady21=fn=>callbacks21.push(fn);
const SOURCE='local.adventurer-folio',worker=crypto.randomUUID(),seen=new Set();let token='',ready=false,diceReady=false,lastCheck=0;
async function hasDice(){const id=crypto.randomUUID();return new Promise(resolve=>{let done=false;const end=value=>{if(done)return;done=true;off();clearTimeout(timer);resolve(value);},off=OBR.broadcast.onMessage('dice-plus/isReady',e=>{if(e.data?.requestId===id&&e.data.ready===true)end(true);}),timer=setTimeout(()=>end(false),1200);OBR.broadcast.sendMessage('dice-plus/isReady',{requestId:id,timestamp:Date.now()},{destination:'LOCAL'}).catch(()=>end(false));});}
async function diceRoll(job){
 const playerId=await OBR.player.getId(),playerName=await OBR.player.getName();
 return new Promise((resolve,reject)=>{let finished=false;
  const finish=(error,value)=>{if(finished)return;finished=true;offResult();offError();clearTimeout(timer);error?reject(Error(error)):resolve(value);};
  const offResult=OBR.broadcast.onMessage(SOURCE+'/roll-result',e=>{const x=e.data;if(x?.rollId===job.id&&typeof x.result?.totalValue==='number')finish(null,{value:x.result.totalValue,summary:x.result.rollSummary||job.notation+' = '+x.result.totalValue,engine:'Dice+'});});
  const offError=OBR.broadcast.onMessage(SOURCE+'/roll-error',e=>{if(e.data?.rollId===job.id)finish(e.data.error||'Dice+ 掷骰失败');});
  const timer=setTimeout(()=>finish('Dice+ 未返回结果；本次不会自动重新掷骰，请检查枭熊记录。'),45000);
  OBR.broadcast.sendMessage('dice-plus/roll-request',{rollId:job.id,playerId,playerName,rollTarget:['self','everyone','dm','gm_only'].includes(job.audience)?job.audience:'self',diceNotation:job.notation,showResults:true,timestamp:Date.now(),source:SOURCE},{destination:'ALL'}).catch(err=>finish(err.message));
 });
}
async function execute(job){
 const key=job.id+':'+(job.confirmed?'final':'draft');if(seen.has(key))return;seen.add(key);let result;
 try{
  if(['roll','report'].includes(job.type)&&!job.confirmed){if(dismissed23.has(job.id)){void api('/api/cancel',{id:job.id}).catch(()=>{});return;}draftQueue19.push(job);void showDraft19();return;}
  if(job.type==='open-panel'){await OBR.action.open();result={ok:true,value:null,summary:'小卡已在枭熊展开',engine:'窗口'};}
  else if(job.type==='report'){await OBR.notification.show((job.actorName||'角色')+' · '+job.label+'：'+job.notation,'INFO');result={ok:true,value:null,summary:job.notation,engine:'数值'};}
  else{
   if(typeof job.notation!=='string'||job.notation.length>1000)throw Error('无效掷骰公式');
   job={...job,notation:normalizeNotation(job.notation)};rollText(job.notation,()=>1);
   if(diceEnabled19()&&(['auto','suite',undefined].includes(job.engine)||job.selectedTargets19?.length)){result={ok:true,...await rollTargets19(job)};await initiativeResult19(job,result);}
   else if(job.engine!=='text'&&await hasDice()){result={ok:true,...await diceRoll(job)};await OBR.notification.show((job.actorName||'角色')+' · '+job.label+'：'+result.summary,'INFO').catch(()=>{});}
   else{
    if(job.engine==='dice-plus')throw Error('Dice+ 未就绪，请在这个枭熊房间安装并启用 Dice+。');
    const x=rollText(job.notation);const privateNote=job.audience!=='self'?'（Dice+ 未加载，仅自己可见）':'';
    await OBR.notification.show((job.actorName||'角色')+' · '+job.label+'：'+x.summary+privateNote,'INFO');
    result={ok:true,value:x.value,summary:x.summary+(x.detail?' · '+x.detail:'')+privateNote,engine:'文字骰'};
   }
  }
 }catch(err){result={ok:false,error:String(err.message||err),engine:'错误'};try{await OBR.notification.show(result.error,'ERROR');}catch{}}
 if(result?.ok&&job.type==='roll'&&job.confirmed)await clearTargets21().catch(console.warn);
 try{await api('/api/result',{id:job.id,worker,...result});}catch{}
}
let polling=false;
async function tick(){
 if(!ready||polling)return;polling=true;
 try{diceReady=true;
  await api('/api/heartbeat',{worker,roomId:OBR.room.id,playerName:await OBR.player.getName(),diceReady});
  const x=await api('/api/work?worker='+encodeURIComponent(worker)+'&room='+encodeURIComponent(OBR.room.id));for(const job of x.jobs)execute(job);
 }catch{token='';}finally{polling=false;}
}
onReady21(()=>{ready=true;tick();});
setInterval(tick,1000);
let tokenRevision16=-1,tokenView16=null,tokenDirty16=true,tokenBusy16=false,tokenNotice16='';
async function tokenTick16(){if(!ready||tokenBusy16)return;tokenBusy16=true;try{const x=await api('/api/view?since='+tokenRevision16);if(x.view){tokenView16=x.view;updateToolsView19(x.view);tokenRevision16=x.revision;tokenDirty16=true;}if(tokenDirty16&&tokenView16){tokenDirty16=false;await syncBoundTokens16(tokenView16);await syncOtherCards19(tokenView16);await syncMarked17(tokenView16);}tokenNotice16='';}catch(err){tokenDirty16=true;const text=err.message||String(err);if(text!==tokenNotice16&&tokenView16){tokenNotice16=text;try{await OBR.notification.show('棋子同步：'+text,'WARNING');}catch{}}}finally{tokenBusy16=false;}}
onReady21(()=>{OBR.scene.items.onChange(()=>{tokenDirty16=true;});tokenTick16();});setInterval(tokenTick16,1200);

onReady21(()=>{installTools19(api).catch(console.error);installStatusHover18().catch(console.error);installTargets19().catch(console.error);});

const draftQueue19=[];let reviewing19=null,reviewPump19=false;
const dismissKey23='folio-dismissed23/'+OBR.room.id,dismissed23=new Set(JSON.parse(localStorage.getItem(dismissKey23)||'[]')),reviewChannel23=new BroadcastChannel('folio-review23');
reviewChannel23.onmessage=event=>{const id=event.data?.cancel;if(typeof id!=='string')return;dismissed23.add(id);localStorage.setItem(dismissKey23,JSON.stringify([...dismissed23].slice(-200)));for(let i=draftQueue19.length-1;i>=0;i--)if(draftQueue19[i].id===id)draftQueue19.splice(i,1);if(reviewing19?.id===id)reviewing19=null;void closeWindow21(SOURCE+'/review/'+id);void api('/api/cancel',{id}).catch(()=>{});};
async function showDraft19(){
 if(reviewPump19)return;reviewPump19=true;
 try{
  if(reviewing19){const active=reviewing19,state=await api('/api/draft?id='+encodeURIComponent(active.id));if(reviewing19!==active)return;
   if(state.confirmed||state.status==='done'||dismissed23.has(active.id)){await closeWindow21(SOURCE+'/review/'+active.id);reviewing19=null;}
   else if(active.opened23)return;
  }
  while(!reviewing19&&draftQueue19.length){const next=draftQueue19.shift();if(!dismissed23.has(next.id))reviewing19={...next,opened23:false};}
  const active=reviewing19;if(!active||active.opened23)return;
  await api('/api/review-targets19',{id:active.id,worker,targets19:await targetsForDraft19(active)});
  if(reviewing19!==active||dismissed23.has(active.id))return;
  await openWindow21(SOURCE+'/review/'+active.id,'roll.html?id='+encodeURIComponent(active.id),{width:420,height:650});
  if(reviewing19!==active||dismissed23.has(active.id)){await closeWindow21(SOURCE+'/review/'+active.id);return;}
  active.opened23=true;await api('/api/review-open',{id:active.id,worker});
 }catch(err){console.warn('读取掷骰草稿暂时失败，将自动重试：',err.message);}finally{reviewPump19=false;}
}

setInterval(()=>{if(reviewing19||draftQueue19.length)showDraft19();},500);

async function rollTargets19(job){const targets=job.selectedTargets19||[];if(!targets.length)return ownDiceRoll19(job);if(job.targetMode19!=='separate'){const result=await ownDiceRoll19({...job,label:job.label+' → '+targets.map(t=>t.name).join('、')});return {...result,summary:targets.map(t=>t.name+'：'+result.value).join('；')+' · '+result.summary};}const rows=[];for(let i=0;i<targets.length;i++){const target=targets[i];try{const r=await ownDiceRoll19({...job,id:job.id+'/target/'+i,notation:i===0?job.notation:job.otherNotation19||job.notation,label:job.label+' → '+target.name});rows.push({target:target.name,...r});}catch(err){if(!rows.length)throw err;rows.push({target:target.name,error:err.message});break;}}return {value:rows[0].value,summary:rows.map(r=>r.target+'：'+(r.error||r.summary)).join('；'),engine:'手札动画骰 · 各目标独立',targets19:rows};}

OBR.onReady(()=>backgroundOwner21(async()=>{for(const fn of callbacks21)await fn();}));

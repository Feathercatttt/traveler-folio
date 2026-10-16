import {installTargets19,targetsForDraft19} from './obr-targets19.mjs';
import {installTools19,updateToolsView19,initiativeResult19,diceEnabled19} from './obr-tools-background19.mjs';
import {ownDiceRoll19} from './obr-dice19.mjs';
import {installStatusHover18} from './obr-status-hover18.mjs';
import OBR from '@owlbear-rodeo/sdk';
import {syncMarked17} from './obr-marked-sync.mjs';
import {syncBoundTokens16,syncOtherCards19} from './obr-token-sync.mjs';
import {rollText,normalizeNotation} from './obr-roll-core.mjs';
const SOURCE='local.adventurer-folio',worker=crypto.randomUUID(),seen=new Set();let token='',ready=false,diceReady=false,lastCheck=0;
async function api(path,body){if(!token){const r=await fetch('/api/session');token=(await r.json()).token;}const r=await fetch(path,{method:body?'POST':'GET',headers:{'X-Folio-Token':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const x=await r.json();if(!r.ok)throw Error(x.error||'桥接不可用');return x;}
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
  if(['roll','report'].includes(job.type)&&!job.confirmed){draftQueue19.push(job);void showDraft19();return;}
  if(job.type==='open-panel'){await OBR.popover.open({id:SOURCE+'/sheet',url:'/panel.html',width:440,height:720,disableClickAway:true});result={ok:true,value:null,summary:'小卡已在枭熊展开',engine:'窗口'};}
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
OBR.onReady(()=>{ready=true;tick();});
setInterval(tick,1000);
let tokenRevision16=-1,tokenView16=null,tokenDirty16=true,tokenBusy16=false,tokenNotice16='';
async function tokenTick16(){if(!ready||tokenBusy16)return;tokenBusy16=true;try{const x=await api('/api/view?since='+tokenRevision16);if(x.view){tokenView16=x.view;updateToolsView19(x.view);tokenRevision16=x.revision;tokenDirty16=true;}if(tokenDirty16&&tokenView16){tokenDirty16=false;await syncBoundTokens16(tokenView16);await syncOtherCards19(tokenView16);await syncMarked17(tokenView16);}tokenNotice16='';}catch(err){tokenDirty16=true;const text=err.message||String(err);if(text!==tokenNotice16&&tokenView16){tokenNotice16=text;try{await OBR.notification.show('棋子同步：'+text,'WARNING');}catch{}}}finally{tokenBusy16=false;}}
OBR.onReady(()=>{OBR.scene.items.onChange(()=>{tokenDirty16=true;});tokenTick16();});setInterval(tokenTick16,1200);

OBR.onReady(()=>{installTools19(api).catch(console.error);installStatusHover18().catch(console.error);installTargets19().catch(console.error);});

const draftQueue19=[];let reviewing19=null,reviewPump19=false;
async function showDraft19(){if(reviewPump19)return;reviewPump19=true;try{if(reviewing19){const state=await api('/api/draft?id='+encodeURIComponent(reviewing19.id));if(!state.confirmed&&state.status!=='done')return;await OBR.popover.close(SOURCE+'/review/'+reviewing19.id).catch(()=>{});reviewing19=null;}if(!reviewing19&&draftQueue19.length){reviewing19=draftQueue19.shift();await api('/api/review-targets19',{id:reviewing19.id,worker,targets19:await targetsForDraft19(reviewing19)});await OBR.popover.open({id:SOURCE+'/review/'+reviewing19.id,url:'/roll.html?id='+encodeURIComponent(reviewing19.id),width:420,height:600,disableClickAway:true});await api('/api/review-open',{id:reviewing19.id,worker});}}catch(err){console.warn(err);}finally{reviewPump19=false;}}
setInterval(()=>{if(reviewing19||draftQueue19.length)showDraft19();},500);

async function rollTargets19(job){const targets=job.selectedTargets19||[];if(!targets.length)return ownDiceRoll19(job);if(job.targetMode19!=='separate'){const result=await ownDiceRoll19({...job,label:job.label+' → '+targets.map(t=>t.name).join('、')});return {...result,summary:targets.map(t=>t.name+'：'+result.value).join('；')+' · '+result.summary};}const rows=[];for(let i=0;i<targets.length;i++){const target=targets[i];try{const r=await ownDiceRoll19({...job,id:job.id+'/target/'+i,notation:i===0?job.notation:job.otherNotation19||job.notation,label:job.label+' → '+target.name});rows.push({target:target.name,...r});}catch(err){if(!rows.length)throw err;rows.push({target:target.name,error:err.message});break;}}return {value:rows[0].value,summary:rows.map(r=>r.target+'：'+(r.error||r.summary)).join('；'),engine:'手札动画骰 · 各目标独立',targets19:rows};}

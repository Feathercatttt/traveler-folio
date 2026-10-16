import {bridgeAPI21 as api,asset21,connectLocal21,backgroundOwner21} from './obr-host21.mjs';
import {openWindow21,installWindow21} from './obr-window21.mjs';
import {setMiniActor19} from './obr-targets19.mjs';
import OBRTools19,{subscribeToSfx,primeAudio19} from './obr-panel-tools19.mjs';
import {rollContext18,selectOnce18} from './obr-once-core.mjs';
import {bonusHTML17,installPanelExtras17,favoritesHTML17,checkSearchHTML17} from './obr-panel-extra.mjs';
import OBR from '@owlbear-rodeo/sdk';
import {bindSelected16,unbindActor16,actorBinding16} from './obr-token-sync.mjs';
let token='',revision=-1,view=null,actorId='main',tab='checks',ready=false,rooms=[],busy=false,history=[],lastVersion='',lastTab='';
const $=id=>document.getElementById(id),escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hpInputs14=new Map();
const prefs={engine:localStorage.getItem('folio-ob-engine')||'auto',audience:localStorage.getItem('folio-ob-audience')||'self'};
function notice(text){$('message').textContent=text;}
function actor(){return view?.actors.find(x=>x.id===actorId)||view?.actors[0];}
function rollButton(notation,label,report=false){return '<button class="roll" data-roll="'+escape(notation)+'" data-label="'+escape(label)+'" '+(report?'data-report="1"':'')+' title="填入枭熊草稿，确认后掷骰">'+escape(notation)+'</button>';}
function cardHTML(card){
 const a=actor();return '<article class="card"><div class="card-title"><strong>'+escape(card.name)+'</strong><span>'+escape(card.group)+'</span></div>'+(card.description?'<details><summary>描述</summary><p>'+escape(card.description)+'</p></details>':'')+card.formulas.map(f=>'<div class="formula"><small>'+escape(f.label)+'</small>'+rollButton(f.value,card.name+' · '+f.label,f.kind==='dc')+(f.note?'<small class="warning">'+escape(f.note)+'</small>':'')+'</div>').join('')+(card.weapon?'<div class="formula"><small>武器攻击</small>'+rollButton(card.weapon.attack,card.name+' · 攻击')+'<small>伤害</small>'+rollButton(card.weapon.damage,card.name+' · 伤害')+'</div>':'')+(card.options.length?'<details class="choices"><summary>可选择效果 · '+card.options.length+' 项</summary>'+card.options.map(o=>'<section class="choice '+(o.active?'active':'')+'"><div class="choice-head"><b>'+escape(o.name)+'</b><button data-command="option-toggle" data-card="'+escape(card.id)+'" data-option="'+escape(o.id)+'" '+(!card.attached?'disabled':'')+'>'+(o.active?'取消':'应用')+'</button></div><small>'+escape(o.scopeLabel)+'</small><p>'+escape(o.description)+'</p><small>'+escape(o.effects)+'</small>'+(o.formula?rollButton(o.formula,card.name+' · '+o.name):'')+'</section>').join('')+'</details>':'')+(card.type==='trait'&&card.attached&&a.kind==='character'?'<button class="quiet" data-command="trait-toggle" data-card="'+escape(card.id)+'" data-value="'+(card.paused?'true':'false')+'">'+(card.paused?'恢复特性':'暂停特性')+'</button>':'')+(card.concentration&&card.attached?'<button class="quiet" data-command="'+(a.concentration?.cardId===card.id?'end-concentration':'concentrate')+'" data-card="'+escape(card.id)+'">'+(a.concentration?.cardId===card.id?'结束专注':'开始专注')+'</button>':'')+'</article>';
}
function render(){
 const a=actor();if(a&&ready)setMiniActor19(view,a).catch(()=>{});const bindingCharacter16=view?.characterId;if(a&&ready)actorBinding16(view,a.id).then(item=>{if($('tokenStatus16')&&actor()?.id===a.id&&view?.characterId===bindingCharacter16)$('tokenStatus16').textContent=item?'已绑定：'+(item.name||'棋子'):'在地图选中棋子，再点绑定';}).catch(()=>{});if(!a){$('content').innerHTML='<div class="empty"><h2>等候你的角色卡</h2><p>打开电脑端 EXE 后会自动连接。若浏览器限制本机访问，让 DM 使用本地插件地址：http://localhost:17632/manifest.json。</p><button data-open-card>打开完整卡</button></div>';return;}
 for(const [key,value] of Object.entries(view.colors||{}))document.documentElement.style.setProperty('--'+key,value);
 $('actorName').textContent=a.name;$('health').textContent='HP '+a.hp+'/'+a.hpMax+(a.tempHp?' · 临时 '+a.tempHp:'')+' · '+(a.kind==='summon'?'召唤物':'角色');
 $('characters').innerHTML=view.characters.map(c=>'<option value="'+escape(c.id)+'" '+(view.characterId===c.id?'selected':'')+'>'+escape(c.name)+'</option>').join('');
 $('actors').innerHTML=view.actors.map((x,i)=>'<option value="'+escape(x.id)+'" '+(a.id===x.id?'selected':'')+'>'+escape(x.kind==='character'?'主卡':x.name+' #'+i)+'</option>').join('');
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));
 let html='';
 if(tab==='checks'){
  html='<div class="stats">'+[['AC',a.ac],['熟练',a.pb],['速度',a.speed]].map(([n,v])=>'<div><small>'+escape(n)+'</small><b>'+escape(v)+'</b></div>').join('')+'</div>'+'<div class="hp-actions14"><label for="hpAmount14">生命变动<input id="hpAmount14" type="number" inputmode="numeric" min="1" max="999999" step="1" placeholder="输入数值" value="'+escape(hpInputs14.get(a.id)||'')+'"></label><button data-health14="damage">受到伤害</button><button data-health14="heal">恢复生命</button></div><p class="muted">伤害先抵扣临时生命，再扣生命；恢复不超过上限。</p>'+'<p class="muted">'+escape(a.passive)+'</p><h2>攻击 / 伤害</h2>'+a.attacks.map(x=>'<div class="attack"><strong>'+escape(x.label)+'</strong><div>'+rollButton(x.attack,x.label+' · 攻击')+(x.damage?rollButton(x.damage,x.label+' · 伤害'):'')+'</div><small>'+escape(x.damageType||'')+'</small></div>').join('');
  for(const [title,rows] of [['属性检定',a.abilities],['技能',a.skills],['豁免',a.saves]])if(rows.length)html+='<details '+(title==='技能'||a.kind==='summon'?'open':'')+'><summary>'+title+'</summary><div class="check-list">'+rows.map(x=>'<div><button class="check-name14" data-roll="'+escape(x.formula)+'" data-label="'+escape(x.label+(title==='豁免'?'豁免':'检定'))+'">'+escape(x.label)+'</button>'+rollButton(x.formula,x.label+(title==='豁免'?'豁免':'检定'))+'</div>').join('')+'</div></details>';
  if(a.savesText)html+='<details open><summary>豁免与技能记录</summary><p>'+escape(a.savesText)+'</p></details>';
 }
 if(tab==='checks')html=checkSearchHTML17(a)+bonusHTML17(view,a)+html;
 if(tab==='favorites')html=favoritesHTML17(a,cardHTML);
 if(tab==='traits')html=a.cards.filter(c=>c.type==='trait').map(cardHTML).join('');
 if(tab==='formulas')html=a.cards.filter(c=>c.type!=='trait'||c.favorite&&c.formulas.length).map(cardHTML).join('');
 if(tab==='effects')html=(a.concentration?'<div class="concentration">已专注：'+escape(a.concentration.name)+' <button data-command="end-concentration">结束</button></div>':'')+a.statuses.map(s=>'<article class="card"><strong>'+escape(s.name)+'</strong><p>'+escape(s.effects)+'</p><small>'+escape(s.notes)+'</small><button data-command="status-toggle" data-status="'+escape(s.id)+'" data-value="'+(!s.active)+'">'+(s.active?'暂停':'启用')+'</button></article>').join('')+'<h2>生效来源</h2>'+a.sources.map(s=>'<p class="source">'+escape(s.label)+'<br><b>'+escape(s.target)+' '+(s.value>=0?'+':'')+s.value+'</b> · '+escape(s.reason)+'</p>').join('')+a.cards.filter(c=>c.options.length).map(cardHTML).join('');
 if(tab==='history')html=history.slice().reverse().map(r=>'<article class="card"><small>'+escape(r.actorName)+' · '+escape(r.label)+' · '+escape(r.engine)+'</small><p>'+escape(r.ok?r.summary:r.error)+'</p></article>').join('');
 const focusId=document.activeElement?.id,focused=['hpAmount14','bonusExpression17','bonusReason17','bonusTarget17','favoriteSearch17','checkSearch17'].includes(focusId),selection=focused?document.activeElement.value:null,caret=focused?document.activeElement.selectionStart:null;const content=$('content'),top=lastTab===tab?content.scrollTop:0,folds=lastTab===tab?[...content.querySelectorAll('details')].map(x=>x.open):[];content.innerHTML=html||'<p class="empty">暂时没有记录。</p>';content.querySelectorAll('details').forEach((x,i)=>{if(folds[i]!==undefined)x.open=folds[i]});content.scrollTop=top;lastTab=tab;if(focused&&$(focusId)){$(focusId).value=selection;$(focusId).focus();if(caret!==null&&$(focusId).setSelectionRange)$(focusId).setSelectionRange(caret,caret);}
}
async function refresh(){
 if(busy)return;busy=true;
 try{const x=await api('/api/view?since='+revision);rooms=x.rooms;history=x.results||[];if(x.view){view=x.view;revision=x.revision;render();}
  const room=rooms.find(r=>r.roomId===OBR.room.id)||rooms[0];$('connection').textContent=ready?(room?(room.diceReady?'枭熊已连接 · 公式确认后投骰':'枭熊已连接'):'等待本机手札连接'):'等待枭熊房间；此页可预览';
  const hist=JSON.stringify(history.map(x=>x.id));if(hist!==lastVersion){lastVersion=hist;if(tab==='history')render();const last=history.at(-1);if(last)notice((last.actorName||'')+' · '+(last.label||'掷骰')+'：'+(last.ok?last.summary:last.error));}
 }catch(err){notice(err.message);token='';}finally{busy=false;}
}
async function sendRoll(notation,label,report=false){
 try{const a=actor();await api('/api/request',{id:crypto.randomUUID(),type:report?'report':'roll',characterId:view.characterId,actorId:actor().id,once18:report?[]:selectOnce18(actor(),rollContext18(label)),notation,label,actorName:a.name,roomId:ready?OBR.room.id:'',...prefs});notice('已打开草稿：'+notation+'，确认后才掷骰');}
 catch(err){notice(err.message);}
}
document.addEventListener('click',async ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.tab){tab=b.dataset.tab;render();}
 if(b.hasAttribute('data-open-card')){try{await api('/api/command',{id:crypto.randomUUID(),type:'focus-main'});notice('已唤回电脑角色卡');}catch(err){notice('请先打开电脑端旅人手札EXE，插件会自动连接。');}return;}
 if(b.dataset.token16){if(!ready){notice('请在枭熊房间中使用棋子绑定');return;}b.disabled=true;try{if(b.dataset.token16==='bind'){const item=await bindSelected16(view,actor());$('tokenStatus16').textContent='已绑定：'+(item.name||'选中的棋子')+' · 使用 Stat Bubbles';notice('已绑定并同步HP、生命上限、临时生命和AC');}else{await unbindActor16(view,actor().id);$('tokenStatus16').textContent='已解除绑定；棋子现有数值保留';}}catch(err){notice(err.message);}finally{b.disabled=false;}return;}
 if(b.dataset.health14){const a=actor(),input=$('hpAmount14'),amount=Number(input.value);if(!Number.isInteger(amount)||amount<1||amount>999999){notice('请输入1～999999的整数');return;}b.disabled=true;try{await api('/api/command',{id:crypto.randomUUID(),type:'health-change',characterId:view.characterId,summonId:a.id,mode:b.dataset.health14,amount});notice((b.dataset.health14==='damage'?'伤害':'恢复')+' '+amount+' 已发送到主卡');hpInputs14.delete(a.id);input.value='';}catch(err){notice(err.message);}finally{b.disabled=false;}return;}
 if(b.dataset.roll)sendRoll(b.dataset.roll,b.dataset.label,!!b.dataset.report);
 if(b.dataset.command||b.dataset.hp){const a=actor();try{await api('/api/command',{id:crypto.randomUUID(),type:b.dataset.hp?'summon-hp':b.dataset.command,characterId:view.characterId,cardId:b.dataset.card,optionId:b.dataset.option,statusId:b.dataset.status,value:b.dataset.value==='true',summonId:a.id,delta:Number(b.dataset.hp)});notice('修改已发送到主卡');}catch(err){notice(err.message);}}
});
document.addEventListener('input',ev=>{if(ev.target.id==='hpAmount14')hpInputs14.set(actor().id,ev.target.value);});
$('actors').addEventListener('change',()=>{actorId=$('actors').value;render();});
$('characters').addEventListener('change',async()=>{try{await api('/api/command',{id:crypto.randomUUID(),type:'select-character',value:$('characters').value});actorId='main';}catch(err){notice(err.message);}});
$('engine').value=prefs.engine;$('audience').value=prefs.audience;
$('engine').addEventListener('change',()=>{prefs.engine=$('engine').value;localStorage.setItem('folio-ob-engine',prefs.engine);});
$('audience').addEventListener('change',()=>{prefs.audience=$('audience').value;localStorage.setItem('folio-ob-audience',prefs.audience);});
OBR.onReady(()=>{ready=true;render();refresh();});
refresh();setInterval(refresh,800);
installPanelExtras17({getView:()=>view,getActor:actor,api,notice,render,getTab:()=>tab,cardHTML});

OBRTools19();

// The mini card uses Owlbear's native action popover, so it can be pinned.
const size23=document.createElement('div');size23.className='mini-window23';size23.innerHTML='<button type="button" data-mini-size23="small" title="缩小速查卡" aria-label="缩小速查卡">−</button><button type="button" data-mini-size23="large" title="放大速查卡" aria-label="放大速查卡">＋</button><button type="button" data-mini-close23 title="关闭速查卡" aria-label="关闭速查卡">×</button>';document.querySelector('header').prepend(size23);
size23.onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;try{if(b.hasAttribute('data-mini-close23'))await OBR.action.close();else{const small=b.dataset.miniSize23==='small';await Promise.all([OBR.action.setWidth(small?360:520),OBR.action.setHeight(small?560:800)]);}}catch{notice('请使用枭熊原生窗口的关闭与固定按钮');}};

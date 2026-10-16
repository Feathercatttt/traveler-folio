/* Rest defaults are explicit exceptions, independent of the other recovery node. */
function usageClean(x){return {...usageCleanV133(x),longRestRecovery:x?.longRestRecovery!==false};}
function restSettings134(x={}){const s=x.rest134||{};return {hpRecovery:s.hpRecovery!==false,slotExclusions:[...new Set((Array.isArray(s.slotExclusions)?s.slotExclusions:[]).filter(v=>/^(shared|job-[012]|pact-[012])$/.test(v)))]};}
function normalizeV3Character(c,r={}){
 const out=normalizeV3CharacterV133(c,r);out.rest134=restSettings134(r);
 for(const x of out.counters){const original=r.counters?.find(v=>v?.id===x.id);x.longRestRecovery=original?.longRestRecovery!==false;}
 return out;
}
function usageForm(u={},prefix='usage-'){
 const x=usageClean(u);return usageFormV133(u,prefix).replace('</div><p class="form-help">','</div><label class="check-line rest134-exception"><input type="checkbox" name="'+e(prefix)+'no-long-rest" '+(!x.longRestRecovery?'checked':'')+'>长休不恢复此次数</label><p class="form-help">长休默认补满已启用的次数；下方设置的恢复时机也继续生效。</p><p class="form-help">');
}
function usageRead(f,prefix='usage-'){return {...usageReadV133(f,prefix),longRestRecovery:!f.has(prefix+'no-long-rest')};}
function editCounter(id,preset){
 editCounterV133(id,preset);const form=$('dialogForm'),actor=rawOf10(current()),ss=form?._session10;if(!form||!ss)return;
 const old=actor.counters.find(x=>x.id===id);
 form.querySelector('.dialog-body').insertAdjacentHTML('beforeend','<label class="check-line rest134-exception"><input type="checkbox" name="counter-no-long-rest" '+(old?.longRestRecovery===false?'checked':'')+'>长休不恢复此资源</label><p class="form-help">长休默认按此资源的重置方式恢复，其他恢复时机仍可照常触发。</p>');
 const original=dialogSubmit;dialogSubmit=f=>{original(f);const counter=actor.counters.find(x=>x.id===(id||ss.id));if(counter)counter.longRestRecovery=!f.has('counter-no-long-rest');save();render();};
}
function milestoneToolbar(){
 return milestoneToolbarV133().replace('按配置恢复次数、资源与环位','长休默认恢复生命、次数、资源与环位').replace('<div class="milestone-buttons">','<div class="milestone-buttons"><button data-action="rest134-settings">长休设置</button>');
}
function openRestSettings134(){
 const actor=current(),s=restSettings134(actor),pools=slotPools(actor);
 openDialog('长休恢复设置','<p class="form-help">长休默认恢复生命、所有环位和启用的次数。只有勾选了“不恢复”的项目会保留原值。特性、装备附属特性的次数与自定义资源，可在各自编辑页设置例外。</p><div class="rest134-settings"><label class="check-line"><input type="checkbox" name="rest134-no-hp" '+(!s.hpRecovery?'checked':'')+'>长休不恢复角色生命值</label>'+pools.map(p=>'<label class="check-line"><input type="checkbox" name="rest134-no-pool" value="'+e(p.id)+'" '+(s.slotExclusions.includes(p.id)?'checked':'')+'>长休不恢复：'+e(p.name)+'</label>').join('')+'</div>',cancel+submitButton('保存长休设置'),f=>{rawOf10(actor).rest134={hpRecovery:!f.has('rest134-no-hp'),slotExclusions:[...s.slotExclusions.filter(id=>!pools.some(p=>p.id===id)),...f.getAll('rest134-no-pool').filter(id=>pools.some(p=>p.id===id))]};$('editorDialog').close();save();render();toast('已保存长休恢复例外');});
}
function runMilestone(node){
 const c=current(),isLong=node==='long',s=restSettings134(c),name=MILESTONES.find(x=>x[0]===node)?.[1]||node;
 const items=useEntries(c).filter(x=>isLong?x.usage.longRestRecovery!==false:nodeMatches(x.usage.recovery,node));
 const counters=c.counters.filter(x=>isLong?x.longRestRecovery!==false:nodeMatches(x.recovery,node));
 const pools=slotPools(c).filter(x=>isLong?!s.slotExclusions.includes(x.id):nodeMatches(x.recovery,node));
 const reset=x=>{const max=counterLimit(x,c);return Math.max(x.min,Math.min(max===null?999999:max,x.resetMode==='zero'?0:x.resetMode==='value'?x.resetValue:max===null?x.current:max));};
 const changes=[...(isLong&&s.hpRecovery?['生命值：'+c.hp+' → '+hpLimit(c)]:[]),...items.map(x=>x.name+'：'+useValue(x.key,c).remaining+' → '+usageMax(x.usage,x.card,c)),...counters.map(x=>x.name+'：'+x.current+' → '+reset(x)),...pools.map(x=>x.name+'：恢复全部环位')];
 confirmAction(name+' · 恢复清单',changes.length?changes.join('\n'):'此节点没有可恢复的项目。',()=>{
  if(isLong&&s.hpRecovery)c.hp=hpLimit(c);
  for(const x of items)c.cardUses[x.key]=0;
  for(const x of counters)x.current=reset(x);
  for(const x of pools){if(x.profile)x.profile.pactSpent=0;else x.spent.fill(0);}
  c.eventLog.unshift({name,text:changes.join('\n')||'无数值恢复',time:new Date().toLocaleTimeString('zh-CN',{hour12:false})});c.eventLog=c.eventLog.slice(0,8);toast(name+'已处理');
 });
}
document.addEventListener('click',ev=>{if(!ev.target.closest('[data-action="rest134-settings"]'))return;ev.preventDefault();ev.stopImmediatePropagation();openRestSettings134();},true);

function useEntries(c=current()){
 const out=useEntriesV133(c),ids=new Set(out.map(x=>x.key));for(const entry of c.spells||[]){const card=cardById(entry.cardId);if(card?.usage?.enabled&&!ids.has(card.id)){out.push({key:card.id,card,name:card.name,usage:card.usage});ids.add(card.id);}}return out;
}
function restLabel134(recovery,enabled=true){
 let label=recovery==='manual'?'手动恢复':recoveryLabel(recovery)+'恢复';
 if(enabled)return ['long','either'].includes(recovery)?label:label+' · 长休恢复';
 if(recovery==='long')return '长休不恢复 · 可手动恢复';
 if(recovery==='either')return '短休恢复 · 长休不恢复';
 return label+' · 长休不恢复';
}
function usageWidget(key,compact=false){const x=useValue(key);return usageWidgetV133(key,compact).replace(/<small>[^<]*<\/small>/,()=>'<small>'+e(restLabel134(x.usage.recovery,x.usage.longRestRecovery!==false))+'</small>');}
function renderCounters(){
 const template=document.createElement('template');template.innerHTML=renderCountersV133();
 for(const box of template.content.querySelectorAll('.counter-box')){const id=box.querySelector('[data-counter]')?.dataset.counter,x=current().counters.find(x=>x.id===id),small=box.querySelector('small');if(!x||!small)continue;const reset=x.resetMode==='full'?'补满':x.resetMode==='zero'?'归零':'恢复至'+x.resetValue;small.textContent=restLabel134(x.recovery,x.longRestRecovery!==false)+' · '+reset;}
 return template.innerHTML;
}

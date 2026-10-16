/* v0.14: one roll path for the offline card and the Owlbear draft. */
function cardCost14(card){return [card?.spec?.action||card?.spec?.castingTime,card?.spec?.resourceCost].filter(Boolean).join('/');}
function attachedCard(card,quantity,prepared){
 const html=attachedCardV134(card,quantity,prepared);if(!card)return html;
 const t=document.createElement('template');t.innerHTML=html;const h=t.content.querySelector('.attached-head'),cost=cardCost14(card);if(h)h.insertAdjacentHTML('beforeend',costTags134(cost));const pill=t.content.querySelector('.attached-bottom>.pill');if(pill&&cost.split(/[/／\n]/).map(x=>x.trim()).includes(pill.textContent.trim())){if(card.cost&&card.cost!==pill.textContent)pill.textContent=card.cost;else pill.remove();}return t.innerHTML;
}
function renderLibrary(){renderLibraryV134();for(const el of document.querySelectorAll('#libraryCards .library-card')){const card=cardById(el.querySelector('[data-action="detail-card"]')?.dataset.id),h=el.querySelector('.card-title');if(card&&h)h.insertAdjacentHTML('beforeend',costTags134(cardCost14(card)));}}
function editCard(id,forcedType,draft){
 editCardV134(id,forcedType,draft);const body=$('editorDialog').querySelector('.dialog-body'),card=draft||cardById(id)||{},type=card.type||forcedType||libType;
 const summary=body.querySelector('[for="edit-cost"]');if(summary)summary.textContent='一句话摘要（可留空）';
 if(type!=='trait')return;
 // Keep legacy source text editable only when it exists; new cards use the single automated usage editor.
 const old=[];for(const key of ['uses','recharge']){const input=body.querySelector('[name="spec-'+key+'"]');if(!input)continue;const box=input.parentElement;if(input.value.trim())old.push(box);else box.hidden=true;}
 if(old.length){const d=document.createElement('details');d.className='editsection10 legacy14';d.innerHTML='<summary>原文次数补充<small class="section10-help">只保留旧卡的特殊文字；实际次数统一在“次数与恢复”设置</small></summary>';body.append(d);old.forEach(x=>d.append(x));}
 const action=body.querySelector('[name="spec-action"]'),cost=body.querySelector('[name="spec-resourceCost"]');if(action&&cost){const d=document.createElement('details');d.className='editsection10';d.innerHTML='<summary>行动与消耗标签<small class="section10-help">填写后显示在卡名旁；用 / 分开材料或其他消耗</small></summary><div class="form-grid"></div>';const grid=d.querySelector('.form-grid');grid.append(action.parentElement,cost.parentElement);body.querySelector('.editsection10')?.after(d);}
 const notes=body.querySelector('[name="automation-note9"]');if(notes)for(const p of body.querySelectorAll('p.form-help'))if(notes.value&&p.textContent.trim()===notes.value.trim())p.remove();
 for(const s of body.querySelectorAll('.effects-editor')){const h=s.querySelector('h3');if(h)h.textContent='常驻数值影响';const help=s.closest('details')?.querySelector('.section10-help');if(help)help.textContent='加入卡片后持续生效；点击应用的效果在“可选择效果”里设置';}
}
function healthChange14(hp,tempHp,max,amount,mode){
 if(!Number.isInteger(amount)||amount<=0||amount>999999||!['damage','heal'].includes(mode))throw Error('请输入 1～999999 的整数');
 hp=Math.max(0,Number(hp)||0);tempHp=Math.max(0,Number(tempHp)||0);max=Math.max(0,Number(max)||0);
 if(mode==='damage'){const absorbed=Math.min(tempHp,amount);return {hp:Math.max(0,hp-(amount-absorbed)),tempHp:tempHp-absorbed};}
 return {hp:Math.min(max,hp+amount),tempHp};
}
function handleOwlCommand11(x){
 if(x.type!=='health-change')return handleOwlCommand11V134(x);
 const c=state.characters.find(c=>c.id===x.characterId);if(!c)return;
 const s=x.summonId&&x.summonId!=='main'?c.summons.find(s=>s.id===x.summonId&&s.active!==false):null;if(x.summonId&&x.summonId!=='main'&&!s)return;
 try{const target=s||c,next=healthChange14(target.hp,target.tempHp,s?s.profile.hpMax:hpLimit(c),Number(x.amount),x.mode);target.hp=next.hp;target.tempHp=next.tempHp;save();render();}catch(err){toast(err.message);}
}
function localResult14(notation,label,actorName,report=false,doc=document){
 const result=FolioDice14.rollText(notation),old=doc.getElementById('rollResult14');if(old)old.remove();
 const box=doc.createElement('aside');box.id='rollResult14';box.className='roll-result14';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
 box.innerHTML='<button type="button" aria-label="关闭结果">×</button><small>'+e(actorName)+' · '+e(label)+'</small><strong>'+e(Number(result.value.toFixed(6)))+'</strong><span>'+e(result.summary)+'</span>'+(report?'':'<small>'+e(result.detail)+'</small>');box.querySelector('button').onclick=()=>box.remove();doc.body.append(box);setTimeout(()=>box.remove(),6000);return result;
}
async function requestOwl11(type,notation='',label='公式',actorName=current().name,doc=document){
 if(type==='open-panel')return requestOwl11V134(type,notation,label,actorName);
 try{
  const clean=FolioDice14.normalizeNotation(notation);FolioDice14.rollText(clean,()=>1);
  if(OBR11.enabled){
   let live;try{live=await obrApi11('/api/view?since='+OBR11.revision);OBR11.rooms=live.rooms||[];}catch{OBR11.rooms=[];}
   const room=OBR11.prefs.roomId?OBR11.rooms.find(r=>r.roomId===OBR11.prefs.roomId):OBR11.rooms.at(-1);
   if(room){
    // Once accepted, never retry locally: the user still has a final confirmation in Owlbear.
    try{await publishOwl11();await obrApi11('/api/request',{id:crypto.randomUUID(),type,notation:String(notation),label:String(label).slice(0,200),actorName,...OBR11.prefs,roomId:room.roomId});toast('已填入枭熊草稿：'+label+'；确认后掷骰');return {route:'owlbear'};}
    catch(err){toast('枭熊发送未确认：'+err.message+'。请检查草稿后重试。');return {route:'uncertain'};}
   }
  }
  localResult14(clean,label,actorName,type==='report',doc);return {route:'local'};
 }catch(err){toast(err.message);return {route:'error'};}
}
function stampRoll14(el,notation,label,report=false,actorName=''){
 el.dataset.owl11='1';el.dataset.owlNotation=String(notation);el.dataset.owlLabel=label;el.dataset.owlReport=report?'1':'';if(actorName)el.dataset.owlActor14=actorName;else delete el.dataset.owlActor14;
 el.classList.add('owl-roll11');if(el.tagName!=='BUTTON'){el.setAttribute('role','button');el.tabIndex=0;}el.title='点击检定；连接房间时填入枭熊草稿，否则本地显示结果';el.setAttribute('aria-label',label+'：'+notation);
}
function checkKey14(key){
 if(ABILITIES.some(x=>x[0]===key))return ['1d20'+signed(modStat(key).value),ABILITIES.find(x=>x[0]===key)[1]+'检定'];
 if(key.startsWith('skill-')){const k=key.slice(6);return ['1d20'+signed(skillStat(k).value),(SKILLS.find(x=>x[0]===k)?.[1]||k)+'检定'];}
 if(key.startsWith('save-')){const k=key.slice(5);return ['1d20'+signed(saveStat(k).value),(ABILITIES.find(x=>x[0]===k)?.[1]||k)+'豁免'];}
 if(['melee','ranged','spell'].includes(key))return ['1d20'+signed(attackStat(key).value),({melee:'近战攻击检定',ranged:'远程攻击检定',spell:'法术攻击检定'})[key]];
 if(key==='initiative')return ['1d20'+signed(calculated('initiative').value),'先攻检定'];
 return null;
}
function decorateOwl11(doc=document){
 decorateOwl11V134(doc);
 for(const el of doc.querySelectorAll('.card-formula strong,.summon-attack p b,.option10-formula,.f6-formula-line b')){
  const value=el.textContent.trim();if(!/\d/.test(value))continue;
  const root=el.closest('.attached-card,.library-card,.f6-card,.f6-formula-card,.summon-attack'),name=root?.querySelector('.attached-head h3,.card-title h3,.f6-card-head strong,.f6-row-heading strong')?.textContent?.trim()||'';
  const kind=el.closest('.card-formula')?.querySelector('small')?.textContent?.trim()||el.closest('.f6-formula-line')?.querySelector('span')?.textContent?.trim()||(el.closest('.summon-attack')?(el.closest('.summon-attack').querySelector('strong')?.textContent?.trim()||'召唤物')+' · '+(el.closest('p')?.querySelector('span')?.textContent?.includes('伤害')?'伤害检定':'攻击检定'):'')||'特性公式';
  const summon=el.closest('[data-summon-instance]')?summonById5(el.closest('[data-summon-instance]').dataset.summonInstance):doc!==document&&el.closest('.summon-attack')?floatSummon10():null;stampRoll14(el,value.replace(/^DC\s*/i,''),[name,kind].filter(Boolean).join(' · '),/^DC\s*/i.test(value),summon?.profile.name||'');
 }
 for(const [key,name] of ABILITIES){const label=doc.querySelector('#ability-'+key)?.closest('.ability')?.querySelector('label');if(label&&!label.querySelector('.check-name14')){const code=label.querySelector('.ability-code')?.outerHTML||'';label.innerHTML='<button type="button" class="check-name14" data-check14="'+key+'">'+name+'</button>'+code;}}
 // Names roll; values keep the existing provenance view. Use two sibling native buttons.
 for(const old of [...doc.querySelectorAll('.skill-row[data-action="breakdown"],.quick-saves [data-action="breakdown"],.quick-attacks [data-action="breakdown"],.f6-skills [data-float-action="breakdown"],.f6-attacks [data-float-action="breakdown"]')]){
  const key=old.dataset.key,roll=checkKey14(key);if(!roll)continue;const row=doc.createElement('div');row.className=old.className+' check-row14';row.dataset.key=key;const label=old.querySelector('span:not(.rank-mark)');const value=old.querySelector('strong,b');if(!label||!value)continue;
  row.innerHTML=old.innerHTML;const name=row.querySelector('span:not(.rank-mark)'),n=doc.createElement('button');n.type='button';n.className='check-name14';n.dataset.check14=key;n.innerHTML=name.innerHTML;name.replaceWith(n);
  const val=row.querySelector('strong,b'),b=doc.createElement('button');b.type='button';b.className='check-value14';if(old.dataset.floatAction)b.dataset.floatAction='breakdown';else b.dataset.action='breakdown';b.dataset.key=key;b.innerHTML=val.outerHTML;b.title='查看数值来源';val.replaceWith(b);old.replaceWith(row);
 }
 for(const el of doc.querySelectorAll('[data-check14]')){const r=checkKey14(el.dataset.check14);if(r)stampRoll14(el,r[0],r[1]);}
 for(const el of doc.querySelectorAll('.weapon-formula>div>strong')){const card=cardById(el.closest('.weapon-formula').querySelector('[data-action="weapon-info"]')?.dataset.id),purpose=el.parentElement.querySelector('span')?.textContent||'武器公式';stampRoll14(el,el.textContent.trim(),(card?.name||'武器')+' · '+purpose+'检定');}
 const summon=doc!==document?floatSummon10():null;
 if(summon)for(const row of doc.querySelectorAll('.f6-skills>div:not(.check-row14)')){const name=row.querySelector('span'),value=row.querySelector('strong');if(!name||!value)continue;stampRoll14(name,value.textContent.trim(),name.textContent.replace(/\s[-+\d].*$/,'')+'检定',false,summon.profile.name);}
 for(const host of doc.querySelectorAll('[data-summon-instance]')){const selected=summonById5(host.dataset.summonInstance);if(!selected)continue;host.querySelectorAll('.summon-abilities>div').forEach((row,i)=>{const [key,name]=ABILITIES[i]||[];if(key)stampRoll14(row.querySelector('small'),'1d20'+signed(Math.floor((selected.profile.abilities[key]-10)/2)),name+'检定',false,selected.profile.name);});}
 if(doc!==document&&!doc.defaultView._rollKeys14){doc.defaultView._rollKeys14=true;doc.defaultView.addEventListener('keydown',ev=>{if(ev.target.matches('.owl-roll11')&&['Enter',' '].includes(ev.key))owlClick11(ev);},true);}
 const init=doc.querySelector('.combat-grid [data-key="initiative"]')?.closest('.combat-cell')?.querySelector('label');if(init){init.dataset.check14='initiative';stampRoll14(init,...checkKey14('initiative'));}
}
function owlClick11(ev){
 const el=ev.target.closest('.owl-roll11,[data-action="owl-connect"],[data-action="owl-open"],[data-action="owl-disconnect"]');if(!el)return;
 if(el.dataset.action)return owlClick11V134(ev);
 const r=el.dataset.check14?checkKey14(el.dataset.check14):null;
 requestOwl11(el.dataset.owlReport?'report':'roll',r?.[0]||el.dataset.owlNotation,r?.[1]||el.dataset.owlLabel,el.dataset.owlActor14||current().name,el.ownerDocument);ev.preventDefault();ev.stopImmediatePropagation();
}

window.addEventListener('click',ev=>{const b=ev.target.closest('[data-action="resource"][data-key="hp"]');if(!b||Number(b.dataset.delta)>=0)return;const c=current(),next=healthChange14(c.hp,c.tempHp,hpLimit(c),Math.abs(Number(b.dataset.delta)),'damage');c.hp=next.hp;c.tempHp=next.tempHp;save();renderSheet();ev.preventDefault();ev.stopImmediatePropagation();},true);

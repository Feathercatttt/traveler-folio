/* Minimal summon actions and shared, manually described cost tags. */
function actionsClean134(rows){const ids=new Set();return (Array.isArray(rows)?rows:[]).slice(0,40).filter(x=>x&&typeof x==='object').map(x=>{let id=safe4id(x.id)?x.id:uid();if(ids.has(id))id=uid();ids.add(id);return {id,name:str4(x.name,120)||'未命名行动',cost:str4(x.cost,500),description:str4(x.description,5000)};});}
function summonProfile5(r={}){
 const p=summonProfile5V133(r),source=(Array.isArray(r.attacks)?r.attacks:[]).slice(0,40).filter(x=>x&&typeof x==='object');
 p.attacks.forEach((a,i)=>a.cost=str4(source[i]?.cost,500));p.actions=actionsClean134(r.actions);p.equipment28=cleanEntityEquipment28(r.equipment28);return p;
}
function costTags134(text){const tags=[...new Set(String(text||'').split(/[\/／\n]+/).map(x=>x.trim()).filter(Boolean))].slice(0,12);return tags.length?'<div class="cost134-tags">'+tags.map(t=>t.length>16?'<details class="cost134-tag cost134-long"><summary><span>'+e(t)+'</span></summary><span class="cost134-full">'+e(t)+'</span></details>':'<span class="cost134-tag">'+e(t)+'</span>').join('')+'</div>':'';}
function summonAttacks5(p,compact=false){
 const attacks=p.attacks||[],actions=p.actions||[];
 let html=attacks.length?'<div class="summon-attacks '+(compact?'summon-attacks-compact':'')+'">'+attacks.map(a=>{const f=summonAttack5(a,p);return '<div class="summon-attack"><div class="cost134-heading"><strong>'+e(a.name)+'</strong>'+costTags134(a.cost)+(a.range?'<small>'+e(a.range)+'</small>':'')+'</div><p><span>检定</span> <b>'+e(f.attack)+'</b></p><p><span>伤害</span> <b>'+e(f.damage)+'</b> '+e(a.damageType)+'</p>'+(!compact?'<small class="summon-formula-reason">'+e(f.reason)+'</small>'+(a.notes?'<p class="summon-attack-note">'+e(a.notes)+'</p>':''):'')+'</div>';}).join('')+'</div>':'';
 if(actions.length)html+='<section class="summon-actions134 '+(compact?'is-compact':'')+'"><h4>行动</h4>'+actions.map(a=>'<article class="summon-action134"><div class="cost134-heading"><strong>'+e(a.name)+'</strong>'+costTags134(a.cost)+'</div>'+(a.description?'<p>'+e(a.description)+'</p>':'')+'</article>').join('')+'</section>';
 return html||(!compact?'<p class="form-help">尚未设置攻击或行动，可在编辑卡片中添加。</p>':'');
}
function summonAttackRow5(a={}){
 const row=summonProfile5({attacks:[a]}).attacks[0];return summonAttackRow5V133(row).replace('</div><div class="summon-attack-auto">',field('消耗标签（用 / 分隔）','s5-attack-cost-'+row.id,row.cost,{wide:true,max:500})+'</div><div class="summon-attack-auto">');
}
function actionRow134(a={}){
 const x=actionsClean134([a])[0],pre='s134-action-';return '<details class="summon-action-editor134" data-summon-action-row="'+e(x.id)+'" open><summary><strong data-action134-title>'+e(a.name||'新行动')+'</strong><button type="button" class="icon-btn" data-action="action134-remove" aria-label="删除此行动卡">'+icon('trash')+'</button></summary><div class="form-grid">'+field('行动名称',pre+'name-'+x.id,a.name||'',{max:120,required:true})+field('消耗标签（用 / 分隔）',pre+'cost-'+x.id,x.cost,{max:500})+field('行动效果',pre+'description-'+x.id,x.description,{area:true,wide:true,rows:3,max:5000})+'</div></details>';
}
function summonReadProfile5(f){
 const p=summonReadProfile5V133(f);for(const a of p.attacks)a.cost=str4(f.get('s5-attack-cost-'+a.id),500);
 const rows=$('summonActionRows134');p.actions=rows?actionsClean134([...rows.querySelectorAll('[data-summon-action-row]')].map(row=>{const id=row.dataset.summonActionRow;return {id,name:f.get('s134-action-name-'+id),cost:f.get('s134-action-cost-'+id),description:f.get('s134-action-description-'+id)};})):actionsClean134(summonDraft5?.actions);return p;
}
function summonEditor5(id='',instance=false,example=false){
 summonEditor5V133(id,instance,example);const button=$('summonForm')?.querySelector('[data-action="summon-attack-add"]');if(!button)return;
 button.innerHTML=icon('plus')+'添加攻击';
 button.insertAdjacentHTML('afterend','<section class="summon-actions-editor134"><h3 class="form-section">行动卡</h3><p class="form-help">消耗用 / 分隔，例如：主要动作/银粉一份。</p><div id="summonActionRows134">'+(summonDraft5.actions||[]).map(actionRow134).join('')+'</div><button type="button" class="btn" data-action="action134-add">'+icon('plus')+'添加行动卡</button></section>');
 enhanceUniversal10(document);
}
function descriptor10(input,ss=session10(input)){
 const d=descriptor10V133(input,ss);if(!['summon','summon-instance'].includes(ss?.kind))return d;
 const owner=ss.id?'id:'+ss.id:'$owner',pp=ss.kind==='summon'?['summonCards',owner]:['characters','id:'+ss.actor,'summons',owner,'profile'];
 const action=input.closest('[data-summon-action-row]'),attack=input.closest('[data-summon-attack-row]');
 if(action){const id=action.dataset.summonActionRow;for(const key of ['name','cost','description'])if(input.name==='s134-action-'+key+'-'+id)return {...d,path:[...pp,'actions','id:'+id,key],mode:'text'};}
 if(attack&&input.name==='s5-attack-cost-'+attack.dataset.summonAttackRow)return {...d,path:[...pp,'attacks','id:'+attack.dataset.summonAttackRow,'cost'],mode:'text'};
 return d;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-action="action134-add"],[data-action="action134-remove"]');if(!b)return;ev.preventDefault();ev.stopImmediatePropagation();
 if(b.dataset.action==='action134-add'){const rows=$('summonActionRows134');if(rows.children.length>=40){$('summonError').textContent='每张召唤物卡最多40张行动卡。';return;}rows.insertAdjacentHTML('beforeend',actionRow134());enhanceUniversal10(document);rows.lastElementChild.querySelector('input').focus();}
 else b.closest('[data-summon-action-row]').remove();
},true);
document.addEventListener('input',ev=>{const row=ev.target.closest('[data-summon-action-row]');if(row&&ev.target.name.startsWith('s134-action-name-'))setText10(row.querySelector('[data-action134-title]'),ev.target.value||'新行动');});

function summonFullProfile5(p,instance=null){return summonFullProfile5V133(p,instance).replace('<h3 class="form-section">攻击方式</h3>','<h3 class="form-section">攻击与行动</h3>');}

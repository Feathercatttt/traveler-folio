/* Editable bonuses use the existing @ resolver, persistence and live calculations. */
const SUMMON_TARGETS17=new Set(['str','dex','con','int','wis','cha','ac','hpMax','speed','proficiency','attack-all','damage-all']);
const MARK_ICONS17=new Map();
function bonusClean17(raw={}){return {target:['str','dex','con','int','wis','cha','ac','hpMax','speed','proficiency','attack-all','damage-all'].includes(raw.target)?raw.target:'attack-all',value:n3(raw.value),reason:str4(raw.reason,400)};}
function summonInstance5(r={}){return {...summonInstance5V16(r),quickTemp17:bonusClean17(r.quickTemp17)};}
function normalizeV3Character(c,r={}){const out=normalizeV3CharacterV16(c,r);for(const s of out.statuses){const original=r.statuses?.find(x=>x.id===s.id);s.color=/^#[a-f0-9]{6}$/i.test(original?.color||'')?original.color:'#6c4b2b';}return out;}
function summonOptionEffects10(c,s,target=null){const out=summonOptionEffects10V16(c,s,target),q=s.quickTemp17;if(q&&(q.value||rawState10().dataLinks10[pathKey10(['characters','id:'+c.id,'summons','id:'+s.id,'quickTemp17','value'])])&&(target===null||q.target===target))out.push({id:'summon-quick17',target:q.target,value:q.value,scale:'flat',reason:q.reason,source:q.reason||'召唤物临时加成',__path10:['characters','id:'+c.id,'summons','id:'+s.id,'quickTemp17','value']});return out;}
function bonusTargetRows17(c,s=null){return targets().filter(([key])=>!s||SUMMON_TARGETS17.has(key));}
function setActorBonus17(x){
 const c=state.characters.find(c=>c.id===x.characterId);if(!c)return;const s=x.summonId&&x.summonId!=='main'?c.summons.find(s=>s.id===x.summonId):null;if(x.summonId&&x.summonId!=='main'&&!s)return;
 const rows=bonusTargetRows17(c,s);if(!rows.some(([key])=>key===x.target))throw Error('临时加成的影响项目无效');
 const expression=String(x.expression??'').trim();if(expression.length>1000)throw Error('公式过长');const value=expression?numericLink8(expression,{__actor10:c,__number10:true},c):0;
 const path=['characters','id:'+c.id,...(s?['summons','id:'+s.id,'quickTemp17']:['quickTemp'])],raw=rawOf10(s||c),field=s?'quickTemp17':'quickTemp';clearBindings10(path);
 raw[field]={target:x.target,value:expression&&!Number.isFinite(Number(expression))?0:value,reason:str4(x.reason,400)};
 if(expression&&!Number.isFinite(Number(expression))){const p=[...path,'value'];rawState10().dataLinks10[pathKey10(p)]={path:p,mode:'number',expression,template:expression,label:'临时加成',gain:1,min:null,max:null,integer:false};}
 invalidateDerived16();save();render();
}
function handleOwlCommand11(x){if(x.type==='quick-bonus-set'){try{setActorBonus17(x);}catch(err){toast(err.message);}return;}return handleOwlCommand11V16(x);}
function markIcon17(key){
 if(MARK_ICONS17.has(key))return MARK_ICONS17.get(key);const source=document.getElementById('i-'+key)||document.getElementById('i-spark'),commands=[];if(!source)return commands;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.style.cssText='position:absolute;width:24px;height:24px;left:-9999px;opacity:0;pointer-events:none';for(const child of source.children)svg.append(child.cloneNode(true));document.body.append(svg);
 for(const node of svg.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect'))try{const length=node.getTotalLength(),steps=Math.min(240,Math.max(1,Math.ceil(length*2)));let previous=null;for(let i=0;i<=steps;i++){const p=node.getPointAtLength(length*i/steps);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;commands.push([!previous||Math.hypot(p.x-previous.x,p.y-previous.y)>3?0:1,Number(p.x.toFixed(3)),Number(p.y.toFixed(3))]);previous=p;}}catch{}svg.remove();MARK_ICONS17.set(key,commands);return commands;
}
function mapStatus17(id,name,iconName='spark',color='#6c4b2b'){return {id:String(id),name:String(name).slice(0,120),icon:iconName,color:/^#[a-f0-9]{6}$/i.test(color)?color:'#6c4b2b',iconCommands:markIcon17(iconName)};}
function owlActor11(c,s=null){
 const actor=owlActor11V16(c,s),path=['characters','id:'+c.id,...(s?['summons','id:'+s.id,'quickTemp17']:['quickTemp'])],q=(s?.quickTemp17||c.quickTemp),record=rawState10().dataLinks10[pathKey10([...path,'value'])];
 actor.quickBonus17={target:q?.target||'attack-all',expression:record?.template||record?.expression||String(rawOf10(q||{}).value||0),value:Number(q?.value||0),reason:q?.reason||'',targets:bonusTargetRows17(c,s)};
 actor.references17=linkDefinitions8({__actor10:c,__number10:true,...(s?{__profile10:s.profile}:{})},c).flatMap(r=>{try{const value=Number(r.get());return Number.isFinite(value)?[{key:r.key,label:r.label,aliases:r.aliases||[],value}]:[];}catch{return [];}}).slice(0,300);
 actor.mapStatuses17=s?[]:c.statuses.filter(x=>x.active).map(x=>mapStatus17(x.id,x.name,x.icon,x.color));
 if(s){const seen=new Set();for(const fx of summonOptionEffects10V16(c,rawOf10(s))){if(seen.has(fx.key))continue;seen.add(fx.key);const card=cardById(fx.key?.split(':')[0]);actor.mapStatuses17.push(mapStatus17('option:'+fx.key,fx.source,card?.icon||'spark'));}}
 if(q?.value)actor.mapStatuses17.push(mapStatus17('quick17',q.reason||'临时加成','spark'));
 if(!s&&c.concentration)actor.mapStatuses17.push(mapStatus17('concentration17','专注 · '+c.concentration.name,'eye','#365e53'));
 actor.statuses=actor.statuses.map(x=>({...x,color:c.statuses.find(s=>s.id===x.id)?.color||'#6c4b2b',icon:c.statuses.find(s=>s.id===x.id)?.icon||'spark'}));return actor;
}
function editStatus(id,draft){editStatusV16(id,draft);const old=id?current().statuses.find(x=>x.id===id):draft,color=old?.color||'#6c4b2b',form=$('dialogForm'),before=new Set(current().statuses.map(x=>x.id)),submit=dialogSubmit;form.querySelector('.dialog-body').insertAdjacentHTML('beforeend','<label class="status-color17">地图状态背景<input type="color" name="status-color17" value="'+e(color)+'"><small>同步到棋子时保留实色底板，文字和图标自动使用对比色。</small></label>');dialogSubmit=f=>{const color=String(f.get('status-color17')||'#6c4b2b');submit(f);const status=id?current().statuses.find(x=>x.id===id):current().statuses.find(x=>!before.has(x.id));if(status){status.color=color;save();render();}};}

// Entity equipment is evaluated independently from player inventory and live HP.
export const entitySlots28=[['head','头盔'],['body','衣服 / 护甲'],['belt','腰带'],['legs','裤子'],['feet','鞋子'],...Array.from({length:5},(_,i)=>['acc'+(i+1),'饰品'+(i+1)]),['mainhand','主手武器'],['offhand','副手 / 盾牌']];
export function equipmentAllowed28(card,slot){const g=card?.gear;if(g?.kind==='weapon')return slot==='mainhand'||slot==='offhand'&&!g.twoHanded;if(g?.kind!=='equipment')return false;return g.category==='shield'?slot==='offhand':g.slot?.startsWith('acc')?slot.startsWith('acc'):g.slot===slot;}
export function cleanLoadout28(raw={},items=[]){
 const slots={},used=new Set();for(const [slot] of entitySlots28){const id=raw.slots?.[slot],row=items.find(x=>x.id===id&&x.qty>0);if(row&&!used.has(id)&&equipmentAllowed28(row.card,slot)){slots[slot]=id;used.add(id);}}
 const main=items.find(x=>x.id===slots.mainhand);if(main?.card.gear?.twoHanded)delete slots.offhand;
 return {enabled:raw.enabled===true,autoAC:raw.autoAC!==false,slots};
}
const number28=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function equipmentStats28(base,loadout,items,evaluate){
 const data={...base,abilities:{...base.abilities}},parts=[],warnings=[],bonuses=Object.create(null);
 if(!loadout?.enabled)return {data,parts,warnings,bonuses,weapons:[]};
 const rows=[...new Set(Object.values(cleanLoadout28(loadout,items).slots))].map(id=>items.find(x=>x.id===id)).filter(Boolean);
 const value=(raw,owner,label,expression)=>{try{const n=evaluate(expression||raw,owner);if(!Number.isFinite(n))throw Error('需要固定数值');return n;}catch(e){warnings.push(label+'：'+e.message);return 0;}};
 for(const row of rows){const c=row.card;for(const [prefix,fxs] of [['effects',Array.isArray(c.effects)?c.effects:[]],...(Array.isArray(c.features)?c.features:[]).filter(f=>f.active!==false).map(f=>['features/'+f.id+'/effects',Array.isArray(f.effects)?f.effects:[]])])for(const fx of fxs){
  const expr=c.expressions28?.[prefix+'/'+fx.id+'/value']||fx.expression;
  const n=value(fx.value,base,c.name,expr)*(fx.scale==='level'||fx.scale==='job'?number28(base.level,1):fx.scale==='pb'?number28(base.pb,2):1);
  bonuses[fx.target]=(bonuses[fx.target]||0)+n;if(n)parts.push({label:c.name+(fx.reason?' · '+fx.reason:''),target:fx.target,value:n});
 }}
 for(const k of Object.keys(data.abilities))data.abilities[k]=number28(data.abilities[k],10)+(bonuses[k]||0);
 data.pb=Math.max(0,number28(base.pb,2)+(bonuses.proficiency||0));
 const hpKey=Object.hasOwn(base,'hpMax')?'hpMax':'hp';data[hpKey]=Math.max(1,number28(base[hpKey],10)+(bonuses.hpMax||0));
 data.dc=number28(base.dc,10)+(bonuses['spell-dc']||0);data.initiative=number28(base.initiative,Math.floor((number28(base.abilities?.dex,10)-10)/2))+Math.floor((data.abilities.dex-10)/2)-Math.floor((number28(base.abilities?.dex,10)-10)/2)+(bonuses.initiative||0);
 if(typeof base.speed==='number')data.speed=base.speed+(bonuses.speed||0);else if(bonuses.speed)data.speed=String(base.speed||'').replace(/\d+(?:\.\d+)?/,n=>String(Math.max(0,Number(n)+bonuses.speed)));
 let ac=number28(base.ac,10),bases=[],extra=0;const dex=Math.floor((data.abilities.dex-10)/2);
 for(const {card:c} of rows){const g=c.gear||{},read=k=>value(g[k],data,c.name,c.expressions28?.['gear/'+k]);if(loadout.autoAC!==false&&g.acMode==='base')bases.push({value:read('acBase')+(g.dexMode==='full'?dex:g.dexMode==='cap2'?Math.min(2,dex):0),name:c.name});if(loadout.autoAC!==false&&g.acMode!=='none'&&(g.acBonus||c.expressions28?.['gear/acBonus'])){const n=read('acBonus');extra+=n;parts.push({label:c.name,target:'ac',value:n});}}
 if(bases.length){const best=bases.reduce((a,b)=>a.value>=b.value?a:b);ac=best.value;parts.unshift({label:best.name+' · 护甲基础',target:'ac-base',value:ac});}
 data.ac=Math.max(0,ac+extra+(bonuses.ac||0));
 const weapons=rows.filter(r=>r.card.gear?.kind==='weapon').map(({id,card:c})=>{const g=c.gear,ability=g.ability&&g.ability!=='auto'?g.ability:g.finesse?(data.abilities.dex>data.abilities.str?'dex':'str'):g.attackStyle==='ranged'?'dex':'str',mod=Math.floor((number28(data.abilities[ability],10)-10)/2),kind=g.attackStyle||'melee';const read=k=>value(g[k],data,c.name,c.expressions28?.['gear/'+k]),formula=raw=>{try{return evaluate(raw,data,'formula');}catch(e){warnings.push(c.name+'：'+e.message);return String(raw);}};return {id,cardId:c.id,name:c.name,attack:mod+data.pb+read('attackBonus')+(bonuses['attack-all']||0)+(bonuses['attack-'+kind]||0),damage:g.specialDamage?'':formula(g.damage||'1d6')+'+'+(mod+read('damageBonus')+(bonuses['damage-all']||0)+(bonuses['damage-'+kind]||0))+(g.extraDamage?'+'+formula(g.extraDamage):''),damageType:g.damageType||''};});
 return {data,parts,warnings:[...new Set(warnings)],bonuses,weapons};
}

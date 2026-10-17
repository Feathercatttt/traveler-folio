// The same formulas are used by offline monster sheets and map instances.
export function monsterCardFormulas23(card,m){
 const rows=(card.formulas||[]).map(f=>({...f})),g=card.gear;if(g?.kind!=='weapon')return rows;
 const equipped=(m.equipmentWeapons28||[]).find(x=>x.cardId&&x.cardId===card.id);if(equipped){if(!rows.some(f=>f.kind==='attack'))rows.unshift({kind:'attack',label:'武器攻击（含熟练）',expression:'1d20'+(equipped.attack>=0?'+':'')+equipped.attack});if(equipped.damage&&!rows.some(f=>f.kind==='damage'))rows.push({kind:'damage',label:'武器伤害'+(g.damageType?' · '+g.damageType:''),expression:equipped.damage});return rows;}
 const names={str:'力量',dex:'敏捷',con:'体质',int:'智力',wis:'感知',cha:'魅力'};
 const ability=g.ability&&g.ability!=='auto'?g.ability:g.finesse?(Number(m.abilities?.dex)>Number(m.abilities?.str)?'dex':'str'):g.attackStyle==='ranged'?'dex':'str',attr='@'+(names[ability]||'力量')+'调整';
 const bonuses=m.equipmentBonuses28||{},hit=(bonuses['attack-all']||0)+(bonuses['attack-'+(g.attackStyle||'melee')]||0),damage=(bonuses['damage-all']||0)+(bonuses['damage-'+(g.attackStyle||'melee')]||0);
 if(!rows.some(f=>f.kind==='attack'))rows.unshift({kind:'attack',label:'武器攻击（含熟练）',expression:'1d20+'+attr+'+@熟练'+(Number(g.attackBonus)||hit?'+'+(Number(g.attackBonus||0)+hit):'')});
 if(!g.specialDamage&&!rows.some(f=>f.kind==='damage'))rows.push({kind:'damage',label:'武器伤害'+(g.damageType?' · '+g.damageType:''),expression:(g.damage||'1d6')+'+'+attr+(Number(g.damageBonus)||damage?'+'+(Number(g.damageBonus||0)+damage):'')+(g.extraDamage?'+'+g.extraDamage:'')});
 return rows;
}

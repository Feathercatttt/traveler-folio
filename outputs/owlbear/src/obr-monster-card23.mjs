// The same formulas are used by offline monster sheets and map instances.
export function monsterCardFormulas23(card,m){
 const rows=(card.formulas||[]).map(f=>({...f})),g=card.gear;if(g?.kind!=='weapon')return rows;
 const names={str:'力量',dex:'敏捷',con:'体质',int:'智力',wis:'感知',cha:'魅力'};
 const ability=g.ability&&g.ability!=='auto'?g.ability:g.finesse?(Number(m.abilities?.dex)>Number(m.abilities?.str)?'dex':'str'):g.attackStyle==='ranged'?'dex':'str',attr='@'+(names[ability]||'力量')+'调整';
 if(!rows.some(f=>f.kind==='attack'))rows.unshift({kind:'attack',label:'武器攻击（含熟练）',expression:'1d20+'+attr+'+@熟练'+(Number(g.attackBonus)?'+'+Number(g.attackBonus):'')});
 if(!g.specialDamage&&!rows.some(f=>f.kind==='damage'))rows.push({kind:'damage',label:'武器伤害'+(g.damageType?' · '+g.damageType:''),expression:(g.damage||'1d6')+'+'+attr+(Number(g.damageBonus)?'+'+Number(g.damageBonus):'')+(g.extraDamage?'+'+g.extraDamage:'')});
 return rows;
}

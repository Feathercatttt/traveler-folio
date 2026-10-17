import {NS19,STAT19,esc19 as e,num19,owns19} from './obr-tools-model19.mjs';

const button=(label,action,attrs='',cls='')=>`<button type="button" class="btn ${cls}" data-action19="${action}" ${attrs}>${label}</button>`;

export function initiativeHTML21({s,me,party,items,bar,reorder,picked,btn=button}){
 const gm=me.role==='GM',expanded=localStorage.getItem(NS19+'/init-expanded')!=='0';
 const rows=s.entries.filter(r=>gm||!r.hidden),phase=s.active?'战斗中':s.preparing?'准备中':'待命';
 if(!expanded)return `<div class="suite-init21 collapsed"><button class="pill-btn" data-action19="init-expand" aria-label="展开先攻追踪">⚔ ${s.active?`第 ${s.round} 轮`:s.preparing?'准备中':'先攻'}</button></div>`;
 const collapse='<button class="collapse-btn" data-action19="init-collapse" aria-label="折叠先攻栏" title="折叠">⌄</button>';
 let controls='';
 if(!s.active&&!s.preparing){
  controls=gm?button('战斗准备','initiative-prepare','','btn-prepare')+button('突袭','initiative-ambush','','btn-ambush')+button('清空列表','initiative-reset','','btn-clear'):'';
 }else if(s.preparing){
  controls=gm?button('开始战斗','initiative-start','','btn-start')+button('取消准备','initiative-cancel','','btn-cancel'):'<span class="state-pill">等待 DM 开始战斗</span>';
 }else{
  controls=gm?button('上一回合','initiative-prev','','btn-prev')+button('下一回合','initiative-next','data-turn19="'+e(s.turn||0)+'"','btn-next')+button('结束战斗','initiative-stop','','btn-end'):'';
 }
 const mode=localStorage.getItem(NS19+'/init-display')||'raw';
 const header=`<div class="hbar-row hbar-row-controls"><div class="hbar-cluster">${collapse}<strong class="initiative-phase">${s.active?`第 ${s.round||1} 轮 · `:''}${phase}</strong>${controls}${gm?button('占位符','placeholder','','btn-ghost'):''}<label class="init-display-mode">显示<select id="initDisplay21"><option value="raw" ${mode==='raw'?'selected':''}>原骰点</option><option value="final" ${mode==='final'?'selected':''}>最终值</option></select></label></div></div>`;
 const list=rows.map(r=>{
  const t=items.find(i=>i.id===r.tokenId),can=gm||(!s.active&&!!t&&owns19(t,me)),active=s.active&&s.current===r.id;
  const owner=[me,...party].find(p=>p.id===r.ownerId),color=/^#[0-9a-f]{6}$/i.test(owner?.color||'')?owner.color:'#f5a623';
  const stats=t?.metadata?.[STAT19],ratio=stats&&Number.isFinite(Number(stats.health))&&Number.isFinite(Number(stats['max health']))&&Number(stats['max health'])>0&&(gm||owns19(t,me)||!stats.hide)?Math.max(0,Math.min(1,num19(stats.health)/Math.max(1,num19(stats['max health'])))):null;
  const raw=r.total===null||r.total===undefined?'':Math.round(r.total-r.bonus),shown=mode==='raw'?raw:(r.total===null||r.total===undefined?'':Math.round(r.total));
  const end=active&&!gm&&t&&owns19(t,me)?'<button class="end-turn-btn" data-action19="initiative-next" data-entry19="'+e(r.id)+'" data-turn19="'+e(s.turn||0)+'">结束回合</button>':'';
  return `<div class="initiative-item ${active?'active':''} ${s.preparing?'preparing':''} ${r.hidden?'is-invisible':''} ${picked===r.id?'picked21':''}" data-entry19="${e(r.id)}" data-token19="${e(r.tokenId||'')}" data-can-menu25="${can?'1':'0'}" style="--owner-color:${color}" title="${e(r.name)} · 点击定位，右键先攻菜单"><button class="item-img" data-action19="initiative-focus" data-entry19="${e(r.id)}" data-token19="${e(r.tokenId||'')}" aria-label="定位 ${e(r.name)}">${t?.image?.url?`<img src="${e(t.image.url)}" alt="" draggable="false" loading="lazy">`:`<span class="item-img-placeholder">${e(r.name[0]||'?')}</span>`}</button>${ratio===null?'':`<div class="item-hp-track" role="meter" aria-label="${e(r.name)} 生命值" aria-valuemin="0" aria-valuemax="${e(stats['max health'])}" aria-valuenow="${e(stats.health)}" title="HP ${e(stats.health)} / ${e(stats['max health'])}"><div class="item-hp-fill" style="width:${ratio*100}%"></div></div>`}<label class="item-count ${can?'':'locked'} ${mode==='final'?'show-final':''}" title="${mode==='raw'?'原始骰点数':'最终先攻值'}"><input aria-label="${e(r.name)} ${mode==='raw'?'原骰点':'最终先攻'}" type="number" inputmode="numeric" value="${e(shown)}" placeholder="—" ${can?'':'disabled'} ${mode==='raw'?`data-init-raw21="${e(r.id)}"`:`data-init-total19="${e(r.id)}"`}>${mode==='final'&&r.total!==null&&r.total!==undefined?`<small class="count-formula">(${Math.round(r.total-r.bonus)}${r.bonus>=0?'+':''}${r.bonus})</small>`:''}</label>${end}</div>`;
 }).join('');
 const empty=rows.length?'':`<div class="empty-state"><div class="empty-icon">⚔</div><div class="empty-text">没有加入先攻的角色</div><div class="empty-hint">右键 token 并选择“加入旅人先攻”</div></div>`;
 return `<div class="suite-init21 ${bar?'is-bar':''} ${s.preparing?'state-preparing':''} ${s.active?'state-combat':''}"><div class="app-hbar">${header}<div class="hbar-row hbar-row-items"><div class="initiative-list" aria-label="先攻顺序">${list}${empty}</div></div></div></div>`;
}

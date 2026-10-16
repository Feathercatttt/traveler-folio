export const NS19='local.adventurer-folio/tools19',INIT19=NS19+'/initiative',SET19=NS19+'/settings',STAGE19=NS19+'/stage',STOP19=NS19+'/stop',PORT19=NS19+'/portal',PORTRAIT19=NS19+'/portrait',ROLL19=NS19+'/dice',CMD19=NS19+'/command',VITAL19=NS19+'/vitals';
export const BIND19='local.adventurer-folio/binding',STAT19='com.owlbear-rodeo-bubbles-extension/metadata';
export const defaults19={bestiary:true,dice:true,initiative:true,search:true,viewport:true,portals:true,theatre:true,hp:true,turnCamera:true};
export const num19=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;
export const clamp19=(x,min,max)=>Math.min(max,Math.max(min,num19(x)));
export function owns19(item,player){return player?.role==='GM'||!!player&&!!item&&(item.metadata?.[BIND19]?.playerId===player.id||item.metadata?.[PORTRAIT19]?.ownerId===player.id||item.createdUserId===player.id);}
export function initiativeBonus19(item){const b=item?.metadata?.[BIND19];return b?num19(b.initiative19):num19(item?.metadata?.[NS19+'/monster']?.initiative);}
export function initiativeEntry19(item){const b=item.metadata?.[BIND19];return {id:item.id,tokenId:item.id,name:(b?.name19||item.name||'未命名').slice(0,80),bonus:initiativeBonus19(item),override:false,total:null,ownerId:b?.playerId||item.createdUserId||'',hidden:item.visible===false};}
export function sortInitiative19(entries){return [...entries].sort((a,b)=>(b.total??-1e6)-(a.total??-1e6)||b.bonus-a.bonus||a.id.localeCompare(b.id));}
export function nextTurn19(state){if(!state.active||!state.entries.length)return state;const at=state.entries.findIndex(x=>x.id===state.current),i=(at+1)%state.entries.length;return {...state,current:state.entries[i].id,round:(state.round||1)+(i===0?1:0),turn:(state.turn||0)+1};}
export function hpAfter19(stats,amount,mode){if(!Number.isInteger(amount)||amount<1||amount>999999)throw Error('请输入 1～999999 的整数');const hp=Math.max(0,num19(stats.health)),temp=Math.max(0,num19(stats['temporary health'])),max=Math.max(0,num19(stats['max health'],hp));return mode==='heal'?{...stats,health:Math.min(max,hp+amount)}:{...stats,health:Math.max(0,hp-Math.max(0,amount-temp)),'temporary health':Math.max(0,temp-amount)};}
export const insidePortal19=(point,p)=>Math.hypot(point.x-p.position.x,point.y-p.position.y)<=p.metadata[PORT19].radius;
export const safeMedia19=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!['localhost','127.0.0.1'].includes(u.hostname)?u.href:'';}catch{return '';}};
export const esc19=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function previousTurn21(state){if(!state.active||!state.entries.length)return state;const at=state.entries.findIndex(x=>x.id===state.current),i=(at-1+state.entries.length)%state.entries.length;return {...state,current:state.entries[i].id,round:Math.max(1,(state.round||1)-(at===0?1:0)),turn:(state.turn||0)+1};}
export function reorderInitiative21(entries,from,to,swap=false){const rows=entries.map(r=>({...r})),a=rows.findIndex(r=>r.id===from),b=rows.findIndex(r=>r.id===to);if(a<0||b<0||a===b)return rows;if(swap)[rows[a],rows[b]]=[rows[b],rows[a]];else{const [r]=rows.splice(a,1);rows.splice(b,0,r);}return rows;}

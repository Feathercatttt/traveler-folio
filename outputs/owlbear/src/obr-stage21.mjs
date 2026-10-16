import {safeMedia19} from './obr-tools-model19.mjs';
export const filters21=[['none','原色'],['memory','回忆'],['noir','黑白'],['ghost','幽魂'],['warm','暖光'],['dream','梦境'],['rain','雨幕'],['glitch','失真']];
export const effects21=[['none','无'],['ghost','幽魂'],['silhouette','剪影'],['memory','回忆'],['fire','焰光'],['hologram','全息'],['glitch','失真'],['ice','冰霜']];
const choose=(rows,key)=>rows.some(r=>r[0]===key)?key:'none';
export const canStage21=(c,p)=>p?.role==='GM'||!!c&&(c.ownerId===p?.id||c.controllers?.includes(p?.id));
export function stageState21(raw){return {live:!!raw?.live,filter:choose(filters21,raw?.filter),roster21:Array.isArray(raw?.roster21)?raw.roster21:[]};}
export function stageCommand21(raw,x,sender){const s=structuredClone(stageState21(raw)),gm=sender.role==='GM',c=s.roster21.find(r=>r.id===x.performerId),requireGM=()=>{if(!gm)throw Error('只有 DM 可以编辑演出名单与分享权限');};
 if(x.type==='stage-live'){requireGM();s.live=x.active===true;}
 else if(x.type==='stage-filter'){requireGM();s.filter=choose(filters21,x.filter);}
 else if(x.type==='stage-create'){if(s.roster21.length>=24)throw Error('演出名单最多 24 位');s.roster21.push({id:crypto.randomUUID(),name:String(x.name||'演出角色').slice(0,60),ownerId:sender.id,controllers:[],enabled:gm,visible:false,expression:0,effect:'none',expressions:[]});}
 else{if(!c)throw Error('该演出角色已删除');if(!canStage21(c,sender))throw Error('DM 尚未将此演出角色分享给你');
  if(x.type==='stage-delete'){requireGM();s.roster21=s.roster21.filter(r=>r!==c);}
  else if(x.type==='stage-enable'){requireGM();c.enabled=x.enabled===true;if(!c.enabled)c.visible=false;}
  else if(x.type==='stage-share'){requireGM();c.controllers=[...new Set((x.controllers||[]).filter(v=>typeof v==='string').map(v=>v.slice(0,100)))].slice(0,24);}
  else if(x.type==='stage-edit'){if(!gm&&c.ownerId!==sender.id)throw Error('只有 DM 或创建者可以修改立绘资料');if(x.name!==undefined)c.name=String(x.name||'演出角色').slice(0,60);if(x.expressions){c.expressions=x.expressions.slice(0,12).map(r=>({name:String(r.name||'默认').slice(0,40),url:safeMedia19(r.url)})).filter(r=>r.url&&r.url.length<=2048);c.expression=Math.min(c.expression,c.expressions.length-1);if(!c.expressions.length)c.visible=false;}}
  else if(x.type==='stage-enter'){if(!s.live||!c.enabled)throw Error('等待 DM 勾选角色并开启直播');if(!c.expressions.length)throw Error('先为角色设置立绘');if(!c.visible&&s.roster21.filter(r=>r.visible).length>=8)throw Error('舞台最多同时显示 8 位角色');c.visible=true;}
  else if(x.type==='stage-leave')c.visible=false;
  else if(x.type==='stage-position'){
   if(!s.live||!c.enabled||!c.visible)throw Error('只能移动直播中正在显示的立绘');
   if(!Number.isFinite(x.position?.x)||!Number.isFinite(x.position?.y))throw Error('立绘位置无效');
   c.position23={x:Math.max(.04,Math.min(.96,x.position.x)),y:Math.max(.12,Math.min(1,x.position.y))};if(x.scale24!==undefined){if(!Number.isFinite(x.scale24))throw Error('立绘缩放无效');c.scale24=Math.max(.25,Math.min(2.5,x.scale24));}
  }
  else if(x.type==='stage-expression'){if(Number.isInteger(x.index)&&x.index>=0&&x.index<c.expressions.length)c.expression=x.index;if(x.effect!==undefined)c.effect=choose(effects21,x.effect);}
  else if(x.type==='stage-move'){requireGM();const at=s.roster21.indexOf(c),to=Math.max(0,Math.min(s.roster21.length-1,at+(x.direction===-1?-1:1)));s.roster21.splice(at,1);s.roster21.splice(to,0,c);}
  else throw Error('未知演出操作');
 }
 if(new TextEncoder().encode(JSON.stringify(s)).length>55000)throw Error('立绘资料过大，请减少差分或缩短图片地址');return s;
}

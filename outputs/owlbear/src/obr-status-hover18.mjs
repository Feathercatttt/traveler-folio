import {asset21} from './obr-host21.mjs';
import OBR from '@owlbear-rodeo/sdk';
const OWN='local.adventurer-folio/marked-status',TOOL='local.adventurer-folio/status-query18',MODE=TOOL+'/mode',POP=TOOL+'/tooltip';
export function hoveredStatus18(items,position,target=null){if(target?.metadata?.[OWN]?.tooltip18&&target.visible!==false)return target;return items.find(item=>{const m=item.metadata?.[OWN];return m?.role==='background'&&m.tooltip18&&item.visible!==false&&position.x>=item.position.x&&position.y>=item.position.y&&position.x<=item.position.x+(m.width18||0)&&position.y<=item.position.y+(m.height18||0);})||null;}
export async function installStatusHover18(){let items=await OBR.scene.items.getItems().catch(()=>[]),shown='',timer=null,serial=0;OBR.scene.items.onChange(x=>{items=x;});
 const close=async()=>{clearTimeout(timer);serial++;if(shown){shown='';await OBR.popover.close(POP).catch(()=>{});}};
 const display=async(event,sticky=false)=>{const item=hoveredStatus18(items,event.pointerPosition,event.target);if(!item){if(!sticky)await close();return true;}if(item.id===shown)return false;const generation=++serial;clearTimeout(timer);timer=setTimeout(async()=>{if(generation!==serial)return;try{const point=await OBR.viewport.transformPoint(event.pointerPosition);if(generation!==serial)return;shown=item.id;await OBR.popover.open({id:POP,url:asset21('status18.html?id=')+encodeURIComponent(item.id),width:340,height:250,anchorPosition:{left:point.x+16,top:point.y+18},anchorReference:'POSITION',anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},disableClickAway:false});}catch{shown='';}},sticky?0:220);return false;};
 await OBR.tool.create({id:TOOL,icons:[{icon:asset21('icon.svg'),label:'手札 · 状态速查'}],defaultMode:MODE});
 await OBR.tool.createMode({id:MODE,icons:[{icon:asset21('icon.svg'),label:'悬停状态标记查看影响，手机轻点'}],cursors:[{cursor:'help'}],onToolMove:(_,ev)=>display(ev),onToolClick:(_,ev)=>display(ev,true),onDeactivate:close});
 return ()=>OBR.tool.activateTool(TOOL);
}
export async function activateStatusHover18(){await OBR.tool.activateTool(TOOL);}

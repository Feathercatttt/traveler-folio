import OBR,{buildPath,buildText} from '@owlbear-rodeo/sdk';
import {BINDING16} from './obr-token-sync.mjs';

// Interoperability contract observed in Marked! 1.81's published renderer.
// Only Folio-owned map labels are managed; room configuration and manual marks are untouched.
export const MARKED17='com.battle-system.mark',OWNED17='local.adventurer-folio/marked-status';
const own=(item,view,playerId)=>{const x=item.metadata?.[OWNED17];return x?.installationId===view.installationId&&x.playerId===playerId&&x.characterId===view.characterId;};
function signature17(value){let h=2166136261;for(const c of JSON.stringify(value)){h=Math.imul(h^c.charCodeAt(0),16777619);}return (h>>>0).toString(16);}
function foreground(color){const n=parseInt(color.slice(1),16),values=[n>>16,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*values[0]+.7152*values[1]+.0722*values[2]>.35?'#201a14':'#fff9eb';}
function safeCommands(value){return Array.isArray(value)?value.slice(0,2500).filter(p=>Array.isArray(p)&&[0,1].includes(p[0])&&p.length===3&&p.slice(1).every(n=>Number.isFinite(n)&&Math.abs(n)<1000)):[];}
function measure(name,font){if(typeof document!=='undefined'){const ctx=document.createElement('canvas').getContext('2d');if(ctx){ctx.font='700 '+font+'px "Microsoft YaHei",sans-serif';return ctx.measureText(name).width;}}return [...name].reduce((n,c)=>n+(c.charCodeAt(0)>255?font:font*.62),0);}
function makeLabel(view,actor,token,status,place,anchor,dpi,playerId,signature){
 const size=Math.max(18,Math.min(30,dpi*.24)),height=size+18,iconSize=size+2,text=String(status.name||'状态').slice(0,120),width=Math.ceil(measure(text,size))+iconSize+34,color=/^#[a-f0-9]{6}$/i.test(status.color||'')?status.color:'#6c4b2b',ink=foreground(color),position={x:anchor.x-width/2,y:anchor.y-(height+8)*(place+1)},combo=token.id+'-folio17-'+status.id;
 const common={[MARKED17+'/place']:place,[MARKED17+'/comboid']:combo,[MARKED17+'/direction']:601};
 const meta=role=>({...common,[OWNED17]:{installationId:view.installationId,characterId:view.characterId,playerId,actorId:actor.id,statusId:status.id,tokenId:token.id,role,signature,tooltip18:{name:text,lines:(status.lines18||[]).slice(0,60)},width18:width,height18:height}});
 const background=buildPath().name(text).commands([[0,0,0],[1,width,0],[1,width,height],[1,0,height],[5]]).position(position).fillColor(color).fillOpacity(.96).strokeColor(ink).strokeWidth(1.5).strokeOpacity(.85).metadata(meta('background')).attachedTo(token.id).disableAttachmentBehavior(['ROTATION','SCALE']).locked(true).disableHit(true).visible(token.visible!==false).build();
 const textItem=buildText().name(text).plainText(text).textType('PLAIN').fontFamily('Microsoft YaHei').fontSize(size).fontWeight(700).fillColor(ink).fillOpacity(1).strokeWidth(0).position({x:position.x+iconSize+22,y:position.y+7}).metadata(meta('text')).attachedTo(background.id).disableAttachmentBehavior(['ROTATION','SCALE']).locked(true).disableHit(true).visible(token.visible!==false).build();
 const commands=safeCommands(status.iconCommands);const glyph=buildPath().name(text+' · '+(status.icon||'spark')).commands(commands.length?commands:[[0,12,2],[1,15,9],[1,22,12],[1,15,15],[1,12,22],[1,9,15],[1,2,12],[1,9,9],[1,12,2]]).position({x:position.x+10,y:position.y+8}).scale({x:iconSize/24,y:iconSize/24}).fillOpacity(0).strokeColor(ink).strokeOpacity(1).strokeWidth(1.9).metadata(meta('icon')).attachedTo(background.id).disableAttachmentBehavior(['ROTATION']).locked(true).disableHit(true).visible(token.visible!==false).build();
 return [background,textItem,glyph];
}
export async function syncMarked17(view){
 if(!view?.installationId||!view.actors)return 0;if(OBR.scene.isReady&&!await OBR.scene.isReady())return 0;
 const playerId=await OBR.player.getId(),items=await OBR.scene.items.getItems(),managed=items.filter(i=>own(i,view,playerId)),actors=new Map(view.actors.map(a=>[a.id,a]));
 const tokens=items.filter(i=>{const b=i.metadata?.[BINDING16];return i.type==='IMAGE'&&b?.installationId===view.installationId&&b.playerId===playerId&&b.characterId===view.characterId&&actors.has(b.actorId);});
 const wanted=new Set(),add=[],remove=new Set(),updates=new Map(),dpi=await OBR.scene.grid.getDpi();
 for(const token of tokens){
  const actor=actors.get(token.metadata[BINDING16].actorId),statuses=(actor.mapStatuses17||[]).filter(s=>s?.id&&s.name).slice(0,100),occupied=new Set(items.filter(i=>i.type==='PATH'&&i.attachedTo===token.id&&i.metadata?.[MARKED17+'/direction']===601&&!own(i,view,playerId)).map(i=>i.metadata[MARKED17+'/place']));
  if(!statuses.length)continue;const bounds=await OBR.scene.items.getItemBounds([token.id]),anchor={x:(bounds.min.x+bounds.max.x)/2,y:bounds.min.y};
  for(const status of statuses){let place=0;while(occupied.has(place))place++;occupied.add(place);const key=token.id+'|'+status.id;wanted.add(key);
   const existing=managed.filter(i=>i.metadata[OWNED17].tokenId===token.id&&i.metadata[OWNED17].statusId===status.id),roles=new Map(existing.map(i=>[i.metadata[OWNED17].role,i]));
   const signature=signature17([status,place,anchor,dpi,token.visible!==false]);if(existing.length===3&&['background','text','icon'].every(r=>roles.has(r))&&roles.get('background').metadata[OWNED17].signature===signature)continue;
   const desired=makeLabel(view,actor,token,status,place,anchor,dpi,playerId,signature);
   if(existing.length===3&&['background','text','icon'].every(r=>roles.has(r))){const oldRoot=roles.get('background').id;for(const row of desired){const role=row.metadata[OWNED17].role;row.id=roles.get(role).id;if(role!=='background')row.attachedTo=oldRoot;updates.set(row.id,row);}}
   else{existing.forEach(i=>remove.add(i.id));add.push(...desired);}
  }
 }
 for(const item of managed){const m=item.metadata[OWNED17];if(!wanted.has(m.tokenId+'|'+m.statusId))remove.add(item.id);}
 if(remove.size)await OBR.scene.items.deleteItems([...remove]);
 if(updates.size)await OBR.scene.items.updateItems([...updates.keys()],draft=>{for(const row of draft){const next=updates.get(row.id);if(next&&own(row,view,playerId))Object.assign(row,next);}});
 if(add.length)await OBR.scene.items.addItems(add);
 return remove.size+updates.size+add.length;
}

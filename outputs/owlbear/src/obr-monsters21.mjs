import OBR,{buildImage,buildImageUpload} from '@owlbear-rodeo/sdk';
import {NS19,STAT19,BIND19,safeMedia19} from './obr-tools-model19.mjs';
import {monsterCardFormulas23} from './obr-monster-card23.mjs';
const imageKey=NS19+'/monster-images';
const images=()=>{try{return JSON.parse(localStorage.getItem(imageKey)||'{}');}catch{return {};}};
export function monsterCards23(m){return (m.cards23||[]).map(row=>{const c=row.card;return {name:c.name,description:c.description,cost:c.cost,kind:c.type,qty:row.qty,formulas:monsterCardFormulas23(c,m)};});}
export function cachedMonsterImage21(id){const saved=images()[id];return saved?.asset27&&safeMedia19(saved.image?.url)?saved:null;}
const pending25=new Map();
// Only an ImageDownload selected through Owlbear may enter the shared scene.
// uploadImages returns void; the official image picker supplies the shared asset URL.
export async function prepareMonster21(m){
 if(!m)throw Error('怪物模板不存在');
 if(await OBR.player.getRole()!=='GM')throw Error('怪物放置由 DM 管理');
 const hash=m.portrait?[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(m.portrait)))].map(b=>b.toString(16).padStart(2,'0')).join(''):'';
 const k=m.id+':'+hash;if(pending25.has(k))return pending25.get(k);
 const job=(async()=>{
  const saved=cachedMonsterImage21(m.id);if(saved?.portraitHash25===hash)return saved;
  if(m.portrait){
   const response=await fetch(m.portrait);if(!response.ok)throw Error('图鉴立绘读取失败，请重新上传立绘');
   const blob=await response.blob();if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(blob.type)||blob.size>20*1024*1024)throw Error('立绘需为 20 MB 以内的常见图片');
   const bitmap=await createImageBitmap(blob),width=bitmap.width,height=bitmap.height;bitmap.close();
   const file=new File([await blob.arrayBuffer()],(m.name||'怪物')+'.'+({'image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif'}[blob.type]||'png'),{type:blob.type});
   await OBR.assets.uploadImages([buildImageUpload(file).name(m.name).dpi(Math.max(width,height)).offset({x:width/2,y:height/2}).plainText(m.name).build()],'CHARACTER');
  }
  const picked=await OBR.assets.downloadImages(false,m.name,'CHARACTER');if(!picked.length)return null;
  const image=picked[0];if(!safeMedia19(image.image?.url))throw Error('请选择枭熊图片库中的已上传图片，不能使用本机或内嵌图片地址');
  const result={...image,asset27:true,portraitHash25:hash},cache=images();delete cache[m.id];cache[m.id]=result;const keys=Object.keys(cache);while(keys.length>40)delete cache[keys.shift()];try{localStorage.setItem(imageKey,JSON.stringify(cache));}catch{}return result;
 })().finally(()=>pending25.delete(k));pending25.set(k,job);return job;
}
export function monsterName25(name,items){const base=String(name||'怪物').trim().slice(0,72),used=new Set(items.map(i=>i.name));let n=items.some(i=>i.name===base)?2:1;while(used.has(base+' '+n))n++;return base+' '+n;}
export async function placeMonster25(m,image,position){const place=async()=>{const items=await OBR.scene.items.getItems(),name=monsterName25(m.name,items),item=monsterItem21({...m,name},image,position);item.metadata[NS19+'/monster'].templateName25=m.name;await OBR.scene.items.addItems([item]);return item;};return navigator.locks? navigator.locks.request(NS19+'/monster-spawn25/'+OBR.room.id,place):place();}
export async function overwriteMonster27(m){
 if(await OBR.player.getRole()!=='GM')throw Error('怪物覆盖由 DM 管理');
 const ids=await OBR.player.getSelection();if(ids?.length!==1)throw Error('请先在地图上只选中一个要覆盖的 token');
 const items=await OBR.scene.items.getItems(),target=items.find(i=>i.id===ids[0]);
 if(target?.type!=='IMAGE')throw Error('请选择一个图片 token');
 if(target.metadata?.[BIND19])throw Error('这个 token 已绑定玩家角色卡，请先解除绑定再覆盖怪物数据');
 const name=monsterName25(m.name,items.filter(i=>i.id!==target.id)),template=monsterItem21({...m,name},{image:target.image,grid:target.grid},target.position);
 await OBR.scene.items.updateItems([target.id],draft=>{const d=draft[0];if(!d||d.metadata?.[BIND19])throw Error('token 已变化，请重新选择');d.name=name;if(d.text){d.text.plainText=name;d.text.type='PLAIN';d.text.richText=[{type:'paragraph',children:[{text:name}]}];}
  d.metadata[STAT19]={...(d.metadata[STAT19]||{}),...template.metadata[STAT19],hide:d.metadata[STAT19]?.hide??false};d.metadata[NS19+'/monster']={...template.metadata[NS19+'/monster'],templateName25:m.name};
 });return {...target,name};
}
export function monsterItem21(m,image,position){return buildImage(image.image,image.grid).name(m.name).plainText(m.name).layer('CHARACTER').position(position).scale(image.scale||{x:1,y:1}).metadata({[STAT19]:{health:m.hp,'max health':m.hp,'temporary health':0,'armor class':m.ac,hide:true},[NS19+'/monster']:{templateId:m.id,cards23:monsterCards23(m),dc:m.dc,initiative:m.initiative,name:m.name,species:m.species,category:m.category,level:m.level,actions:structuredClone(m.actions||[]),spells:structuredClone(m.spells||[]),abilities:structuredClone(m.abilities||{}),pb:m.pb,speed:m.speed,saves:m.saves,skills:m.skills,senses:m.senses,languages:m.languages,resistances:m.resistances,immunities:m.immunities,vulnerabilities:m.vulnerabilities,description:m.description}}).build();}
export function installMonsterDrag21(getMonster,notice){let drag=null;
 const cleanup=async(cancel=false)=>{const d=drag;if(!d)return;drag=null;clearTimeout(d.timer);if(d.starting)await d.starting.catch(()=>{});try{if(d.interaction){d.interaction[1]();if(!cancel&&d.outside){d.point=await OBR.viewport.inverseTransformPoint({x:d.origin.x+d.client.x,y:d.origin.y+d.client.y});const placed=await placeMonster25(d.m,d.image,d.point);notice('已放置 '+placed.name+'，生命值独立记录');}}}finally{try{d.el.releasePointerCapture(d.pointer);}catch{}}};
 document.addEventListener('pointerdown',ev=>{const el=ev.target.closest('[data-monster-drag21]');if(!el||ev.button!==0)return;const m=getMonster(el.dataset.monsterDrag21),image=m&&cachedMonsterImage21(m.id);if(!image){if(m)notice('请先点击“上传枭熊并放置”，之后可拖动已上传立绘');return;}ev.preventDefault();el.setPointerCapture(ev.pointerId);drag={el,m,image,pointer:ev.pointerId,sx:ev.clientX,sy:ev.clientY,client:{x:ev.clientX,y:ev.clientY},outside:false};drag.preparing=Promise.resolve(image);drag.timer=setTimeout(()=>cleanup(true),25000);});
 document.addEventListener('pointermove',async ev=>{const d=drag;if(!d)return;d.client={x:ev.clientX,y:ev.clientY};d.outside=ev.clientX<0||ev.clientY<0||ev.clientX>innerWidth||ev.clientY>innerHeight;if(!d.interaction&&!d.starting&&Math.hypot(ev.clientX-d.sx,ev.clientY-d.sy)>7){d.starting=(async()=>{d.image=await d.preparing;if(!d.image||drag!==d)return;let geo={x:16,y:64};try{geo=JSON.parse(localStorage.getItem('folio-window21/'+new URLSearchParams(location.search).get('_win21')))||geo;}catch{}d.origin=geo;d.point=await OBR.viewport.inverseTransformPoint({x:geo.x+ev.clientX,y:geo.y+ev.clientY});d.item=monsterItem21(d.m,d.image,d.point);d.interaction=await OBR.interaction.startItemInteraction(d.item);})();await d.starting.catch(e=>{notice(e.message);cleanup(true);});}if(d.interaction&&drag===d){d.point=await OBR.viewport.inverseTransformPoint({x:d.origin.x+ev.clientX,y:d.origin.y+ev.clientY});d.interaction[0](item=>{item.position=d.point;});}});
 document.addEventListener('pointerup',ev=>{if(drag){drag.client={x:ev.clientX,y:ev.clientY};drag.outside=ev.clientX<0||ev.clientY<0||ev.clientX>innerWidth||ev.clientY>innerHeight;}cleanup().catch(e=>notice(e.message));});document.addEventListener('pointercancel',()=>cleanup(true));document.addEventListener('keydown',ev=>{if(ev.key==='Escape')cleanup(true);});addEventListener('pagehide',()=>{drag?.interaction?.[1]();});
}

import OBR,{buildImage,buildImageUpload} from '@owlbear-rodeo/sdk';
import {NS19,STAT19} from './obr-tools-model19.mjs';
import {monsterCardFormulas23} from './obr-monster-card23.mjs';
const imageKey=NS19+'/monster-images';
const images=()=>{try{return JSON.parse(localStorage.getItem(imageKey)||'{}');}catch{return {};}};
export function monsterCards23(m){return (m.cards23||[]).map(row=>{const c=row.card;return {name:c.name,description:c.description,cost:c.cost,kind:c.type,qty:row.qty,formulas:monsterCardFormulas23(c,m)};});}
export function cachedMonsterImage21(id){return images()[id];}
const pending25=new Map();
// A bounded, embedded WebP travels with the scene item, never a sender-local blob/localhost URL.
// This avoids both asset picker dialogs and a dependence on the DM's running computer.
export async function prepareMonster21(m){
 if(!m)throw Error('怪物模板不存在');
 if(m.portrait){
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(m.portrait)))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const all=images(),saved=all[m.id];if(saved?.portraitHash25===hash)return saved;
  const k=m.id+':'+hash;if(pending25.has(k))return pending25.get(k);
  const job=(async()=>{const img=new Image();img.crossOrigin='anonymous';img.src=m.portrait;await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw Error('图鉴立绘无法读取，请重新上传');
   let url,width,height;for(const size of [256,192,128]){const scale=Math.min(1,size/Math.max(img.naturalWidth,img.naturalHeight));width=Math.max(1,Math.round(img.naturalWidth*scale));height=Math.max(1,Math.round(img.naturalHeight*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0,width,height);url=canvas.toDataURL('image/webp',.78);if(url.length<42000)break;}
   if(url.length>=42000)throw Error('立绘过大，请换用较小的 PNG、JPEG 或 WebP');
   const result={name:m.name,portraitHash25:hash,image:{url,width,height,mime:url.startsWith('data:image/webp')?'image/webp':'image/png'},grid:{dpi:Math.max(width,height),offset:{x:width/2,y:height/2}},scale:{x:1,y:1}};
   const cache=images();delete cache[m.id];cache[m.id]=result;const keys=Object.keys(cache);while(keys.length>40)delete cache[keys.shift()];try{localStorage.setItem(imageKey,JSON.stringify(cache));}catch{/* The scene image remains usable even when the optional cache is full. */}return result;
  })().finally(()=>pending25.delete(k));pending25.set(k,job);return job;
 }
 const all=images();if(all[m.id]&&!all[m.id].portraitHash25)return all[m.id];
 const picked=await OBR.assets.downloadImages(false,m.name,'CHARACTER');if(!picked.length)return null;all[m.id]=picked[0];try{localStorage.setItem(imageKey,JSON.stringify(all));}catch{}return picked[0];
}
export function monsterName25(name,items){const base=String(name||'怪物').trim().slice(0,72),used=new Set(items.map(i=>i.name));let n=items.some(i=>i.name===base)?2:1;while(used.has(base+' '+n))n++;return base+' '+n;}
export async function placeMonster25(m,image,position){const place=async()=>{const items=await OBR.scene.items.getItems(),name=monsterName25(m.name,items),item=monsterItem21({...m,name},image,position);item.metadata[NS19+'/monster'].templateName25=m.name;await OBR.scene.items.addItems([item]);return item;};return navigator.locks? navigator.locks.request(NS19+'/monster-spawn25/'+OBR.room.id,place):place();}
export function monsterItem21(m,image,position){return buildImage(image.image,image.grid).name(m.name).plainText(m.name).layer('CHARACTER').position(position).scale(image.scale||{x:1,y:1}).metadata({[STAT19]:{health:m.hp,'max health':m.hp,'temporary health':0,'armor class':m.ac,hide:true},[NS19+'/monster']:{templateId:m.id,cards23:monsterCards23(m),dc:m.dc,initiative:m.initiative,name:m.name,species:m.species,category:m.category,level:m.level,actions:structuredClone(m.actions||[]),spells:structuredClone(m.spells||[]),abilities:structuredClone(m.abilities||{}),pb:m.pb,speed:m.speed,saves:m.saves,skills:m.skills,senses:m.senses,languages:m.languages,resistances:m.resistances,immunities:m.immunities,vulnerabilities:m.vulnerabilities,description:m.description}}).build();}
export function installMonsterDrag21(getMonster,notice){let drag=null;
 const cleanup=async(cancel=false)=>{const d=drag;if(!d)return;drag=null;clearTimeout(d.timer);if(d.starting)await d.starting.catch(()=>{});try{if(d.interaction){d.interaction[1]();if(!cancel&&d.outside){d.point=await OBR.viewport.inverseTransformPoint({x:d.origin.x+d.client.x,y:d.origin.y+d.client.y});const placed=await placeMonster25(d.m,d.image,d.point);notice('已放置 '+placed.name+'，生命值独立记录');}}}finally{try{d.el.releasePointerCapture(d.pointer);}catch{}}};
 document.addEventListener('pointerdown',ev=>{const el=ev.target.closest('[data-monster-drag21]');if(!el||ev.button!==0)return;const m=getMonster(el.dataset.monsterDrag21);if(!m)return;ev.preventDefault();el.setPointerCapture(ev.pointerId);drag={el,m,image:null,pointer:ev.pointerId,sx:ev.clientX,sy:ev.clientY,client:{x:ev.clientX,y:ev.clientY},outside:false};drag.preparing=prepareMonster21(m);drag.preparing.catch(e=>notice(e.message));drag.timer=setTimeout(()=>cleanup(true),25000);});
 document.addEventListener('pointermove',async ev=>{const d=drag;if(!d)return;d.client={x:ev.clientX,y:ev.clientY};d.outside=ev.clientX<0||ev.clientY<0||ev.clientX>innerWidth||ev.clientY>innerHeight;if(!d.interaction&&!d.starting&&Math.hypot(ev.clientX-d.sx,ev.clientY-d.sy)>7){d.starting=(async()=>{d.image=await d.preparing;if(!d.image||drag!==d)return;let geo={x:16,y:64};try{geo=JSON.parse(localStorage.getItem('folio-window21/'+new URLSearchParams(location.search).get('_win21')))||geo;}catch{}d.origin=geo;d.point=await OBR.viewport.inverseTransformPoint({x:geo.x+ev.clientX,y:geo.y+ev.clientY});d.item=monsterItem21(d.m,d.image,d.point);d.interaction=await OBR.interaction.startItemInteraction(d.item);})();await d.starting.catch(e=>{notice(e.message);cleanup(true);});}if(d.interaction&&drag===d){d.point=await OBR.viewport.inverseTransformPoint({x:d.origin.x+ev.clientX,y:d.origin.y+ev.clientY});d.interaction[0](item=>{item.position=d.point;});}});
 document.addEventListener('pointerup',ev=>{if(drag){drag.client={x:ev.clientX,y:ev.clientY};drag.outside=ev.clientX<0||ev.clientY<0||ev.clientX>innerWidth||ev.clientY>innerHeight;}cleanup().catch(e=>notice(e.message));});document.addEventListener('pointercancel',()=>cleanup(true));document.addEventListener('keydown',ev=>{if(ev.key==='Escape')cleanup(true);});addEventListener('pagehide',()=>{drag?.interaction?.[1]();});
}

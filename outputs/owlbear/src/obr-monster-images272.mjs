import OBR,{buildImageUpload} from '@owlbear-rodeo/sdk';
import {NS19,BIND19,safeMedia19} from './obr-tools-model19.mjs';
const imageKey=NS19+'/monster-images';
const images=()=>{try{return JSON.parse(localStorage.getItem(imageKey)||'{}');}catch{return {};}};
export function cachedMonsterImage21(id){const saved=images()[id];return saved?.asset27&&safeMedia19(saved.image?.url)?saved:null;}
async function requireGM272(){if(await OBR.player.getRole()!=='GM')throw Error('怪物图片由 DM 管理');}
const pending272=new Map();
// uploadImages only opens Owlbear's upload UI. Its return value is not an
// uploaded image and must never trigger downloadImages automatically.
export async function uploadMonsterPortrait272(m){
 await requireGM272();if(!m?.portrait)throw Error('请先在手札怪物卡中添加立绘，或直接从枭熊选图');
 const response=await fetch(m.portrait);if(!response.ok)throw Error('图鉴立绘读取失败，请重新添加立绘');
 const blob=await response.blob();if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(blob.type)||blob.size>20*1024*1024)throw Error('立绘需为 20 MB 以内的常见图片');
 const bitmap=await createImageBitmap(blob),width=bitmap.width,height=bitmap.height;bitmap.close();
 const file=new File([await blob.arrayBuffer()],(m.name||'怪物')+'.'+({'image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif'}[blob.type]||'png'),{type:blob.type});
 await OBR.assets.uploadImages([buildImageUpload(file).name(m.name).dpi(Math.max(width,height)).offset({x:width/2,y:height/2}).plainText(m.name).build()],'CHARACTER');
}
export async function prepareMonster21(m,forcePick=false){
 await requireGM272();if(!m)throw Error('怪物模板不存在');
 const saved=cachedMonsterImage21(m.id);if(saved&&!forcePick)return saved;
 if(pending272.has(m.id))return pending272.get(m.id);
 const job=(async()=>{const picked=await OBR.assets.downloadImages(false,m.name,'CHARACTER');if(!picked.length)return null;
  const image=picked[0];if(!safeMedia19(image.image?.url))throw Error('请选择枭熊图片库中的共享图片');
  const result={...image,asset27:true,binding272:true},cache=images();delete cache[m.id];cache[m.id]=result;const keys=Object.keys(cache);while(keys.length>40)delete cache[keys.shift()];
  localStorage.setItem(imageKey,JSON.stringify(cache));return result;
 })().finally(()=>pending272.delete(m.id));pending272.set(m.id,job);return job;
}
export async function repairSelectedMonsterImage272(m){
 await requireGM272();const image=cachedMonsterImage21(m.id);if(!image)throw Error('请先选图并绑定正确的放置图片');
 const ids=await OBR.player.getSelection();if(!ids?.length)throw Error('请先在地图选中要修正图片的同模板怪物');
 const targets=await OBR.scene.items.getItems(ids);
 if(targets.length!==ids.length||targets.some(t=>t.type!=='IMAGE'||t.metadata?.[BIND19]||t.metadata?.[NS19+'/monster']?.templateId!==m.id))throw Error('只能修正选中的同模板图鉴怪物，请取消选择其他 token');
 await OBR.scene.items.updateItems(ids,rows=>{if(rows.some(t=>t.metadata?.[BIND19]||t.metadata?.[NS19+'/monster']?.templateId!==m.id))throw Error('棋子已变化，请重新选择');for(const d of rows){d.image=structuredClone(image.image);d.grid=structuredClone(image.grid);}});return targets.length;
}

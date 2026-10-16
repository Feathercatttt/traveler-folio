import OBR from '@owlbear-rodeo/sdk';
import {STAGE19,SET19,NS19,safeMedia19} from './obr-tools-model19.mjs';
import {stageState21,canStage21} from './obr-stage21.mjs';
import {stagePosition23} from './obr-stage-command23.mjs';
let meta={},last='',me=null,drag23=null;document.body.classList.add('stage-moving23');
function place23(el,c,index,count){const p=c.position23||{x:(index+1)/(count+1),y:1};el.style.left=(p.x*100)+'%';el.style.bottom=((1-p.y)*100)+'%';el.style.width=Math.max(16,Math.min(65,98/count))+'vw';}
function paint(){
 const s=stageState21(meta[STAGE19]);if(!s.live||meta[SET19]?.theatre===false){OBR.modal.close(NS19+'/stage-display').catch(()=>{});return;}
 const signature=JSON.stringify(s);if(signature===last)return;last=signature;const host=document.getElementById('stage');host.className='stage '+s.filter;document.body.classList.remove('cinema');
 const previous=new Map([...host.children].map(n=>[n.dataset.id,n])),nodes=[],cast=s.roster21.filter(r=>r.enabled&&r.visible);
 for(const [index,c] of cast.entries()){
  const r=c.expressions?.[c.expression];if(!r||!safeMedia19(r.url))continue;
  const el=previous.get(c.id)||document.createElement('div');el.className='standing '+(c.effect||'none');el.dataset.id=c.id;el.classList.toggle('can-move23',canStage21(c,me));
  if(drag23?.id!==c.id)place23(el,c,index,cast.length);
  let img=el.querySelector('img');if(!img){img=document.createElement('img');img.draggable=false;el.append(img);}if(img.src!==r.url)img.src=r.url;img.alt=c.name;
  let name=el.querySelector('span');if(!name){name=document.createElement('span');el.append(name);}name.textContent=c.name;nodes.push(el);
 }host.replaceChildren(...nodes);
}
document.addEventListener('pointerdown',ev=>{
 const el=ev.target.closest('.standing.can-move23');if(!el||ev.button!==0)return;
 const c=stageState21(meta[STAGE19]).roster21.find(c=>c.id===el.dataset.id);if(!canStage21(c,me))return;
 ev.preventDefault();el.setPointerCapture(ev.pointerId);const box=el.getBoundingClientRect();drag23={id:c.id,pointer:ev.pointerId,el,sx:ev.clientX,sy:ev.clientY,x:(box.left+box.width/2)/innerWidth,y:box.bottom/innerHeight,moved:false};el.classList.add('dragging23');
});
document.addEventListener('pointermove',ev=>{
 const d=drag23;if(!d||d.pointer!==ev.pointerId)return;const dx=ev.clientX-d.sx,dy=ev.clientY-d.sy;if(Math.abs(dx)+Math.abs(dy)<3&&!d.moved)return;d.moved=true;
 d.position={x:Math.max(.04,Math.min(.96,d.x+dx/innerWidth)),y:Math.max(.12,Math.min(1,d.y+dy/innerHeight))};d.el.style.left=(d.position.x*100)+'%';d.el.style.bottom=((1-d.position.y)*100)+'%';
});
async function end23(ev){const d=drag23;if(!d||d.pointer!==ev.pointerId)return;drag23=null;d.el.classList.remove('dragging23');try{d.el.releasePointerCapture(ev.pointerId);}catch{}if(!d.moved)return;
 try{await stagePosition23(d.id,d.position);}catch(err){await OBR.notification.show(err.message,'ERROR').catch(()=>{});last='';paint();}
}
document.addEventListener('pointerup',end23);document.addEventListener('pointercancel',ev=>{if(drag23?.pointer===ev.pointerId){drag23=null;last='';paint();}});
OBR.onReady(async()=>{me={id:await OBR.player.getId(),role:await OBR.player.getRole()};meta=await OBR.scene.getMetadata();OBR.scene.onMetadataChange(x=>{meta=x;paint();});OBR.player.onChange(p=>{me=p;last='';paint();});OBR.scene.onReadyChange(x=>{if(!x)OBR.modal.close(NS19+'/stage-display').catch(()=>{});});paint();});

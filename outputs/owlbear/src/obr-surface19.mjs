import OBR from '@owlbear-rodeo/sdk';
import {STAGE19,SET19,NS19,safeMedia19} from './obr-tools-model19.mjs';
import {stageState21,canStage21} from './obr-stage21.mjs';
import {stagePosition23,stageAction24} from './obr-stage-command23.mjs';
import {stageCue24} from './obr-stage-cue24.mjs';
let meta={},last='',me=null,drag23=null,query25='',filter25='all';document.body.classList.add('stage-moving23');
const cue24=document.createElement('aside');cue24.className='surface-cue24';cue24.innerHTML='<div class="surface-cue-handle24" tabindex="0" role="toolbar" aria-label="拖动演出控制条">演出角色 <small>拖动移动</small></div><details class="cue-search25"><summary>搜索 / 筛选</summary><div><input type="search" id="cueSearch25" aria-label="搜索上场角色" placeholder="角色名称…"><select id="cueFilter25" aria-label="筛选上场名单"><option value="all">全部</option><option value="visible">场上</option><option value="hidden">候场</option></select></div></details><div id="cueContent24"></div><p id="stageError24" role="status"></p>';document.body.append(cue24);
function place23(el,c,index,count){const p=c.position23||{x:(index+1)/(count+1),y:1},scale=c.scale24||1;el.style.left=(p.x*100)+'%';el.style.bottom=((1-p.y)*100)+'%';el.style.width=(Math.max(16,Math.min(65,98/count))*scale)+'vw';el.style.height=(82*scale)+'vh';}
const tell24=err=>{document.getElementById('stageError24').textContent=err?.message||String(err);};
function paint(){
 const s=stageState21(meta[STAGE19]);if(!s.live||meta[SET19]?.theatre===false){OBR.modal.close(NS19+'/stage-display').catch(()=>{});return;}
 const signature=JSON.stringify(s);if(signature===last)return;last=signature;const host=document.getElementById('stage');host.className='stage '+s.filter;document.body.classList.remove('cinema');
 const rail=cue24.querySelector('.stage-dock-rail21'),railLeft=rail?.scrollLeft||0;document.getElementById('cueContent24').innerHTML=stageCue24(s,me,query25,filter25);cue24.style.width=Math.min(innerWidth-32,Math.max(240,132+Math.min(5,s.roster21.filter(c=>c.enabled&&canStage21(c,me)).length)*62))+'px';if(cue24.querySelector('.stage-dock-rail21'))cue24.querySelector('.stage-dock-rail21').scrollLeft=railLeft;
 const previous=new Map([...host.children].map(n=>[n.dataset.id,n])),nodes=[],cast=s.roster21.filter(r=>r.enabled&&r.visible);
 for(const [index,c] of cast.entries()){
  const r=c.expressions?.[c.expression];if(!r||!safeMedia19(r.url))continue;
  const el=previous.get(c.id)||document.createElement('div');el.className='standing '+(c.effect||'none');el.dataset.id=c.id;el.classList.toggle('can-move23',canStage21(c,me));
  if(drag23?.id!==c.id)place23(el,c,index,cast.length);
  let img=el.querySelector('img');if(!img){img=document.createElement('img');img.draggable=false;el.append(img);}if(img.src!==r.url)img.src=r.url;img.alt=c.name;
  let name=el.querySelector('.standing-name24');if(!name){name=document.createElement('span');name.className='standing-name24';el.append(name);}name.textContent=c.name;
  let tools=el.querySelector('.standing-tools24');if(!tools){tools=document.createElement('div');tools.className='standing-tools24';tools.innerHTML='<button type="button" data-scale24="down" aria-label="缩小立绘">−</button><output></output><button type="button" data-scale24="up" aria-label="放大立绘">＋</button><button type="button" data-scale24="reset" aria-label="恢复立绘原尺寸">重置</button>';el.append(tools);}tools.hidden=!canStage21(c,me);tools.querySelector('output').textContent=Math.round((c.scale24||1)*100)+'%';nodes.push(el);
 }host.replaceChildren(...nodes);
}
document.addEventListener('pointerdown',ev=>{
 const el=ev.target.closest('.standing.can-move23');if(!el||ev.button!==0||ev.target.closest('button,select,input'))return;
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
async function scale24(el,mode){const s=stageState21(meta[STAGE19]),c=s.roster21.find(c=>c.id===el.dataset.id);if(!canStage21(c,me))return;const scale=mode==='reset'?1:Math.max(.25,Math.min(2.5,(c.scale24||1)*(mode==='up'?1.15:1/1.15))),p=c.position23||{x:(s.roster21.filter(r=>r.enabled&&r.visible).indexOf(c)+1)/(s.roster21.filter(r=>r.enabled&&r.visible).length+1),y:1};await stagePosition23(c.id,p,scale);}
document.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;try{if(b.dataset.scale24)await scale24(b.closest('.standing'),b.dataset.scale24);if(b.dataset.cue24==='end'){b.disabled=true;try{await stageAction24('stage-live',{active:false});await OBR.modal.close(NS19+'/stage-display');}finally{b.disabled=false;}}if(b.dataset.cue24==='toggle'){const c=stageState21(meta[STAGE19]).roster21.find(c=>c.id===b.dataset.performer);await stageAction24(c.visible?'stage-leave':'stage-enter',{performerId:c.id});}}catch(err){tell24(err);}});
document.addEventListener('input',ev=>{if(ev.target.id==='cueSearch25'){query25=ev.target.value;last='';paint();}});
document.addEventListener('change',async ev=>{if(ev.target.id==='cueFilter25'){filter25=ev.target.value;last='';paint();}if(ev.target.dataset.cueExpression24)try{await stageAction24('stage-expression',{performerId:ev.target.dataset.cueExpression24,index:Number(ev.target.value)});}catch(err){tell24(err);}});
document.addEventListener('contextmenu',async ev=>{const b=ev.target.closest('[data-cue24="toggle"]');if(!b)return;ev.preventDefault();try{await stageAction24('stage-leave',{performerId:b.dataset.performer});}catch(err){tell24(err);}});
let wheelTimer24;document.addEventListener('wheel',ev=>{const el=ev.target.closest('.standing.can-move23');if(!el||ev.target.closest('button,select'))return;ev.preventDefault();clearTimeout(wheelTimer24);wheelTimer24=setTimeout(()=>scale24(el,ev.deltaY<0?'up':'down').catch(tell24),80);},{passive:false});
let cueDrag24=null;const handle24=cue24.querySelector('.surface-cue-handle24');handle24.onpointerdown=ev=>{if(ev.button!==0)return;ev.preventDefault();handle24.setPointerCapture(ev.pointerId);const r=cue24.getBoundingClientRect();cueDrag24={id:ev.pointerId,x:ev.clientX,y:ev.clientY,left:r.left,top:r.top};};handle24.onpointermove=ev=>{const d=cueDrag24;if(!d||d.id!==ev.pointerId)return;cue24.style.left=Math.max(0,Math.min(innerWidth-cue24.offsetWidth,d.left+ev.clientX-d.x))+'px';cue24.style.top=Math.max(0,Math.min(innerHeight-cue24.offsetHeight,d.top+ev.clientY-d.y))+'px';};handle24.onpointerup=handle24.onpointercancel=()=>cueDrag24=null;
OBR.onReady(async()=>{me={id:await OBR.player.getId(),role:await OBR.player.getRole()};meta=await OBR.scene.getMetadata();OBR.scene.onMetadataChange(x=>{meta=x;paint();});OBR.player.onChange(p=>{me=p;last='';paint();});OBR.scene.onReadyChange(x=>{if(!x)OBR.modal.close(NS19+'/stage-display').catch(()=>{});});paint();});

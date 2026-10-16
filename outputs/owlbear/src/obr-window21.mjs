import OBR from '@owlbear-rodeo/sdk';
import {asset21} from './obr-host21.mjs';

const key=id=>`folio-window21/${id}`;
const activeKey=id=>`${key(id)}/active-popover`;
const activeId=id=>{const p=new URLSearchParams(location.search);return localStorage.getItem(activeKey(id))||(p.get('_win21')===id&&p.get('_popover21'))||id;};

function geometryPopover21(id,url,geo,hidePaper=true){
 return {id,url,width:geo.w,height:geo.h,anchorReference:'POSITION',anchorPosition:{left:geo.x,top:geo.y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},disableClickAway:true,hidePaper};
}

export async function openWindow21(id,path,options={}){
 const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
 let saved={};try{saved=JSON.parse(localStorage.getItem(key(id))||'{}');}catch{}
 const w=Math.max(190,Math.min(vw-12,(!options.resetSize&&saved.w)||options.width||470));
 const h=Math.max(96,Math.min(vh-12,(!options.resetSize&&saved.h)||options.height||650));
 const x=Math.max(6,Math.min(vw-w-6,saved.x??options.x??Math.max(12,(vw-w)/2)));
 const y=Math.max(6,Math.min(vh-h-6,saved.y??options.y??64));
 const geo={x,y,w,h,vw,vh};localStorage.setItem(key(id),JSON.stringify(geo));
 const popId=activeId(id),url=new URL(asset21(path));
 for(const [k,v] of Object.entries({_win21:id,_popover21:popId,_x21:x,_y21:y,_w21:w,_h21:h,_minw21:options.minWidth||190,_minh21:options.minHeight||96,_glass21:options.glass?'1':'0',_hidehead21:options.hideHeader?'1':'0',_lockclose21:options.lockClose?'1':'0',_resize21:options.resize===false?'0':'1'}))url.searchParams.set(k,String(v));
 await OBR.popover.open(geometryPopover21(popId,url.href,geo,options.hidePaper!==false));
}

export async function closeWindow21(id){
 const popId=activeId(id);await OBR.popover.close(popId).catch(()=>{});
 if(popId!==id)await OBR.popover.close(id).catch(()=>{});
}

export function installWindow21(title,onClose,options={}){
 const p=new URLSearchParams(location.search),id=p.get('_win21');if(!id)return;
 const popId=p.get('_popover21')||activeId(id),minw=Number(p.get('_minw21')||190),minh=Number(p.get('_minh21')||96);
 document.body.classList.add('window21');if(p.get('_glass21')==='1')document.body.classList.add('window21-glass');
 let geo={};try{geo=JSON.parse(localStorage.getItem(key(id))||'{}');}catch{}
 geo={x:Number(p.get('_x21')??geo.x??16),y:Number(p.get('_y21')??geo.y??64),w:Number(p.get('_w21')??geo.w??innerWidth),h:Number(p.get('_h21')??geo.h??innerHeight),vw:Number(geo.vw||innerWidth),vh:Number(geo.vh||innerHeight)};
 const hiddenHeader=p.get('_hidehead21')==='1',lockedClose=p.get('_lockclose21')==='1'||options.lockClose===true;
 if(!hiddenHeader){
  const head=document.createElement('div');head.className='window21-head';head.tabIndex=0;head.setAttribute('role','toolbar');head.setAttribute('aria-label',title+'；拖动移动，方向键微调');
  const label=document.createElement('strong');label.textContent=title;label.className='window21-title';head.append(label);
  const move=document.createElement('span');move.className='window21-move-hint';move.setAttribute('aria-live','polite');head.append(move);
  const exit=document.createElement('button');exit.type='button';exit.className='window21-close';exit.textContent='×';exit.title=lockedClose?'直播期间请使用“结束直播”':'关闭窗口';exit.setAttribute('aria-label',lockedClose?'直播期间不能关闭窗口':'关闭'+title);exit.disabled=lockedClose;head.append(exit);document.body.prepend(head);
  exit.onclick=()=>{if(onClose)void onClose();else void closeWindow21(id);};
  document.body.dataset.window21Title=title;
  document.body.__window21Head=head;
 }
 const grip=document.createElement('button');grip.type='button';grip.className='window21-resize';grip.title='拖动调整大小；方向键微调，Shift 加速';grip.setAttribute('aria-label','调整窗口大小');grip.textContent='◢';const canResize=p.get('_resize21')!=='0'&&options.resize!==false;if(canResize)document.body.append(grip);
 const css=document.createElement('style');css.textContent=`body.window21{display:flex;flex-direction:column;min-height:0;height:100vh;margin:0;box-sizing:border-box}body.window21>header #close19{display:none}.window21-head{display:flex;align-items:center;gap:8px;flex-shrink:0;min-height:30px;padding:3px 6px 3px 10px;background:var(--panel,#302b31);border-bottom:1px solid var(--line,#65554b);cursor:grab;user-select:none;touch-action:none;z-index:20}.window21-head:active{cursor:grabbing}.window21-head:focus-visible,.window21-resize:focus-visible{outline:2px solid #e5bd73;outline-offset:-2px}.window21-title{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.window21-move-hint{font-size:10px;opacity:.8;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.window21-close{width:28px;min-width:28px;min-height:26px;padding:0!important;font-size:19px;cursor:pointer}.window21-close:disabled{opacity:.45;cursor:not-allowed}.window21-resize{position:fixed;right:0;bottom:0;width:22px;height:22px;padding:0!important;min-height:0!important;border:0;background:transparent;color:inherit;cursor:nwse-resize;touch-action:none;z-index:99}.window21 main{min-height:0;flex:1;overflow:auto}.window21 footer{flex-shrink:0}body.window21-glass{background:transparent!important}body.window21-glass>.window21-head{background:rgba(25,29,32,.68);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);border-radius:12px 12px 0 0;box-shadow:0 6px 22px rgba(0,0,0,.24)}body.window21-glass main{background:rgba(24,29,32,.52);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.13);border-top:0;border-radius:0 0 12px 12px;box-shadow:0 8px 24px rgba(0,0,0,.24)}@media(pointer:coarse){.window21-close{min-width:42px;min-height:38px}.window21-resize{width:32px;height:32px}}`;
 document.head.append(css);
 let drag=null,last=0;
 const save=()=>localStorage.setItem(key(id),JSON.stringify(geo));
 const moveHint=text=>{const h=document.body.__window21Head?.querySelector('.window21-move-hint');if(h)h.textContent=text;};
 async function reposition(){
  const nextId=`${id}/window-${crypto.randomUUID()}`;const url=new URL(location.href);url.searchParams.set('_popover21',nextId);url.searchParams.set('_x21',String(geo.x));url.searchParams.set('_y21',String(geo.y));url.searchParams.set('_w21',String(geo.w));url.searchParams.set('_h21',String(geo.h));
  localStorage.setItem(activeKey(id),nextId);save();
  try{await OBR.popover.open(geometryPopover21(nextId,url.href,geo,true));await OBR.popover.close(popId).catch(()=>{});}catch(err){localStorage.setItem(activeKey(id),popId);throw err;}
 }
 const moveHandle=document.body.__window21Head,boundMove=new WeakSet();
 const bindMoveHandle=el=>{if(boundMove.has(el))return;boundMove.add(el);
  el.addEventListener('pointerdown',ev=>{if(ev.button!==0||(ev.target.closest('button,input,select,textarea,a')&&!el.matches('[data-window21-drag]')))return;ev.preventDefault();try{el.setPointerCapture(ev.pointerId);}catch{}drag={mode:'move',id:ev.pointerId,sx:ev.clientX,sy:ev.clientY,start:{...geo},moved:false};moveHint('拖动中');});
  el.addEventListener('pointermove',ev=>{if(!drag||drag.id!==ev.pointerId)return;const dx=ev.clientX-drag.sx,dy=ev.clientY-drag.sy;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;if(!drag.moved)return;geo.x=Math.max(0,Math.min(geo.vw-64,drag.start.x+dx));geo.y=Math.max(0,Math.min(geo.vh-36,drag.start.y+dy));moveHint(`松开移动到 ${Math.round(geo.x)}, ${Math.round(geo.y)}`);});
  const end=ev=>{if(!drag||drag.id!==ev.pointerId)return;const moved=drag.moved;drag=null;if(!moved){moveHint('');return;}save();moveHint('正在移动…');void reposition().catch(err=>{moveHint('移动失败');console.warn('浮窗移动失败',err);});};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 };
 if(moveHandle)bindMoveHandle(moveHandle);document.querySelectorAll('[data-window21-drag]').forEach(bindMoveHandle);
 const moveObserver=new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node instanceof Element){if(node.matches('[data-window21-drag]'))bindMoveHandle(node);node.querySelectorAll?.('[data-window21-drag]').forEach(bindMoveHandle);}});moveObserver.observe(document.body,{childList:true,subtree:true});
 if(moveHandle)moveHandle.addEventListener('keydown',ev=>{const delta=ev.shiftKey?40:16;const offsets={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};if(ev.key==='Escape'){void closeWindow21(id);return;}const d=offsets[ev.key];if(!d)return;ev.preventDefault();geo.x=Math.max(0,Math.min(geo.vw-64,geo.x+d[0]));geo.y=Math.max(0,Math.min(geo.vh-36,geo.y+d[1]));save();void reposition().catch(console.warn);});
 let resize=null;
 if(canResize)grip.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.preventDefault();try{grip.setPointerCapture(ev.pointerId);}catch{}resize={id:ev.pointerId,sx:ev.clientX,sy:ev.clientY,w:innerWidth,h:innerHeight};});
 if(canResize)grip.addEventListener('pointermove',ev=>{if(!resize||resize.id!==ev.pointerId)return;geo.w=Math.max(minw,Math.min(geo.vw-geo.x-6,resize.w+ev.clientX-resize.sx));geo.h=Math.max(minh,Math.min(geo.vh-geo.y-6,resize.h+ev.clientY-resize.sy));if(performance.now()-last<45)return;last=performance.now();save();Promise.all([OBR.popover.setWidth(popId,geo.w),OBR.popover.setHeight(popId,geo.h)]).catch(()=>{});});
 const resizeEnd=ev=>{if(!resize||resize.id!==ev.pointerId)return;resize=null;save();Promise.all([OBR.popover.setWidth(popId,geo.w),OBR.popover.setHeight(popId,geo.h)]).catch(()=>{});};
 if(canResize){grip.addEventListener('pointerup',resizeEnd);grip.addEventListener('pointercancel',resizeEnd);
 grip.addEventListener('keydown',ev=>{const delta=ev.shiftKey?32:8;const n={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]}[ev.key];if(!n)return;ev.preventDefault();geo.w=Math.max(minw,Math.min(geo.vw-geo.x-6,geo.w+n[0]));geo.h=Math.max(minh,Math.min(geo.vh-geo.y-6,geo.h+n[1]));save();Promise.all([OBR.popover.setWidth(popId,geo.w),OBR.popover.setHeight(popId,geo.h)]).catch(()=>{});});}
}

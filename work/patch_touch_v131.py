from pathlib import Path

def apply_touch_fix(js):
 old="const ctx={input:null,fragment:null,rows:[],active:0,menu:null,skip:false,composing:false};MENTION_DOCS8.set(doc,ctx);"
 assert js.count(old)==1
 js=js.replace(old,old+"\n let touchGesture131=null;")
 old="const close=()=>{if(ctx.menu){ctx.menu.remove();ctx.menu=null;}"
 assert js.count(old)==1
 js=js.replace(old,"const close=()=>{touchGesture131=null;if(ctx.menu){ctx.menu.remove();ctx.menu=null;}")
 old="doc.addEventListener('pointerdown',ev=>{const option=ev.target.closest('[data-ref8-index]');if(option&&ctx.menu?.contains(option)){ev.preventDefault();choose(Number(option.dataset.ref8Index));return;}if(ctx.menu&&ev.target!==ctx.input&&!ctx.menu.contains(ev.target))close();},true);\n doc.addEventListener('click',ev=>{if(ev.target.matches('[data-link8]')&&!ctx.menu)show(ev.target);});"
 assert js.count(old)==1
 new="""// Touch must remain available to the browser's native vertical scroller.
 doc.addEventListener('pointerdown',ev=>{
  const option=ev.target.closest('[data-ref8-index]'),contact=ev.pointerType==='touch'||ev.pointerType==='pen';
  if(contact&&ev.isPrimary===false){if(touchGesture131)touchGesture131.cancelled=true;return;}
  if(option&&ctx.menu?.contains(option)){
   if(contact){const list=option.closest('.ref8-list');touchGesture131={id:ev.pointerId,menu:ctx.menu,option,list,x:ev.clientX,y:ev.clientY,scroll:list.scrollTop,moved:false,cancelled:false,ended:false};return;}
   touchGesture131=null;ev.preventDefault();choose(Number(option.dataset.ref8Index));return;
  }
  if(ctx.menu&&ev.target!==ctx.input&&!ctx.menu.contains(ev.target))close();
 },true);
 const touchMove131=ev=>{const t=touchGesture131;if(!t||ev.pointerId!==t.id)return;if(Math.hypot(ev.clientX-t.x,ev.clientY-t.y)>10)t.moved=true;};
 doc.addEventListener('pointermove',touchMove131,{capture:true,passive:true});
 doc.addEventListener('pointerup',ev=>{touchMove131(ev);if(touchGesture131?.id===ev.pointerId)touchGesture131.ended=true;},{capture:true,passive:true});
 doc.addEventListener('pointercancel',ev=>{if(touchGesture131?.id===ev.pointerId)touchGesture131.cancelled=true;},{capture:true,passive:true});
 doc.addEventListener('click',ev=>{
  const option=ev.target.closest('[data-ref8-index]');
  if(option&&ctx.menu?.contains(option)){
   const t=touchGesture131,contact=ev.pointerType==='touch'||ev.pointerType==='pen'||ev.sourceCapabilities?.firesTouchEvents;
   if(t){touchGesture131=null;ev.preventDefault();ev.stopImmediatePropagation();if(t.ended&&!t.cancelled&&!t.moved&&t.menu===ctx.menu&&t.option===option&&Math.abs(t.list.scrollTop-t.scroll)<2)choose(Number(option.dataset.ref8Index));return;}
   // An unmatched touch click can follow cancellation or another gesture.
   ev.preventDefault();ev.stopImmediatePropagation();if(!contact)choose(Number(option.dataset.ref8Index));return;
  }
  if(ev.target.matches('[data-link8]')&&!ctx.menu)show(ev.target);
 },true);"""
 js=js.replace(old,new)
 old="doc.addEventListener('scroll',()=>{if(ctx.menu)place();},true);"
 assert js.count(old)==1
 js=js.replace(old,"doc.addEventListener('scroll',ev=>{const t=touchGesture131;if(t&&ev.target===t.list&&Math.abs(t.list.scrollTop-t.scroll)>1)t.moved=true;if(ctx.menu)place();},true);")
 old='<small>↑↓ 选择 · Enter 插入 · Esc 关闭</small>'
 assert js.count(old)==1
 js=js.replace(old,"<small>'+((doc.defaultView.matchMedia('(pointer:coarse)').matches||window.FolioNative)?'上下滑动浏览 · 轻点插入':'↑↓ 选择 · Enter 插入 · Esc 关闭')+'</small>")
 return js

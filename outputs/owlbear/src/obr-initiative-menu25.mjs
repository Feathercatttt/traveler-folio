export function installInitiativeMenu25({getEntry,canManage,isGM,act}){
 let menu=null,origin=null;
 const close=()=>{menu?.remove();menu=null;};
 function open(el,x,y){const id=el.dataset.entry19,r=getEntry(id);if(!r||!canManage(r))return;close();origin=el.querySelector('.item-img');menu=document.createElement('div');menu.className='initiative-menu25';menu.setAttribute('role','menu');menu.setAttribute('aria-label',r.name+' 先攻操作');
  const title=document.createElement('strong');title.textContent=r.name;menu.append(title);
  for(const [label,action] of [['重骰先攻','roll-init'],...(isGM()?[['退出战斗','initiative-remove']]:[])]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('role','menuitem');b.onclick=()=>{close();void act(action,id);};menu.append(b);}
  document.body.append(menu);const box=menu.getBoundingClientRect();menu.style.left=Math.max(4,Math.min(innerWidth-box.width-4,x))+'px';menu.style.top=Math.max(4,Math.min(innerHeight-box.height-4,y))+'px';menu.querySelector('button')?.focus();
 }
 document.addEventListener('contextmenu',ev=>{const row=ev.target.closest('.initiative-item');if(!row||ev.target.closest('input'))return;if(canManage(getEntry(row.dataset.entry19))){ev.preventDefault();open(row,ev.clientX,ev.clientY);}});
 document.addEventListener('pointerdown',ev=>{if(menu&&!menu.contains(ev.target))close();});
 document.addEventListener('keydown',ev=>{if(menu){if(ev.key==='Escape'){ev.preventDefault();close();origin?.focus();}else if(['ArrowDown','ArrowUp','Home','End'].includes(ev.key)){ev.preventDefault();const bs=[...menu.querySelectorAll('button')],i=bs.indexOf(document.activeElement),n=ev.key==='Home'?0:ev.key==='End'?bs.length-1:(i+(ev.key==='ArrowDown'?1:-1)+bs.length)%bs.length;bs[n]?.focus();}}else if(ev.key==='ContextMenu'||(ev.shiftKey&&ev.key==='F10')){const row=ev.target.closest('.initiative-item');if(row){ev.preventDefault();const r=row.getBoundingClientRect();open(row,r.left,r.top+24);}}});
}

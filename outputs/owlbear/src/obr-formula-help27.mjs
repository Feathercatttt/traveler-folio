export const formulaExamples27=[
 ['普通检定','1d20+5','掷一枚 d20，加 5'],
 ['优势 · 取较大','2d20kh1+5','两枚 d20，保留较大的一枚，再加 5'],
 ['劣势 · 取较小','2d20kl1+5','两枚 d20，保留较小的一枚，再加 5'],
 ['多骰取最大','3d6kh1','三枚 d6，只保留最大的一枚'],
 ['多骰取最小','3d6kl1','三枚 d6，只保留最小的一枚'],
 ['舍弃最小骰','4d6dl1','四枚 d6，丢弃最小的一枚后求和'],
 ['伤害与加值','2d6+3','两枚 d6 求和，再加 3'],
 ['临时骰子减值','1d20+5-1d4','检定总值减去这次 d4 的结果'],
 ['伤害类型注释','1d6（挥砍）+1d4（火焰）','中文括号只作标注，不参与计算']
];
const esc27=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function formulaHelpHTML27(){return '<span class="formula-help27"><button type="button" class="formula-help-trigger27" data-formula-help27 aria-label="检定公式示例" aria-expanded="false" title="检定公式示例">ƒx</button><span class="formula-help-pop27" hidden role="group" aria-label="检定公式示例"><strong>检定公式 · 点击复制</strong><small>NdM = N 枚 M 面骰；kh / kl 保留最高 / 最低，dl 丢弃最低。</small>'+formulaExamples27.map(([label,text,note])=>'<button type="button" data-formula-copy27="'+esc27(text)+'" title="'+esc27(note)+'；点击复制"><span>'+esc27(label)+'</span><code>'+esc27(text)+'</code></button>').join('')+'<small data-formula-status27 role="status" aria-live="polite">复制后粘贴到公式输入框，再按需修改加值。</small></span></span>';}
const installed27=new WeakSet();
export function installFormulaHelp27(doc=document){if(installed27.has(doc))return;installed27.add(doc);
 const show=(root,open)=>{if(!root)return;const pop=root.querySelector('.formula-help-pop27'),trigger=root.querySelector('[data-formula-help27]');pop.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open){const r=root.getBoundingClientRect(),win=doc.defaultView,bottom=win.innerHeight-r.bottom-74,above=r.top-12,up=bottom<330&&above>bottom;pop.style.top=up?'auto':'100%';pop.style.bottom=up?'100%':'auto';pop.style.maxHeight=Math.max(120,Math.min(470,up?above:bottom))+'px';const width=pop.getBoundingClientRect().width;pop.style.right=r.right-width<8?'auto':'0';pop.style.left=r.right-width<8?(8-r.left)+'px':'auto';}};
 const closeOthers=root=>doc.querySelectorAll('.formula-help27').forEach(r=>{if(r!==root){delete r.dataset.pinned27;show(r,false);}});
 doc.addEventListener('pointerover',ev=>{const r=ev.target.closest('.formula-help27');if(r&&ev.pointerType!=='touch'&&!r.contains(ev.relatedTarget)){closeOthers(r);show(r,true);}});
 doc.addEventListener('pointerout',ev=>{const r=ev.target.closest('.formula-help27');if(r&&!r.contains(ev.relatedTarget)&&!r.dataset.pinned27&&!r.contains(doc.activeElement))show(r,false);});
 doc.addEventListener('focusin',ev=>{const r=ev.target.closest('.formula-help27');if(r){closeOthers(r);show(r,true);}});
 doc.addEventListener('focusout',ev=>{const r=ev.target.closest('.formula-help27');if(r&&!r.contains(ev.relatedTarget)&&!r.dataset.pinned27)show(r,false);});
 doc.addEventListener('keydown',ev=>{if(ev.key==='Escape'){const r=ev.target.closest('.formula-help27');if(r){ev.preventDefault();delete r.dataset.pinned27;r.querySelector('[data-formula-help27]').focus();show(r,false);}}});
 doc.addEventListener('click',async ev=>{const trigger=ev.target.closest('[data-formula-help27]'),copy=ev.target.closest('[data-formula-copy27]'),root=ev.target.closest('.formula-help27');
  if(trigger){const pinned=!!root.dataset.pinned27;closeOthers(root);if(pinned)delete root.dataset.pinned27;else root.dataset.pinned27='1';show(root,!pinned);return;}
  if(copy){root.dataset.pinned27='1';show(root,true);const text=copy.dataset.formulaCopy27;let ok=false;try{const policy=doc.permissionsPolicy||doc.featurePolicy;if(policy&&!policy.allowsFeature('clipboard-write'))throw Error('Use selection copy');await doc.defaultView.navigator.clipboard.writeText(text);ok=true;}catch{const active=doc.activeElement,input=doc.createElement('textarea');input.value=text;input.setAttribute('aria-label','复制公式');input.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';(copy.closest('dialog')||doc.body).append(input);input.focus();input.select();try{ok=doc.execCommand('copy');}catch{}input.remove();active?.focus({preventScroll:true});}
   root.querySelector('[data-formula-status27]').textContent=ok?'已复制：'+text:'请选中并复制：'+text;return;}
  if(!root)closeOthers(null);
 });
}

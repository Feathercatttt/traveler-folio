/* Formula previews do not need to resolve every field in a large editor. */
const hintBefore28=refreshLinkHint8;refreshLinkHint8=function(input){if(input.dataset.link8==='text'&&!input.value.includes('@')){if(input._hint8){input._hint8.hidden=true;input._hint8.classList.remove('invalid');}return;}if(input._hint8)input._hint8.hidden=false;return hintBefore28(input);};
formulaPreview6=function(){
 const rows=$('formulaEditorRows'),form=$('dialogForm');if(!rows||!form)return;
 const formulas=readFormulas6(new FormData(form)),base=cardById(editingCard4)||{id:'draft'},card={...base,jobBinding:Number(form.elements['card-job-binding']?.value??base.jobBinding??-1)};
 let tools=$('formula132Tools');if(!tools){rows.insertAdjacentHTML('beforebegin','<div id="formula132Tools" class="formula132-tools" hidden><span data-formula132-count></span><div><button type="button" class="mini-link" data-action="formula132-expand">全部展开</button><button type="button" class="mini-link" data-action="formula132-collapse">全部收起</button></div></div>');tools=$('formula132Tools');}
 tools.hidden=formulas.length<2;setText10(tools.querySelector('[data-formula132-count]'),'共 '+formulas.length+' 条公式');
 const kinds={dc:'豁免 DC',attack:'攻击检定',damage:'伤害 / 治疗',other:'其他公式'},nodes=new Map([...rows.children].map(x=>[x.dataset.formulaRow,x]));
 deriveBatch16(()=>{for(const f of formulas){const row=nodes.get(f.id);if(!row)continue;const v=formulaValue6(f,card),result=row.querySelector('[data-formula132-result]'),preview=row.querySelector('[data-formula-preview]');setText10(preview,(f.expression?(f.kind==='dc'?'DC ':'')+v.value:'填写公式后预览')+(v.note?' · '+v.note:''));setText10(row.querySelector('[data-formula132-label]'),f.label||'未命名公式');setText10(row.querySelector('[data-formula132-kind]'),kinds[f.kind]);setText10(result,f.expression?(f.kind==='dc'?'DC ':'')+v.value:'待填写公式');const title=f.expression+(v.note?' · '+v.note:'');if(result&&result.title!==title)result.title=title;}});
};
let summonPreviewFrame28=0;
function scheduleSummonPreview28(){if(summonPreviewFrame28)return;summonPreviewFrame28=requestAnimationFrame(()=>{summonPreviewFrame28=0;deriveBatch16(()=>summonAttackPreview5());});}
// A character/formula snapshot cache lasts only through one synchronous operation.
const editBefore28=editCard;editCard=function(...args){return deriveBatch16(()=>editBefore28(...args));};
const summonEditBefore28=summonEditor5;summonEditor5=function(...args){return deriveBatch16(()=>summonEditBefore28(...args));};
const saveBefore28=save;save=function(){invalidateDerived16();return saveBefore28();};

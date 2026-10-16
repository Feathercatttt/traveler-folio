/* Individual formula editors: keep all inputs in the form while folded. */
function formulaRow6(x={}){
 const f=formulasClean6([x])[0],kind={dc:'豁免 DC',attack:'攻击检定',damage:'伤害 / 治疗',other:'其他公式'}[f.kind];
 const body=formulaRow6V131(f).replace(' data-formula-row="'+e(f.id)+'"','');
 return '<details class="formula132-row" data-formula-row="'+e(f.id)+'"'+(!x.id?' open':'')+'><summary><span class="formula132-heading"><strong data-formula132-label>'+e(f.label||'未命名公式')+'</strong><span class="formula132-kind" data-formula132-kind>'+e(kind)+'</span></span><span class="formula132-result" data-formula132-result>待填写公式</span></summary>'+body+'</details>';
}
function decorateSummary10(details,title,help){
 if(details.classList.contains('formula132-row'))return;
 return decorateSummary10V131(details,title,help);
}
function formulaPreview6(){
 formulaPreview6V131();
 const rows=$('formulaEditorRows'),form=$('dialogForm');if(!rows||!form)return;
 let tools=$('formula132Tools');
 if(!tools){rows.insertAdjacentHTML('beforebegin','<div id="formula132Tools" class="formula132-tools" hidden><span data-formula132-count></span><div><button type="button" class="mini-link" data-action="formula132-expand">全部展开</button><button type="button" class="mini-link" data-action="formula132-collapse">全部收起</button></div></div>');tools=$('formula132Tools');}
 const formulas=readFormulas6(formData10(form)),base=cardById(editingCard4)||{id:'draft'},card={...base,jobBinding:Number(form.elements['card-job-binding']?.value??base.jobBinding??-1)};
 tools.hidden=formulas.length<2;setText10(tools.querySelector('[data-formula132-count]'),'共 '+formulas.length+' 条公式');
 const kinds={dc:'豁免 DC',attack:'攻击检定',damage:'伤害 / 治疗',other:'其他公式'};
 for(const f of formulas){
  const row=[...rows.children].find(x=>x.dataset.formulaRow===f.id);if(!row)continue;
  const v=formulaValue6(f,card),result=row.querySelector('[data-formula132-result]');
  setText10(row.querySelector('[data-formula132-label]'),f.label||'未命名公式');setText10(row.querySelector('[data-formula132-kind]'),kinds[f.kind]);
  setText10(result,f.expression?((f.kind==='dc'?'DC ':'')+v.value):'待填写公式');
  const title=f.expression+(v.note?' · '+v.note:'');if(result.title!==title)result.title=title;
 }
}
document.addEventListener('click',ev=>{
 const button=ev.target.closest('[data-action="formula132-expand"],[data-action="formula132-collapse"]');if(!button)return;
 ev.preventDefault();
 for(const row of document.querySelectorAll('#formulaEditorRows > .formula132-row'))row.open=button.dataset.action==='formula132-expand';
},true);

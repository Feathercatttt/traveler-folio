/* Compact trait descriptions share one disclosure with their numerical controls. */
function foldDescriptions10(doc){
 foldDescriptions10V132(doc);
 for(const host of doc.querySelectorAll('.attached-card')){
  const id=host.querySelector('[data-action="detail-card"]')?.dataset.id;
  const card=cardById(id);if(card?.type!=='trait')continue;
  const details=host.querySelector(':scope > .description10'),summary=details?.querySelector(':scope > summary');if(!summary)continue;
  details.classList.add('description133');
  if(!summary.querySelector('.description133-preview'))summary.innerHTML='<span class="description133-preview"></span><span class="description133-toggle"><span class="description133-more">详情</span><span class="description133-less">收起</span></span>';
  const description=String(card.description||'');
  setText10(details.querySelector(':scope > p'),description);
  const text=description.replace(/\s+/g,' ').trim()||'特性详情';
  setText10(summary.querySelector('.description133-preview'),text);
  const effects=host.querySelector(':scope > .trait-effects');if(effects)details.append(effects);
 }
}

function renderSheet(){renderSheetV132();foldDescriptions10(document);}

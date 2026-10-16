/* Scope caches to a single synchronous paint; edits immediately invalidate them. */
let DERIVED16=null,SHEET_RENDER16=0,QUICK_RENDERED16=false,PRINT_DIRTY16=true,LIBRARY_DIRTY16=true,LIBRARY_FORCE16=false;
const DOM_PENDING16=new WeakSet();let IDENTITY16=null;
function invalidateDerived16(){if(DERIVED16)DERIVED16.clear();}
function deriveBatch16(fn){if(DERIVED16)return fn();DERIVED16=new Map();try{return fn()}finally{DERIVED16=null;}}
function memoDerived16(name,key,actor,fn){if(!DERIVED16)return fn();const raw=rawOf10(actor);let rows=DERIVED16.get(raw);if(!rows)DERIVED16.set(raw,rows=new Map());const id=name+'|'+key;if(rows.has(id))return rows.get(id);const result=fn();rows.set(id,result);return result;}
function activeEffects(c=current()){return memoDerived16('effects','',c,()=>activeEffectsV14(c));}
function abilityStat(k,c=current()){return memoDerived16('ability',k,c,()=>abilityStatV14(k,c));}
function modStat(k,c=current()){return memoDerived16('mod',k,c,()=>modStatV14(k,c));}
function saveStat(k,c=current()){return memoDerived16('save',k,c,()=>saveStatV14(k,c));}
function skillStat(k,c=current()){return memoDerived16('skill',k,c,()=>skillStatV14(k,c));}
function attackStat(k,c=current()){return memoDerived16('attack',k,c,()=>attackStatV14(k,c));}
function pbStat(c=current()){return memoDerived16('pb','',c,()=>pbStatV14(c));}
function hpLimit(c=current()){return memoDerived16('hpMax','',c,()=>hpLimitV14(c));}
function calculated(k,c=current()){return memoDerived16('calculated',k,c,()=>calculatedV14(k,c));}
function renderSheet(){SHEET_RENDER16++;QUICK_RENDERED16=false;try{return deriveBatch16(()=>{renderSheetV14();enhanceUniversal10(document);decorateOwl11(document);});}finally{SHEET_RENDER16--;}}
function renderQuick(){if(SHEET_RENDER16&&QUICK_RENDERED16)return;QUICK_RENDERED16=true;return deriveBatch16(()=>renderQuickV14());}
function decorateOwl11(doc=document){return deriveBatch16(()=>decorateOwl11V14(doc));}
function renderPrint(){PRINT_DIRTY16=true;}
function renderPrintNow16(){if(!PRINT_DIRTY16)return;deriveBatch16(()=>renderPrintV14());PRINT_DIRTY16=false;}
window.addEventListener('beforeprint',renderPrintNow16);
function renderLibrary(){if(!LIBRARY_FORCE16&&!$('libraryDrawer').open){LIBRARY_DIRTY16=true;return;}LIBRARY_DIRTY16=false;return deriveBatch16(()=>renderLibraryV14());}
function openLibrary(){openLibraryV14();if(LIBRARY_DIRTY16){LIBRARY_FORCE16=true;try{renderLibrary();}finally{LIBRARY_FORCE16=false;}}}
function renderIdentity(){const c=current(),a=appearance7(),signature=[c.id,c.name,c.race,c.background,c.alignment,c.motto,c.portrait,c.isExample,JSON.stringify(rawOf10(c).jobs),JSON.stringify(a)];if(IDENTITY16&&signature.every((x,i)=>x===IDENTITY16[i])&&$('identity').firstElementChild)return;IDENTITY16=signature;return renderIdentityV14();}
function renderTabs(){const tabs=[['overview','属性总览','dice'],['traits','特性','spark'],['inventory','物品','bag'],['spells','法术','wand'],['summons','召唤物','paw'],['notes','故事与笔记','feather']];if(!$('tab-overview'))$('sheetTabs').innerHTML=tabs.map(([id,name,ic])=>'<button id="tab-'+id+'" type="button" class="sheet-tab" data-action="sheet-tab" data-tab="'+id+'" role="tab" aria-controls="sheetContent">'+icon(ic)+name+'</button>').join('');for(const [id] of tabs){const b=$('tab-'+id);if(!b)continue;const selected=sheetTab===id;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}$('sheetContent').setAttribute('aria-labelledby','tab-'+sheetTab);}
function scheduleDOM16(doc=document){if(DOM_PENDING16.has(doc))return;DOM_PENDING16.add(doc);const win=doc.defaultView;if(!win)return;win.requestAnimationFrame(()=>{DOM_PENDING16.delete(doc);if(!doc.body)return;deriveBatch16(()=>{enhanceUniversal10(doc);foldDescriptions10(doc);decorateOwl11(doc);});});}

function syncUniversal10(doc=document,fromModel=true){return deriveBatch16(()=>syncUniversal10V14(doc,fromModel));}
function save(){return deriveBatch16(()=>saveV14());}
function refreshDerived(){return deriveBatch16(()=>refreshDerivedV14());}

function useEntries(c=current()){return memoDerived16('uses','',c,()=>useEntriesV14(c));}

/* v0.13 offline transfer, native hosts, and compact mobile tools. */
const MOBILE13=matchMedia('(max-width:700px)'),MAX_TRANSFER13=24*1024*1024;
let transferPending13=null,mobileFloat13=null;
function platform13(){return window.FolioNative?'android':window.__folioDesktop13?'windows':'web';}
function transferSnapshot13(scope='all'){
 clearTimeout(saveTimer);save();const snap=clone(rawState10());
 if(scope==='current'){snap.characters=snap.characters.filter(c=>c.id===state.activeId);for(const [k,r] of Object.entries(snap.dataLinks10||{}))if(r.path[0]==='characters'&&r.path[1]!=='id:'+state.activeId)delete snap.dataLinks10[k];}
 const refs=new Set([...(snap.favoriteIds||[]),...snap.characters.flatMap(c=>[...c.traits,...c.inventory.map(i=>i.cardId),...c.spells.map(i=>i.cardId)])]);
 for(const id of refs)if(BUILTIN.has(id)&&!snap.cards.some(c=>c.id===id))snap.cards.push(clone(rawOf10(cardById(id))));
 snap.catalogInfo={classes:CATALOG.stats.classes,races:CATALOG.stats.races,spells:CATALOG.stats.spells};return snap;
}
const CRC_TABLE13=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function checksum13(bytes){let crc=0xffffffff;for(const x of bytes)crc=CRC_TABLE13[(crc^x)&255]^(crc>>>8);return ((crc^0xffffffff)>>>0).toString(16).padStart(8,'0');}
function base64url13(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unbase6413(text){if(!/^[\w-]+$/.test(text))throw Error('互通码中有无效字符。');const s=atob(text.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(s,c=>c.charCodeAt(0));}
function encodeTransfer13(raw,scope='all'){
 const data=new TextEncoder().encode(JSON.stringify({format:'folio-transfer',protocol:1,app:'0.13',scope,created:new Date().toISOString(),data:raw}));
 if(data.length>MAX_TRANSFER13)throw Error('数据超过24 MB，请减少头像大小后生成。');const zipped=fflate.gzipSync(data,{level:6});return 'LS13.G.'+checksum13(data)+'.'+base64url13(zipped);
}
function decodeTransfer13(code){
 const text=String(code).replace(/[\s\u200b\ufeff]/g,'');if(text.length>34*1024*1024)throw Error('互通码过长。');const parts=text.split('.');if(parts.length!==4||parts[0]!=='LS13'||parts[1]!=='G'||!/^[a-f0-9]{8}$/i.test(parts[2]))throw Error('请粘贴完整的 LS13 互通码。');
 const compressed=unbase6413(parts[3]),chunks=[];let size=0;const decoder=new fflate.Gunzip((chunk)=>{size+=chunk.length;if(size>MAX_TRANSFER13)throw Error('解压数据超过24 MB。');chunks.push(chunk);});
 for(let i=0;i<compressed.length;i+=1024)decoder.push(compressed.subarray(i,i+1024),i+1024>=compressed.length);
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 if(checksum13(bytes)!==parts[2].toLowerCase())throw Error('互通码不完整或已损坏，请重新复制。');
 const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(payload.format!=='folio-transfer'||payload.protocol!==1||!['all','current'].includes(payload.scope))throw Error('不支持的互通码格式。');
 return {...payload,data:validateState(payload.data)};
}
function transferMessage13(text,error=false){const el=$('transferMessage13');if(el){el.textContent=text;el.classList.toggle('error',error);}else toast(text);}
function transferDialog13(){
 transferPending13=null;openDialog('电脑 ↔ 手机 · 互通码','<p class="form-help">互通码包含完整数据，可离线复制到另一端。先生成或粘贴，再预览导入。</p><div class="transfer13-tools"><label>生成范围<select id="transferScope13"><option value="all">全部角色与个人卡库</option><option value="current">当前角色与个人卡库</option></select></label><button type="button" class="btn primary" data-action="transfer-generate13">生成互通码</button></div><label for="transferInput13" class="transfer13-label">互通码</label><textarea id="transferInput13" rows="6" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="LS13.G.…"></textarea><div class="transfer13-buttons"><button type="button" class="btn" data-action="transfer-copy13">'+icon('copy')+'复制</button><button type="button" class="btn" data-action="transfer-paste13">'+icon('upload')+'粘贴</button><button type="button" class="btn" data-action="transfer-file13">保存码文件</button><button type="button" class="btn" data-action="transfer-load13">读取码文件</button></div><input id="transferFile13" type="file" accept=".txt,text/plain" hidden><p id="transferMessage13" role="status" class="form-help">头像较多时互通码较长，可以传送码文件。</p><button type="button" class="mini-link" data-action="transfer-undo13">恢复上次导入前的数据</button>',cancel+'<button type="button" class="btn primary" data-action="transfer-preview13">预览导入</button>');
 $('transferFile13').addEventListener('change',async ev=>{try{const f=ev.target.files[0];if(!f)return;if(f.size>34*1024*1024)throw Error('文件过大。');$('transferInput13').value=await f.text();transferMessage13('文件已读取，点击“预览导入”。');}catch(err){transferMessage13(err.message,true);}});
}
function previewTransfer13(){
 const payload=decodeTransfer13($('transferInput13').value);transferPending13=payload;const raw=rawOf10(payload.data);
 openDialog('预览互通数据','<p class="form-help">生成于 '+e(new Date(payload.created).toLocaleString('zh-CN'))+' · '+(payload.scope==='all'?'全部角色':'单个角色')+'</p><div class="transfer13-preview">'+raw.characters.map(c=>'<p><strong>'+e(c.name)+'</strong><span>共享等级 '+e(c.level)+' · '+e(c.race)+'</span></p>').join('')+'</div><p class="form-help">包含 '+raw.cards.length+' 张个人/引用卡片、'+(raw.summonCards||[]).length+' 张召唤模板、'+(raw.favoriteIds||[]).length+' 项收藏。@公式、状态与资源记录一并迁移。</p><label class="transfer13-label">导入方式<select id="transferMode13"><option value="merge" '+(payload.scope==='current'?'selected':'')+'>合并：同ID更新，其他角色保留</option><option value="replace" '+(payload.scope==='all'?'selected':'')+'>替换：使用互通码中的全部个人数据</option></select></label><p id="transferMessage13" class="form-help" role="status">导入前会自动保留恢复点；两端独立保存，修改后需重新生成并导入。</p>',cancel+'<button type="button" class="btn primary" data-action="transfer-confirm13">确认导入</button>');
}
function mergeTransfer13(source){
 const merged=clone(rawState10()),incoming=clone(rawOf10(source));
 for(const k of ['characters','cards','summonCards','extraRules']){const rows=incoming[k]||[],ids=new Set(rows.map(x=>x.id));merged[k]=[...(merged[k]||[]).filter(x=>!ids.has(x.id)),...rows];}
 for(const k of ['favoriteIds','hiddenIds','ruleFavorites'])merged[k]=[...new Set([...(merged[k]||[]),...(incoming[k]||[])])];
 const replaced={characters:new Set(incoming.characters.map(x=>'id:'+x.id)),cards:new Set(incoming.cards.map(x=>'id:'+x.id)),summonCards:new Set((incoming.summonCards||[]).map(x=>'id:'+x.id)),extraRules:new Set((incoming.extraRules||[]).map(x=>'id:'+x.id))};
 for(const [key,r] of Object.entries(merged.dataLinks10||{}))if(replaced[r.path[0]]?.has(r.path[1]))delete merged.dataLinks10[key];
 Object.assign(merged.dataLinks10,incoming.dataLinks10||{});merged.activeId=incoming.activeId;return validateState(merged);
}
function recovery13(mode,value=null){return new Promise((resolve,reject)=>{const req=indexedDB.open('folio-transfer-v13',1);req.onupgradeneeded=()=>req.result.createObjectStore('recovery');req.onerror=()=>reject(Error('无法打开导入恢复点，请先导出JSON备份。'));req.onsuccess=()=>{const db=req.result,tx=db.transaction('recovery',mode==='save'?'readwrite':'readonly'),store=tx.objectStore('recovery'),q=mode==='save'?store.put(value,'previous'):store.get('previous');let data=null;q.onsuccess=()=>data=q.result;tx.oncomplete=()=>{db.close();resolve(data)};tx.onerror=()=>{db.close();reject(Error('无法保存导入恢复点，当前数据保留。'))};};});}
async function applyTransfer13(){
 if(!transferPending13)return;const button=document.querySelector('[data-action="transfer-confirm13"]');button.disabled=true;
 try{const next=$('transferMode13').value==='merge'?mergeTransfer13(transferPending13.data):transferPending13.data;await recovery13('save',JSON.stringify(rawState10()));clearTimeout(saveTimer);state=next;transferPending13=null;sheetTab='overview';$('editorDialog').close();save();render();toast('互通数据已导入，可在互通页恢复导入前的数据。');}catch(err){button.disabled=false;transferMessage13(err.message,true);}
}
async function undoTransfer13(){const previous=await recovery13('read');if(!previous)throw Error('还没有导入恢复点。');const restored=validateState(JSON.parse(previous));confirmAction('恢复导入前的数据','将恢复上次互通导入前的角色、卡库和收藏。',()=>{state=restored;save();render();toast('已恢复导入前数据');});}
async function copyTransfer13(){const text=$('transferInput13').value;if(!text)throw Error('请先生成或粘贴互通码。');if(window.FolioNative){if(!FolioNative.copyText(text))throw Error('复制失败，可保存码文件传送。');}else if(window.__folioDesktop13)await hostRequest13('copy',{text});else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{$('transferInput13').select();if(!document.execCommand('copy'))throw Error('请长按或全选复制。');}transferMessage13('互通码已复制。');}
async function pasteTransfer13(){let value;if(window.FolioNative)value=FolioNative.readClipboard();else if(window.__folioDesktop13)value=await hostRequest13('paste',{});else if(navigator.clipboard?.readText)value=await navigator.clipboard.readText();else throw Error('请在码框中长按或使用粘贴。');$('transferInput13').value=value||'';transferMessage13('已粘贴，点击“预览导入”。');}
function nativeFile13(name,type,text){if(!FolioNative.beginExport(name,type))throw Error('还有文件正在保存，请先完成或取消。');for(let i=0;i<text.length;i+=60000)FolioNative.appendExport(text.slice(i,i+60000));FolioNative.finishExport();}
function saveCode13(){const text=$('transferInput13').value;if(!text)throw Error('请先生成互通码。');const name='旅人手札-互通码-'+new Date().toISOString().slice(0,10)+'.txt';if(window.FolioNative)nativeFile13(name,'text/plain',text);else downloadText13(name,'text/plain',text);transferMessage13('请选择文件保存位置。');}
function downloadText13(name,type,text){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function exportData(){if(!window.FolioNative)return exportDataV12();nativeFile13('旅人手札-v10-备份-'+new Date().toISOString().slice(0,10)+'.json','application/json',JSON.stringify(transferSnapshot13(),null,2));toast('请选择JSON备份保存位置');}
const HOST_WAITERS13=new Map();
function hostRequest13(type,args){return new Promise((resolve,reject)=>{const id=uid(),timer=setTimeout(()=>{HOST_WAITERS13.delete(id);reject(Error('应用操作超时。'))},10000);HOST_WAITERS13.set(id,{resolve,reject,timer});chrome.webview.postMessage({type,id,...args});});}
function hostReply13(id,ok,value){const w=HOST_WAITERS13.get(id);if(!w)return;clearTimeout(w.timer);HOST_WAITERS13.delete(id);ok?w.resolve(value):w.reject(Error(value));}
window.hostReply13=hostReply13;

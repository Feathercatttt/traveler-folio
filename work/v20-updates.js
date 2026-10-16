/* Native updater only; character data and update preferences are stored separately. */
let updateState20={phase:'idle',current:'0.23.0',automatic:true,revision:0},updateNotice20='';
async function updateRequest20(action,fields={}){
 try{const raw=platform13()==='android'?FolioNative.update20(JSON.stringify({action,...fields})):await hostRequest13('update20',{action,...fields});const value=typeof raw==='string'?JSON.parse(raw):raw;if(value.error)throw Error(value.error);onUpdate20(value);return value;}catch(err){if($('update20Status')){$('update20Status').textContent=err.message;$('update20Status').setAttribute('role','alert');}else toast(err.message);throw err;}
}
function onUpdate20(value){
 if((value.revision||0)<(updateState20.revision||0))return;updateState20=value;renderUpdate20();
 const available=['available','ready'].includes(value.phase);$('updateButton20')?.classList.toggle('has-update20',available);
 if(available&&value.latest&&updateNotice20!==value.latest){updateNotice20=value.latest;toast('旅人手札 v'+value.latest+' 可更新 · 在“更新”中查看');}
}
function renderUpdate20(){
 const root=$('update20Status');if(!root)return;const s=updateState20,busy=['checking','downloading','installing'].includes(s.phase),ready=s.phase==='ready',available=s.latest&&s.latest!==s.current;
 $('update20Version').textContent='当前 v'+s.current+(s.latest?'  /  最新 v'+s.latest:'');
 root.textContent=s.message||'可手动检查更新。';root.setAttribute('role',s.phase==='error'?'alert':'status');
 const notes=$('update20Notes');notes.textContent=s.notes||'';notes.hidden=!s.notes;
 const progress=$('update20Progress'),downloading=s.phase==='downloading',percent=s.total?Math.min(100,Math.floor((s.received||0)/s.total*100)):0;progress.hidden=!downloading;$('update20Meter').value=percent;
 $('update20Bytes').textContent=(s.route?s.route+' · ':'')+(downloading?percent+'% · '+((s.received||0)/1048576).toFixed(1)+' / '+((s.total||0)/1048576).toFixed(1)+' MB'+(s.speed?' · '+(s.speed/1048576).toFixed(1)+' MB/s':''):s.checkedAt?'上次检查 '+new Date(s.checkedAt*1000).toLocaleString('zh-CN'):'');
 $('update20Check').disabled=busy;$('update20Download').hidden=!available||ready;$('update20Download').disabled=busy;$('update20Install').hidden=!ready;$('update20Install').disabled=busy;$('update20Cancel').hidden=!['checking','downloading'].includes(s.phase);$('update20SettingsSave').disabled=busy;
}
async function updateDialog20(){
 if(platform13()==='web')return;const s=updateState20;
 openDialog('旅人手札 · 更新','<section data-update20 class="update20"><p id="update20Version" class="update20-version"></p><p id="update20Status" aria-live="polite"></p><div id="update20Progress" hidden><progress id="update20Meter" max="100" value="0" aria-label="更新下载进度"></progress></div><small id="update20Bytes" class="form-help"></small><p id="update20Notes" class="update20-notes" hidden></p><div class="update20-actions"><button type="button" class="btn" id="update20Check" data-update-action20="check">检查更新</button><button type="button" class="btn primary" id="update20Download" data-update-action20="download" hidden>下载安装包</button><button type="button" class="btn primary" id="update20Install" data-update-action20="install" hidden>'+(platform13()==='android'?'打开系统安装确认':'保存并更新重启')+'</button><button type="button" class="btn" id="update20Cancel" data-update-action20="cancel" hidden>取消</button></div><details class="update20-settings"><summary>检查与下载设置 <small>线路故障时可切换</small></summary><label class="update20-auto"><input type="checkbox" id="update20Auto" '+(s.automatic?'checked':'')+'> 启动后自动检查（每 6 小时最多一次）</label><label>优先下载线路<select id="update20Route"><option value="">自动 · 镜像优先</option><option value="https://gh-proxy.org/">镜像一 · gh-proxy.org</option><option value="https://ghfast.top/">镜像二 · ghfast.top</option><option value="https://ghproxy.net/">镜像三 · ghproxy.net</option><option value="direct">GitHub 直连</option></select></label><label>自定义镜像前缀（可留空）<input id="update20Custom" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://你的镜像地址/" value="'+e(s.custom||'')+'"></label><p class="form-help">按“镜像前缀 + GitHub 原地址”访问公开更新文件。只传输版本信息与安装包，不上传角色资料。线路失败会自动尝试其他镜像和直连。</p><button type="button" class="btn" id="update20SettingsSave" data-update-action20="settings">保存设置</button></details><p class="form-help update20-footnote">安装前验证发布签名与文件校验值。'+(platform13()==='android'?'安卓需要允许本应用安装更新，并由你在系统窗口确认。':'更新前会保存记录，替换失败会尝试恢复旧文件；请将软件解压到可写文件夹。')+'<br>公共镜像的可用性取决于网络和服务状态。</p><a href="https://github.com/Feathercatttt/traveler-folio/releases" target="_blank" rel="noopener">GitHub 发布与更新说明 ↗</a></section>',cancel);
 $('update20Route').value=s.preferred||'';renderUpdate20();await updateRequest20('state').catch(()=>{});
}
document.addEventListener('click',async ev=>{const button=ev.target.closest('[data-update-action20]');if(!button)return;ev.preventDefault();try{const action=button.dataset.updateAction20;if(action==='open'){await updateDialog20();return;}if(action==='settings'){await updateRequest20('settings',{automatic:$('update20Auto').checked,custom:$('update20Custom').value,preferred:$('update20Route').value});toast('更新设置已保存');return;}if(action==='install'){button.disabled=true;clearTimeout(saveTimer);save();await new Promise(r=>setTimeout(r,400));}await updateRequest20(action);}catch{button.disabled=false;}});
function initUpdate20(){
 if(platform13()==='web')return;
 $('libraryToggle').insertAdjacentHTML('afterend','<button type="button" id="updateButton20" class="btn no-print" data-update-action20="open" title="检查更新与镜像下载">'+icon('download')+'<span>更新</span></button>');
 updateRequest20('state').catch(()=>{});setTimeout(()=>updateRequest20('auto').catch(()=>{}),4500);
}
initUpdate20();

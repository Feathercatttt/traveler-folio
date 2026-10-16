/* Keep the last local edit if the window reloads before the 200 ms bridge publish. */
function pendingBridge17(value){try{if(value===null)localStorage.removeItem('folio-pending-bridge17');else localStorage.setItem('folio-pending-bridge17',String(value));}catch{}}
function save(){if(OBR11.enabled)pendingBridge17(OBR11.revision);return saveV16();}
async function publishOwl11(){const result=await publishOwl11V16();if(OBR11.enabled)pendingBridge17(JSON.stringify(rawState10())===OBR11.lastRaw?null:OBR11.revision);return result;}
async function adoptOwl11(){
 const marker=localStorage.getItem('folio-pending-bridge17');
 if(marker!==null&&!loadProblem&&!OBR11.sending){const remote=await obrApi11('/api/state');if(!remote.raw||Number(marker)===remote.revision){OBR11.revision=remote.revision;OBR11.lastRaw='';OBR11.dirty=true;return false;}
  if(remote.raw!==JSON.stringify(rawState10())){localStorage.setItem('folio-owlbear-conflict-backup',JSON.stringify(rawState10()));toast('本机有尚未同步的修改，已另存冲突备份；正在载入桥接的较新记录。');}
 }
 pendingBridge17(null);return adoptOwl11V16();
}

// Owlbear host protocol adapter. The child iframes load the unmodified release bundles and SDK.
const folioBase24='http://localhost:17784',frames24=new Map();let serial24=0;
window.state24={meta:{},items:[],local:[],player:{id:'gm',name:'DM',role:'GM',connectionId:'connection-gm',color:'#e0b86c',selection:[],metadata:{}},calls:[],actions:[],unknown:[]};
function send24(f,id,data){try{f.frame.contentWindow.postMessage({id,data},folioBase24);}catch{}}
window.event24=(id,data)=>{for(const f of frames24.values())send24(f,id,data);};
window.meta24=update=>{Object.assign(state24.meta,update);event24('OBR_SCENE_METADATA_EVENT_CHANGE',{metadata:state24.meta});};
function updateInert24(){document.getElementById('outside24').inert=[...frames24.values()].some(f=>f.modal&&!f.pass);}
window.frame24=(id,path,{width=500,height=720,x=16,y=64,modal=false,pass=false,hidden=false,hidePaper=true}={})=>{
 for(const f of frames24.values())if(f.id===id){f.frame.remove();frames24.delete(f.ref);}
 const ref='qa-'+(++serial24),f=document.createElement('iframe'),u=new URL(path,folioBase24+'/');u.searchParams.set('obrref',btoa(location.origin+' room24'));f.src=u.href;f.dataset.folioId=id;f.setAttribute('title',id);f.allow='autoplay';f.style.cssText=hidden?'display:none':modal?'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:100;background:transparent;'+(pass?'pointer-events:none;':''):`position:fixed;left:${x}px;top:${y}px;width:${width}px;height:${height}px;border:0;z-index:20;background:${hidePaper?'transparent':'#2d2520'};`;
 const row={id,ref,frame:f,channels:new Set(),modal,pass};frames24.set(ref,row);(modal?document.body:document.getElementById('outside24')).append(f);f.onload=()=>{let n=0;const timer=setInterval(()=>{if(!f.isConnected||row.responded||++n>60){clearInterval(timer);return;}send24(row,'OBR_READY',{ref,userId:'gm'});},60);};updateInert24();return id;
};
window.close24=id=>{for(const [key,f] of frames24)if(f.id===id){f.frame.remove();frames24.delete(key);}updateInert24();};
window.addEventListener('message',async event=>{
 if(event.origin!==folioBase24)return;const msg=event.data;if(!msg?.id)return;const f=[...frames24.values()].find(f=>f.frame.contentWindow===event.source);if(!f)return;f.responded=true;const a=msg.data||{},id=msg.id;state24.calls.push({id,data:a});let result={};
 try{
 if(id==='OBR_PLAYER_GET_ID')result={id:'gm'};
 else if(id==='OBR_PLAYER_GET_NAME')result={name:state24.player.name};
 else if(id==='OBR_PLAYER_GET_ROLE')result={role:state24.player.role};
 else if(id==='OBR_PLAYER_GET_COLOR')result={color:state24.player.color};
 else if(id==='OBR_PLAYER_GET_CONNECTION_ID')result={connectionId:state24.player.connectionId};
 else if(id==='OBR_PLAYER_GET_METADATA')result={metadata:state24.player.metadata};
 else if(id==='OBR_PLAYER_GET_SELECTION')result={selection:state24.player.selection};
 else if(id==='OBR_PLAYER_SET_METADATA'){Object.assign(state24.player.metadata,a.update);event24('OBR_PLAYER_EVENT_CHANGE',{player:state24.player});}
 else if(id==='OBR_PLAYER_SELECT'){state24.player.selection=a.items;event24('OBR_PLAYER_EVENT_CHANGE',{player:state24.player});}
 else if(id==='OBR_PLAYER_DESELECT'){state24.player.selection=[];event24('OBR_PLAYER_EVENT_CHANGE',{player:state24.player});}
 else if(id==='OBR_PARTY_GET_PLAYERS')result={players:[]};
 else if(id==='OBR_SCENE_IS_READY')result={ready:true};
 else if(id==='OBR_SCENE_GET_METADATA')result={metadata:state24.meta};
 else if(id==='OBR_SCENE_SET_METADATA')meta24(a.update);
 else if(/^OBR_SCENE_(ITEMS|LOCAL)_GET_(ALL_ITEMS|ITEMS|ITEM_ATTACHMENTS)$/.test(id)){const rows=id.includes('_LOCAL_')?state24.local:state24.items;result={items:id.endsWith('_GET_ITEM_ATTACHMENTS')?rows.filter(x=>(a.ids||[]).includes(x.attachedTo)):a.ids?rows.filter(x=>a.ids.includes(x.id)):rows};}
 else if(/^OBR_SCENE_(ITEMS|LOCAL)_(ADD|UPDATE|DELETE)_ITEMS$/.test(id)){const key=id.includes('_LOCAL_')?'local':'items';if(id.includes('_ADD_'))state24[key].push(...a.items);if(id.includes('_UPDATE_'))for(const update of a.updates){const row=state24[key].find(x=>x.id===update.id);if(row)Object.assign(row,update);}if(id.includes('_DELETE_'))state24[key]=state24[key].filter(x=>!a.ids.includes(x.id));event24(key==='items'?'OBR_SCENE_ITEMS_EVENT_CHANGE':'OBR_SCENE_LOCAL_EVENT_CHANGE',{items:state24[key]});}
 else if(id.includes('GET_ITEM_BOUNDS'))result={bounds:{width:100,height:100,min:{x:0,y:0},max:{x:100,y:100},center:{x:50,y:50}}};
 else if(id==='OBR_SCENE_GRID_GET_DPI')result={dpi:100};
 else if(id==='OBR_VIEWPORT_GET_WIDTH')result={width:innerWidth};
 else if(id==='OBR_VIEWPORT_GET_HEIGHT')result={height:innerHeight};
 else if(id==='OBR_VIEWPORT_GET_POSITION')result={position:{x:0,y:0}};
 else if(id==='OBR_VIEWPORT_GET_SCALE')result={scale:1};
 else if(id==='OBR_POPOVER_OPEN'){frame24(a.id,a.url,{width:a.width,height:a.height,x:a.anchorPosition?.left,y:a.anchorPosition?.top,hidePaper:a.hidePaper});}
 else if(id==='OBR_MODAL_OPEN'){frame24(a.id,a.url,{modal:true,pass:a.disablePointerEvents});}
 else if(id==='OBR_POPOVER_CLOSE'||id==='OBR_MODAL_CLOSE')close24(a.id);
 else if(id==='OBR_POPOVER_SET_WIDTH'||id==='OBR_POPOVER_SET_HEIGHT'){const row=[...frames24.values()].find(f=>f.id===a.id);if(row)row.frame.style[id.endsWith('WIDTH')?'width':'height']=(a.width??a.height)+'px';}
 else if(id==='OBR_BROADCAST_SUBSCRIBE')f.channels.add(a.channel);
 else if(id==='OBR_BROADCAST_UNSUBSCRIBE')f.channels.delete(a.channel);
 else if(id==='OBR_BROADCAST_SEND_MESSAGE'){if(a.options?.destination!=='REMOTE')for(const row of frames24.values())if(row.channels.has(a.channel))send24(row,'OBR_BROADCAST_MESSAGE_'+a.channel,{data:a.data,connectionId:'connection-gm'});}
 else if(id==='OBR_ACTION_SET_WIDTH'||id==='OBR_ACTION_SET_HEIGHT'){const card=[...frames24.values()].find(x=>x.id==='mini24');if(card)card.frame.style[id.endsWith('WIDTH')?'width':'height']=(a.width??a.height)+'px';}
 else if(id==='OBR_ACTION_CLOSE')close24(f.id);
 else if(id==='OBR_ACTION_OPEN')frame24('mini24','panel.html',{width:440});
 else if(id==='OBR_ASSETS_UPLOAD_IMAGES'){if(state24.uploadError27)throw Error(state24.uploadError27);state24.uploads27=(state24.uploads27||0)+1;}
 else if(id==='OBR_ASSETS_DOWNLOAD_IMAGES')result={images:state24.cancelImage27?[]:[{name:'怪物图鉴立绘',image:{url:'https://images.test/monster-uploaded.png',width:512,height:512,mime:'image/png'},grid:{dpi:100,offset:{x:256,y:256}},scale:{x:1,y:1}}]};
 else if(id==='OBR_TOOL_ACTION_CREATE'){state24.actions.push(a.id);}
 else if(id==='OBR_ROOM_GET_PERMISSIONS')result={permissions:[]};
 else if(id.endsWith('_SUBSCRIBE')||id.endsWith('_UNSUBSCRIBE')||id.includes('_CREATE')||id.includes('_REMOVE')||id.includes('_UPLOAD_')||id.includes('_NOTIFICATION_')||id.includes('_ANIMATE_')||id.includes('_ACTIVATE')){}
 else if(!state24.unknown.includes(id))state24.unknown.push(id);
 if(msg.nonce)send24(f,id+'_RESPONSE'+msg.nonce,result);
 }catch(error){if(msg.nonce)send24(f,id+'_ERROR'+msg.nonce,{message:error.message});}
});

import OBR from '@owlbear-rodeo/sdk';
import {openWindow21} from './obr-window21.mjs';
import {NS19} from './obr-tools-model19.mjs';
import {connectLocal21,bridgeStatus21} from './obr-host21.mjs';
OBR.onReady(async()=>{const tools=new URLSearchParams(location.search).get('kind')==='tools';let opening=false;const open=async()=>{if(opening)return;opening=true;const linking=!bridgeStatus21().online&&!tools?connectLocal21(true).catch(async e=>{try{await OBR.notification.show('角色卡未连到本机：'+e.message,'WARNING');}catch{}return null;}):Promise.resolve(null);try{await openWindow21(tools?NS19+'/panel':'local.adventurer-folio/sheet',tools?'tools19.html':'panel.html',{width:tools?500:440,height:720});await linking;await OBR.action.close();}catch(e){document.getElementById('notice21').textContent=e.message;opening=false;}};document.getElementById('open21').onclick=()=>void open();await open().catch(e=>{document.getElementById('notice21').textContent=e.message;opening=false;});});

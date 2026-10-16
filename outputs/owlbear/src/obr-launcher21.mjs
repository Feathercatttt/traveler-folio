import OBR from '@owlbear-rodeo/sdk';
import {openWindow21} from './obr-window21.mjs';
import {NS19} from './obr-tools-model19.mjs';
import {asset21} from './obr-host21.mjs';
OBR.onReady(async()=>{const tools=new URLSearchParams(location.search).get('kind')==='tools';if(!tools){await Promise.all([OBR.action.setWidth(440),OBR.action.setHeight(720)]);location.replace(asset21('panel.html'));return;}let opening=false;const open=async()=>{if(opening)return;opening=true;try{await openWindow21(NS19+'/panel','tools19.html',{width:500,height:720});await OBR.action.close();}catch(e){document.getElementById('notice21').textContent=e.message;opening=false;}};document.getElementById('open21').onclick=()=>void open();await open();});

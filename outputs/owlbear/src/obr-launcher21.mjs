import OBR from '@owlbear-rodeo/sdk';
import {openWindow21} from './obr-window21.mjs';
import {NS19} from './obr-tools-model19.mjs';
OBR.onReady(async()=>{const tools=new URLSearchParams(location.search).get('kind')==='tools';const open=async()=>{await openWindow21(tools?NS19+'/panel':'local.adventurer-folio/sheet',tools?'tools19.html':'panel.html',{width:tools?500:440,height:720});await OBR.action.close();};document.getElementById('open21').onclick=open;await open().catch(e=>document.getElementById('notice21').textContent=e.message);});

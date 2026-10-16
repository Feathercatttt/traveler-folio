import OBR from '@owlbear-rodeo/sdk';
import {subscribeToSfx,primeAudio19} from './obr-sound19.mjs';
export {subscribeToSfx,primeAudio19};
export default function(){OBR.onReady(()=>{subscribeToSfx();const b=document.createElement('button');b.type='button';b.textContent='跑团工具';b.style.cssText='position:sticky;bottom:8px;margin:8px;z-index:4';b.onclick=()=>{primeAudio19();OBR.popover.open({id:'local.adventurer-folio/tools19/panel',url:'/tools19.html',width:470,height:700,disableClickAway:true});};document.body.append(b);});}

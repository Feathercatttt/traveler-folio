import OBR from '@owlbear-rodeo/sdk';
import {STAGE19,SET19,NS19,safeMedia19} from './obr-tools-model19.mjs';
import {stageState21} from './obr-stage21.mjs';
let meta={},last='';
function paint(){const s=stageState21(meta[STAGE19]);if(!s.live||meta[SET19]?.theatre===false){OBR.modal.close(NS19+'/stage-display').catch(()=>{});return;}const signature=JSON.stringify(s);if(signature===last)return;last=signature;const host=document.getElementById('stage');host.className='stage '+s.filter;document.body.classList.add('cinema');const previous=new Map([...host.children].map(n=>[n.dataset.id,n])),nodes=[];
 for(const c of s.roster21.filter(r=>r.enabled&&r.visible)){const r=c.expressions?.[c.expression];if(!r||!safeMedia19(r.url))continue;const el=previous.get(c.id)||document.createElement('div');el.className='standing '+(c.effect||'none');el.dataset.id=c.id;let img=el.querySelector('img');if(!img){img=document.createElement('img');el.append(img);}if(img.src!==r.url)img.src=r.url;img.alt=c.name;let name=el.querySelector('span');if(!name){name=document.createElement('span');el.append(name);}name.textContent=c.name;nodes.push(el);}host.replaceChildren(...nodes);
}
OBR.onReady(async()=>{meta=await OBR.scene.getMetadata();OBR.scene.onMetadataChange(x=>{meta=x;paint();});OBR.scene.onReadyChange(x=>{if(!x)OBR.modal.close(NS19+'/stage-display').catch(()=>{});});paint();});

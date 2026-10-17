import OBR,{buildEffect} from '@owlbear-rodeo/sdk';
import {NS19} from './obr-tools-model19.mjs';
const key=NS19+'/filter21';let current='',serial=Promise.resolve();
// Viewport pixels are sampled with the view transform. modelView belongs to an
// individual/attached effect, not the full-screen camera. SRC replaces the
// post-process pass and preserves its alpha instead of blending it twice.
// https://docs.owlbear.rodeo/extensions/reference/effects/
export function filterShader21(mode){const grade={memory:'rgb=mix(rgb,vec3(dot(rgb,vec3(.393,.769,.189)),dot(rgb,vec3(.349,.686,.168)),dot(rgb,vec3(.272,.534,.131))),.72);',noir:'rgb=vec3(dot(rgb,vec3(.2126,.7152,.0722)));rgb=(rgb-.5)*1.12+.5;',ghost:'rgb=mix(rgb,vec3(.28,.58,.52)*dot(rgb,vec3(.3,.59,.11))*1.8,.58);',warm:'rgb=rgb*vec3(1.09,1.02,.87);',dream:'rgb=mix(rgb,vec3(.66,.52,.78),.16);',rain:'float r=step(.984,fract(uv.x*.021+uv.y*.007+mod(time,100.)*.8));rgb=mix(rgb,vec3(.6,.72,.8),r*.16);rgb*=vec3(.89,.95,1.02);',glitch:'float stripe=step(.988,fract(uv.y*.009+mod(time,100.)*.14));rgb.r=scene.eval(uv+vec2(stripe*5.,0.)).r/max(c.a,.001);'}[mode]||'';
 return `uniform shader scene;uniform mat3 view;uniform float time;half4 main(float2 coord){vec2 uv=(vec3(coord,1)*view).xy;half4 c=scene.eval(uv);vec3 rgb=c.rgb/max(c.a,.001);${grade}return half4(clamp(rgb,vec3(0.),vec3(1.))*c.a,c.a);}`;
}
export function syncFilter21(mode='none'){serial=serial.catch(()=>{}).then(async()=>{if(!['none','memory','noir','ghost','warm','dream','rain','glitch'].includes(mode))mode='none';if(mode===current)return;const old=(await OBR.scene.local.getItems()).filter(i=>i.metadata?.[key]);if(old.length)await OBR.scene.local.deleteItems(old.map(i=>i.id));current='none';if(mode==='none')return;const effect=buildEffect().name('旅人剧场 · '+mode).effectType('VIEWPORT').blendMode('SRC').sksl(filterShader21(mode)).layer('POST_PROCESS').locked(true).disableHit(true).metadata({[key]:true}).build();await OBR.scene.local.addItems([effect]);current=mode;});return serial;}
export function resetFilter21(){current='';return syncFilter21('none');}

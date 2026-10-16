import OBR from '@owlbear-rodeo/sdk';
import {CMD19} from './obr-tools-model19.mjs';

// Position changes use the same GM-authoritative channel as entrances and expressions.
export async function stageAction24(type,fields={}){
 const [id,party]=await Promise.all([OBR.player.getId(),OBR.party.getPlayers()]);
 const me={id,role:await OBR.player.getRole(),connectionId:await OBR.player.getConnectionId()};
 if(![me,...party].some(p=>p.role==='GM'))throw Error('DM 未在线，无法同步立绘位置');
 const request=crypto.randomUUID();
 return new Promise((resolve,reject)=>{
  const off=OBR.broadcast.onMessage(CMD19+'/reply',event=>{
   if(event.data?.id!==request||event.data?.to!==id||![me,...party].some(p=>p.role==='GM'&&p.connectionId===event.connectionId))return;
   off();clearTimeout(timer);event.data.error?reject(Error(event.data.error)):resolve();
  });
  const timer=setTimeout(()=>{off();reject(Error('立绘位置同步超时，请确认 DM 已启用跑团工具'));},12000);
  OBR.broadcast.sendMessage(CMD19,{id:request,type,...fields},{destination:'ALL'}).catch(err=>{off();clearTimeout(timer);reject(err);});
 });
}

export const stagePosition23=(performerId,position,scale24)=>stageAction24('stage-position',{performerId,position,...(scale24===undefined?{}:{scale24})});

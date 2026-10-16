import OBR from '@owlbear-rodeo/sdk';
import {subscribeToSfx,primeAudio19} from './obr-sound19.mjs';
export {subscribeToSfx,primeAudio19};
export default function(){OBR.onReady(()=>subscribeToSfx());}

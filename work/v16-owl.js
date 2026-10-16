let INSTALLATION16='';
function installationId16(){if(!INSTALLATION16){INSTALLATION16=localStorage.getItem('folio-installation16')||uid();localStorage.setItem('folio-installation16',INSTALLATION16);}return INSTALLATION16;}
function owlView11(){return deriveBatch16(()=>({...owlView11V14(),installationId:installationId16()}));}
function handleOwlCommand11(x){if(x.type==='focus-main'){if(platform13()==='windows')hostRequest13('main-focus',{}).catch(()=>{});else window.focus();return;}return handleOwlCommand11V16Previous(x);}

async function connectOwl11(){const result=await connectOwl11V14();if(OBR11.enabled){OBR11.lastRaw='';queueOwl11();}return result;}

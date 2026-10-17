// Render the actual SkSL with Skia/CanvasKit, including a panned/zoomed viewport.
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const init=require('./qa27-runtime/node_modules/canvaskit-wasm/bin/canvaskit.js');
(async()=>{const CK=await init({locateFile:n=>path.resolve('work/qa27-runtime/node_modules/canvaskit-wasm/bin',n)});
 const source=fs.readFileSync('outputs/owlbear/src/obr-filters21.mjs','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),get=Function('NS19',source+';return filterShader21;')('qa');
 const info={width:96,height:64,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB},checks=[];
 const sceneEffect=CK.RuntimeEffect.Make('half4 main(float2 p){if(p.x<0||p.y<0||p.x>=96||p.y>=64)return half4(0);return half4(.2+p.x/192,.25+p.y/128,.65,.85);}');assert(sceneEffect);const scene=sceneEffect.makeShader([]);
 for(const mode of ['none','memory','noir','ghost','warm','dream','rain','glitch']){
  let error='';const effect=CK.RuntimeEffect.Make(get(mode),x=>error+=x);assert(effect,error);assert.equal(effect.getUniformName(0),'view');
  const outputs=[];
  for(const transform of [false,true]){
   // world -> view uses row-vector multiplication as documented by Owlbear.
   const uniforms=transform?[1.5,0,21,0,1.5,-12,0,0,1,1700000000]:[1,0,0,0,1,0,0,0,1,1700000000];
   const shader=effect.makeShaderWithChildren(uniforms,[scene]);assert(shader);
   const surface=CK.MakeSurface(info.width,info.height),canvas=surface.getCanvas(),paint=new CK.Paint();paint.setShader(shader);paint.setBlendMode(CK.BlendMode.Src);
   if(transform){canvas.translate(21,-12);canvas.scale(1.5,1.5);}canvas.drawPaint(paint);surface.flush();
   const image=surface.makeImageSnapshot(),pixels=image.readPixels(0,0,info);assert(pixels);outputs.push(pixels);
   const samples=[(12*96+12)*4,(32*96+48)*4,(50*96+80)*4].map(i=>[...pixels.slice(i,i+4)]);
   assert(samples.every(p=>p[0]+p[1]+p[2]>65&&p[3]>210&&p[3]<225),JSON.stringify({mode,transform,samples}));
   if(mode==='noir')assert(samples.every(p=>Math.abs(p[0]-p[1])<3&&Math.abs(p[1]-p[2])<3));
   if(!transform)fs.writeFileSync('outputs/v0.27-滤镜-'+mode+'.png',image.encodeToBytes());
   image.delete();paint.delete();shader.delete();surface.delete();
  }
  // Panning and zooming the map must not turn screen-space scene sampling black.
  const delta=outputs[0].reduce((n,v,i)=>n+Math.abs(v-outputs[1][i]),0)/outputs[0].length;assert(delta<.8,{mode,delta});
  checks.push(mode+': SkSL compile, non-black pixels, preserved alpha, viewport pan/zoom');effect.delete();
 }
 scene.delete();sceneEffect.delete();
 fs.writeFileSync('work/v27-shader-report.json',JSON.stringify({success:true,checks,runtime:'Skia CanvasKit 0.41.1 CPU runtime effects',limits:['Authentic Owlbear room GPU rendering still requires in-room validation']},null,2));console.log(checks);
})().catch(e=>{console.error(e);process.exitCode=1;});

const FolioDice14=(()=>{
// Chinese annotations are display labels, never part of the arithmetic.
function normalizeNotation(notation){
 let text=String(notation).trim();if(text.length>1000)throw Error('公式过长');
 text=text.replace(/[（]/g,'(').replace(/[）]/g,')').replace(/[×＊]/g,'*').replace(/[÷／]/g,'/').replace(/[−–]/g,'-');
 // A textual parenthesis (e.g. 挥砍,2环) is removed as a whole. Arithmetic parentheses stay intact.
 for(let n=0;n<20;n++){const next=text.replace(/\([^()]*[\u3400-\u9fff][^()]*\)/g,'');if(next===text)break;text=next;}
 text=text.replace(/[\u3400-\u9fff]+(?:[，、：:][\u3400-\u9fff]+)*/g,'').trim();
 if(!text)throw Error('公式中没有数值或骰子');
 return text;
}
function rollText(notation,randomFace=face){
 const source=normalizeNotation(notation);
 if(source.length>1000)throw Error('公式过长');
 const tokens=source.match(/\d+d\d+(?:(?:kh|kl|dh|dl)\d+)?|d\d+(?:(?:kh|kl|dh|dl)\d+)?|\d+(?:\.\d+)?|[()+*/-]/gi)||[];
 if(tokens.join('')!==source.replace(/\s/g,''))throw Error('无法识别公式；请先把 @ 引用转换为数值');
 let at=0,count=0;const detail=[];
 function primary(){const t=tokens[at++];if(t==='+'||t==='-')return (t==='-'?-1:1)*primary();if(t==='('){const v=sum();if(tokens[at++]!==')')throw Error('括号未闭合');return v;}if(t===undefined)throw Error('公式未完成');
  if(/d/i.test(t)){const m=t.match(/^(\d*)d(\d+)(?:(kh|kl|dh|dl)(\d+))?$/i),n=Number(m[1]||1),sides=Number(m[2]),mode=m[3]?.toLowerCase(),keep=Number(m[4]||0);count+=n;
   if(n<1||count>200||sides<2||sides>100000||keep>n)throw Error('骰子数量、面数或保留数量超出范围');
   const values=Array.from({length:n},()=>randomFace(sides)),sorted=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value),used=new Set(values.map((_,i)=>i));
   if(mode){let picked;if(mode==='kh')picked=sorted.slice(n-keep);if(mode==='kl')picked=sorted.slice(0,keep);if(mode==='dh')picked=sorted.slice(0,n-keep);if(mode==='dl')picked=sorted.slice(keep);used.clear();for(const v of picked)used.add(v.index);}
   const total=values.reduce((a,x,i)=>a+(used.has(i)?x:0),0);detail.push(t+' ['+values.map((x,i)=>used.has(i)?x:'('+x+')').join(', ')+']');return total;
  }if(!/^\d+(?:\.\d+)?$/.test(t))throw Error('公式无效');return Number(t);
 }
 function product(){let v=primary();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++],rhs=primary();if(op==='/'&&rhs===0)throw Error('不能除以零');v=op==='*'?v*rhs:v/rhs;}return v;}
 function sum(){let v=product();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++],rhs=product();v=op==='+'?v+rhs:v-rhs;}return v;}
 const value=sum();if(at!==tokens.length||!Number.isFinite(value)||Math.abs(value)>1e12)throw Error('计算结果无效');
 return {value,summary:source+' = '+Number(value.toFixed(6)),detail:detail.join(' · ')};
}
function face(sides){const cap=Math.floor(4294967296/sides)*sides,v=new Uint32Array(1);do{crypto.getRandomValues(v);}while(v[0]>=cap);return v[0]%sides+1;}
return {rollText,normalizeNotation};})();
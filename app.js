const $ = id => document.getElementById(id);
const P = Math.PI;
const blue = "#2456b4", gold = "#a66b00";
const specs = {
  sin: {inv:"arcsin", f:Math.sin, g:Math.asin, limits:[-P/2,P/2], range:"[−π/2; π/2]", period:2*P},
  cos: {inv:"arccos", f:Math.cos, g:Math.acos, limits:[0,P], range:"[0; π]", period:2*P},
  tg: {inv:"arctg", f:Math.tan, g:Math.atan, limits:[-P/2,P/2], range:"(−π/2; π/2)", period:P, pole:P/2},
  ctg: {inv:"arcctg", f:x=>1/Math.tan(x), g:x=>P/2-Math.atan(x), limits:[0,P], range:"(0; π)", period:P,pole:0}
};
const bounded = s => s.period === 2*P;
const near = (a,b) => Math.abs(a-b)<1e-8;
const num = x => (near(x,0)?0:x).toLocaleString("ru",{maximumFractionDigits:3});
function angle(x) {
  if (near(x,0)) return "0";
  const n = Math.round(x/P*12);
  if (!near(x,n*P/12)) return "≈ "+num(x);
  let d = 12, m = Math.abs(n);
  for (const k of [12,6,4,3,2]) if (m%k===0) {m/=k; d/=k; break;}
  return (n<0?"−":"")+(m===1?"":m)+"π"+(d===1?"":"/"+d);
}
function chart(id, lo, hi, bottom, top, square=false) {
  const c=$(id), w=c.clientWidth, h=c.clientHeight, d=devicePixelRatio||1;
  c.width=w*d; c.height=h*d;
  const ctx=c.getContext("2d"); ctx.scale(d,d);
  const scale=Math.min((w-54)/(hi-lo),(h-48)/(top-bottom));
  const sx=square?scale:(w-54)/(hi-lo), sy=square?scale:(h-48)/(top-bottom);
  const X=x=>w/2+(x-(hi+lo)/2)*sx, Y=y=>h/2-(y-(top+bottom)/2)*sy;
  const line=(points,color,width=2,dash=[])=>{
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
    points.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));
    ctx.stroke();ctx.setLineDash([]);
  };
  const dot=(x,y,color,filled=true)=>{
    ctx.beginPath();ctx.arc(X(x),Y(y),5,0,2*P);ctx.fillStyle=filled?color:"white";ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  };
  const label=(x,y,t,dx=0,dy=0)=>{ctx.fillStyle="#425271";ctx.font="12px system-ui";ctx.fillText(t,X(x)+dx,Y(y)+dy);};
  const curve=(fn,a,b,color,width=2)=>{
    if(b<=a)return;
    let pts=[];
    for(let i=0;i<=500;i++){
      const x=a+(b-a)*i/500,y=fn(x);
      if(Number.isFinite(y)&&y>=bottom&&y<=top) pts.push([x,y]);
      else {line(pts,color,width);pts=[];}
    }
    line(pts,color,width);
  };
  line([[lo,0],[hi,0]],"#a8b4ca",1);line([[0,bottom],[0,top]],"#a8b4ca",1);
  label(hi,0,"x",4,-6);label(0,top,"y",5,0);
  return {line,dot,curve,label};
}
function poles(s,lo,hi) {
  return s.pole===undefined?[]:Array.from({length:Math.ceil((hi-lo)/P)+2},(_,i)=>s.pole+(Math.ceil((lo-s.pole)/P)+i)*P).filter(x=>x>=lo&&x<=hi);
}
function direct(c,s,lo,hi,color) {
  const cuts=[lo,...poles(s,lo,hi).filter(x=>x>lo&&x<hi),hi];
  cuts.slice(1).forEach((b,i)=>c.curve(s.f,cuts[i]+1e-6,b-1e-6,color));
}
const options=Object.keys(specs).map(k=>'<option>'+k+'</option>').join("");
if ($("inverse-kind")) $("inverse-kind").innerHTML=options;
let stage = 0;
function inverse(){
  const kind=$("inverse-kind").value, s=specs[kind], a=+$("inverse-input").value;
  const valid=!bounded(s)||Math.abs(a)<=1;
  const [lo,hi]=s.limits;
  const inverseAngle=s.g;
  const range=s.range;
  drawInverseCircle(kind,valid?a:null);
  $("inverse-a").textContent=num(a);
  $("inverse-range").textContent="Допустимый вход a: "+(bounded(s)?"[−1; 1]":"ℝ")+(stage?" · Углы выбранной ветви: "+range:"");
  const notes=[
    "Двигайте горизонтальный уровень y = a. Каждая точка пересечения даёт угол. Если точек несколько, угол по одному значению определить однозначно нельзя.",
    "Оставьте одну монотонную ветвь. На ней горизонтальная линия пересекает график ровно один раз при каждом допустимом a. На окружности выделена дуга, которую используют в школе.",
    "Меняем координаты местами: (угол, значение) превращается в (значение, угол). Это отражение относительно y = x."
  ];
  $("stage-note").textContent=notes[stage];
  $("inverse-legend").textContent=["Синий — исходный график · золотой — уровень a","Синий — выбранная ветвь · золотой — уровень a","Синий — выбранная ветвь · золотой — обратный график · пунктир — y = x"][stage];
  const extent=stage===0?2*P:4;
  const c=chart("inverse-graph",-extent,extent,stage===2?-extent:-2.5,stage===2?extent:2.5,stage===2);
  if(stage===0) direct(c,s,-extent,extent,blue);
  else c.curve(s.f,lo+(bounded(s)?0:1e-7),hi-(bounded(s)?0:1e-7),blue,3);
  if(stage===2){
    c.line([[-extent,-extent],[extent,extent]],"#96a0b2",1,[5,5]);
    c.curve(inverseAngle,bounded(s)?-1:-extent,bounded(s)?1:extent,gold,3);
  } else c.line([[-extent,a],[extent,a]],gold,1.5,[5,4]);
  if(!valid) {
    $("inverse-result").textContent="Пересечений нет: "+kind+" принимает значения только от −1 до 1.";
    return;
  }
  if(stage===0){
    const points=[];
    for(const x of roots(kind,a))for(let k=-4;k<=4;k++){
      const t=x+k*s.period;
      if(t>=-extent&&t<=extent&&!points.some(p=>near(p,t)))points.push(t);
    }
    points.forEach(x=>c.dot(x,a,gold));
    $("inverse-result").textContent="Пересечений на рисунке: "+points.length+". Углы: "+points.sort((a,b)=>a-b).map(angle).join(", ")+".";
  }else{
    const b=inverseAngle(a);
    c.dot(b,a,blue);
    if(stage===2){c.line([[a,b],[b,a]],"#65738c",1,[4,4]);c.dot(a,b,gold);}
    const value=angle(b);
    $("inverse-result").textContent=stage===1?"На выбранной ветви угол один: "+value+".":s.inv+" при a = "+num(a)+": "+value+" рад.";
  }
}
const inverseFacts={
  sin:["Возрастает","Нечётная","arcsin 0 = 0; arcsin 1 = π/2","На правой полуокружности высота sin x проходит все значения от −1 до 1 по одному разу. Вторая половина окружности дала бы ещё один угол для той же высоты."],
  cos:["Убывает","Ни чётная, ни нечётная","arccos 0 = π/2; arccos 1 = 0","На верхней полуокружности горизонтальная координата cos x убывает от 1 до −1. На этой дуге каждой горизонтальной координате соответствует один угол."],
  tg:["Возрастает","Нечётная","arctg 0 = 0; arctg 1 = π/4","На правой полуокружности отношение sin x / cos x пробегает все действительные числа. Концы исключаем: на них cos x = 0."],
  ctg:["Убывает","Ни чётная, ни нечётная","arcctg 0 = π/2; arcctg 1 = π/4","На верхней полуокружности отношение cos x / sin x пробегает все действительные числа. Концы исключаем: на них sin x = 0."]
};
function drawInverseCircle(kind,a){
  const s=specs[kind], c=chart("inverse-circle",-1.3,1.3,-1.3,1.3,true);
  const points=(lo,hi)=>Array.from({length:81},(_,i)=>{const t=lo+(hi-lo)*i/80;return [Math.cos(t),Math.sin(t)];});
  c.line(points(0,2*P),"#a8b4ca",1.5);
  if(stage) {
    c.line(points(...s.limits),blue,4);
    for(const t of s.limits)c.dot(Math.cos(t),Math.sin(t),blue,bounded(s));
  }
  if(a!==null){
    const angles=stage?[s.g(a)]:roots(kind,a);
    for(const t of angles){
      const x=Math.cos(t),y=Math.sin(t);
      c.line([[0,0],[x,y]],gold,2);
      if(kind==="sin")c.line([[0,y],[x,y]],gold,1,[3,3]);
      if(kind==="cos")c.line([[x,0],[x,y]],gold,1,[3,3]);
      c.dot(x,y,gold);
    }
    if(!stage&&!bounded(s)&&angles.length){
      const t=angles[0]+P;
      c.dot(Math.cos(t),Math.sin(t),gold);
    }
  }
  $("circle-note").textContent=(stage?"Синяя дуга — главная ветвь. ":"Золотые точки соответствуют уровню a. ")+({sin:"sin x — высота точки.",cos:"cos x — горизонтальная координата.",tg:"tg x = sin x / cos x.",ctg:"ctg x = cos x / sin x."}[kind]);
  const [mono,parity,example,reason]=inverseFacts[kind];
  $("inverse-properties").innerHTML=[["Допустимые входы",bounded(s)?"[−1; 1]":"ℝ"],["Углы на выходе",s.range],["Монотонность",mono],["Чётность",parity],["Примеры",example]].map(([key,value])=>'<div><dt>'+key+'</dt><dd>'+value+'</dd></div>').join("");
  $("branch-reason").textContent=reason;
}

document.querySelectorAll("[data-stage]").forEach(button=>button.addEventListener("click",()=>{
  stage=Number(button.dataset.stage);
  document.querySelectorAll("[data-stage]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
  inverse();
}));
function roots(kind,a){
  const s=specs[kind];
  if(bounded(s)&&Math.abs(a)>1)return [];
  const b=s.g(a);
  if(kind==="sin")return Math.abs(a)===1?[b]:[b,P-b];
  if(kind==="cos")return Math.abs(a)===1?[b]:[b,-b];
  return [b];
}
function controls(prefix,inequality){
  $(prefix+"-controls").innerHTML='<label>Функция <select id="'+prefix+'-kind">'+options+'</select></label>'
    +(inequality?'<label>Знак <select id="ineq-sign"><option>&gt;</option><option>≥</option><option>&lt;</option><option>≤</option></select></label>':'')
    +'<label class="slider">Уровень a <output id="'+prefix+'-value"></output><input id="'+prefix+'-a" type="range" min="-2" max="2" step=".01" value=".5"></label>'
    +'<label class="slider">Сдвиг k <output id="'+prefix+'-shift"></output><input id="'+prefix+'-k" type="range" min="-2" max="2" step="1" value="0"></label>';
}
if ($("eq-controls")) controls("eq",false);
if ($("ineq-controls")) controls("ineq",true);
function intervals(kind,a,sign){
  const s=specs[kind], closed=sign==="≥"||sign==="≤", greater=sign===">"||sign==="≥";
  const ok=y=>greater?(closed?y>=a:y>a):(closed?y<=a:y<a);
  const start=s.pole??-P/2,end=start+s.period;
  const points=[start,end,...roots(kind,a).map(x=>start+((x-start)%s.period+s.period)%s.period)].sort((a,b)=>a-b)
    .filter((x,i,list)=>i===0||!near(x,list[i-1]));
  const include=x=>!poles(s,x-1e-7,x+1e-7).length&&(roots(kind,a).some(r=>near((x-r)/s.period,Math.round((x-r)/s.period)))?closed:ok(s.f(x)));
  const pieces=[];
  points.slice(1).forEach((b,i)=>{
    const a0=points[i];
    if(ok(s.f((a0+b)/2))) {
      const last=pieces.at(-1);
      if(last&&near(last[1],a0)&&include(a0)) {last[1]=b;last[3]=include(b);}
      else pieces.push([a0,b,include(a0),include(b)]);
    }
  });
  for(const x of points.slice(0,-1)) if(include(x)&&!pieces.some(([a,b,l,r])=>(x>a&&x<b)||(near(a,x)&&l)||(near(b,x)&&r))) pieces.push([x,x,true,true]);
  return pieces.sort((a,b)=>a[0]-b[0]);
}
function circle(cId,values,k,s){
  const c=$(cId), w=c.clientWidth,h=c.clientHeight,d=devicePixelRatio||1;
  c.width=w*d;c.height=h*d;
  const q=c.getContext("2d");q.scale(d,d);q.translate(w/2,h/2);
  const r=Math.min(w,h)*.37;
  q.strokeStyle="#a8b4ca";q.beginPath();q.arc(0,0,r,0,2*P);q.moveTo(-r-10,0);q.lineTo(r+10,0);q.moveTo(0,-r-10);q.lineTo(0,r+10);q.stroke();
  values.forEach((x,i)=>{
    const a=x+k*s.period, xx=r*Math.cos(a), yy=-r*Math.sin(a);
    q.strokeStyle=i?gold:blue;q.lineWidth=2;q.beginPath();q.moveTo(0,0);q.lineTo(xx,yy);q.stroke();
    q.fillStyle=i?gold:blue;q.beginPath();q.arc(xx,yy,5,0,2*P);q.fill();
  });
}
function plot(prefix,inequality) {
  const kind=$(prefix+"-kind").value,s=specs[kind],a=$("sandbox-value")?readMath($("sandbox-value").value):+$(prefix+"-a").value,k=+$(prefix+"-k").value;
  if (!Number.isFinite(a)) return;
  $(prefix+"-value").textContent=num(a);$(prefix+"-shift").textContent=k;
  const lo=-6*P,hi=6*P,c=chart(prefix+"-graph",lo,hi,Math.min(-3.65,a-.2),Math.max(3.2,a+.2));
  for(let n=-6;n<=6;n+=($(prefix+"-graph").clientWidth<460?3:2)){c.line([[n*P,-.12],[n*P,.12]],"#8591a8",1);c.label(n*P,0,angle(n*P),-11,17);}
  poles(s,lo,hi).forEach(x=>c.line([[x,-3.65],[x,3.2]],"#b7bfce",1,[3,4]));
  direct(c,s,lo,hi,blue);
  c.line([[lo,a],[hi,a]],gold,1.5,[5,4]);
  const period=bounded(s)?"2π":"π";
  if(!inequality) {
    const values=roots(kind,a);
    for(let j=-12;j<=12;j++)for(const x of values){
      const shifted=x+j*s.period;
      if(shifted>=lo&&shifted<=hi)c.dot(shifted,a,j===k?gold:blue,j===k);
    }
    circle("unit-circle",values,k,s);
    $(prefix+"-result").textContent=values.length
      ?"Базовые углы: "+values.map(angle).join(" и ")+". При k = "+k+": "+values.map(x=>angle(x+k*s.period)).join(" и ")+". Общий вид: каждый базовый угол + "+period+"k."
      :"Действительных решений нет: уровень вне [−1; 1].";
    return;
  }
  const sign=$("ineq-sign").value, pieces=intervals(kind,a,sign), selected=k*s.period;
  const y=-2.85;
  c.line([[lo,y],[hi,y]],"#b3bccd",1);
  for(let j=-12;j<=12;j++) for(const [l,r,lc,rc] of pieces){
    const a0=l+j*s.period,b0=r+j*s.period,color=j===k?blue:"#a1b5dd";
    if(b0<lo||a0>hi)continue;
    c.line([[Math.max(a0,lo),y],[Math.min(b0,hi),y]],color,5);
    if(a0>=lo)c.dot(a0,y,color,lc);
    if(b0<=hi&&!near(a0,b0))c.dot(b0,y,color,rc);
  }
  const repr=([l,r,lc,rc])=>near(l,r)?"{"+angle(l+selected)+"}":(lc?"[":"(")+angle(l+selected)+"; "+angle(r+selected)+(rc?"]":")");
  $("ineq-result").textContent=pieces.length?"На выбранном периоде (k = "+k+"): "+pieces.map(repr).join(" ∪ ")+". Эти части повторяются через "+period+".":"Решений нет.";
}
function render(){
  if ($("sandbox-mode")) { renderSandbox(); return; }
  if ($("inverse-graph")) inverse();
  if ($("eq-graph")) plot("eq",false);
  if ($("ineq-graph")) plot("ineq",true);
}
document.addEventListener("input",event=>{
  if ($("sandbox-mode")) { renderSandbox(); return; }
  if(event.target.id.startsWith("inverse-"))inverse();
  if(event.target.id.startsWith("eq-"))plot("eq",false);
  if(event.target.id.startsWith("ineq-"))plot("ineq",true);
});
window.addEventListener("resize",render);
const tasks=[
  ["Ограничение входа","Найдите arcsin(3/2).","В действительных числах не определён, потому что 3/2 > 1."],
  ["Главная ветвь","Вычислите arccos(cos(4π/3)).","cos(4π/3) = −1/2. В промежутке [0; π] этому значению соответствует 2π/3."],
  ["Шаметов № 9494","Решите cos x + sin x = 1.","√2 sin(x+π/4) = 1. Получаем x = 2πk или x = π/2 + 2πk."],
  ["Шаметов № 9518","Решите cos²x = (1 − cos x)/2.","Положим t = cos x. Тогда 2t² + t − 1 = (2t − 1)(t + 1) = 0. Получаем x = ±π/3 + 2πk или x = π + 2πk."],
  ["Шаметов № 9523","Решите sin x + sin 2x = cos x + 2cos²x.","После раскрытия sin 2x: (sin x − cos x)(1 + 2cos x) = 0. Отсюда x = π/4 + πk или x = ±2π/3 + 2πk."],
  ["Однородное уравнение","Решите sin²x − 3sin x cos x + 2cos²x = 0.","При cos x = 0 левая часть равна 1. Делим на cos²x и получаем (tg x − 1)(tg x − 2) = 0. Ответ: π/4 + πk или arctg 2 + πk."],
  ["Границы неравенства","Решите cos x < −1/2.","На одном обороте подходят углы между 2π/3 и 4π/3. Ответ: (2π/3 + 2πk; 4π/3 + 2πk)."],
  ["Точки разрыва","Решите tg x ≥ 1.","На каждой ветви tg возрастает. Ответ: [π/4 + πk; π/2 + πk). Правая граница исключена, поскольку tg там не определён."]
];
const taskMath=[
  '<mi>arcsin</mi><mo>⁡</mo><mfrac><mn>3</mn><mn>2</mn></mfrac>',
  '<mi>arccos</mi><mo>(</mo><mi>cos</mi><mo>⁡</mo><mfrac><mrow><mn>4</mn><mi>π</mi></mrow><mn>3</mn></mfrac><mo>)</mo>',
  '<mi>cos</mi><mi>x</mi><mo>+</mo><mi>sin</mi><mi>x</mi><mo>=</mo><mn>1</mn>',
  '<msup><mi>cos</mi><mn>2</mn></msup><mi>x</mi><mo>=</mo><mfrac><mrow><mn>1</mn><mo>−</mo><mi>cos</mi><mi>x</mi></mrow><mn>2</mn></mfrac>',
  '<mi>sin</mi><mi>x</mi><mo>+</mo><mi>sin</mi><mn>2</mn><mi>x</mi><mo>=</mo><mi>cos</mi><mi>x</mi><mo>+</mo><mn>2</mn><msup><mi>cos</mi><mn>2</mn></msup><mi>x</mi>',
  '<msup><mi>sin</mi><mn>2</mn></msup><mi>x</mi><mo>−</mo><mn>3</mn><mi>sin</mi><mi>x</mi><mi>cos</mi><mi>x</mi><mo>+</mo><mn>2</mn><msup><mi>cos</mi><mn>2</mn></msup><mi>x</mi><mo>=</mo><mn>0</mn>',
  '<mi>cos</mi><mi>x</mi><mo>&lt;</mo><mo>−</mo><mfrac><mn>1</mn><mn>2</mn></mfrac>',
  '<mi>tg</mi><mi>x</mi><mo>≥</mo><mn>1</mn>'
];
const taskAnswers=[
  "Не определён", "2π/3", "x = 2πk или x = π/2 + 2πk",
  "x = ±π/3 + 2πk или x = π + 2πk",
  "x = π/4 + πk или x = ±2π/3 + 2πk",
  "x = π/4 + πk или x = arctg(2) + πk",
  "x ∈ (2π/3 + 2πk; 4π/3 + 2πk)",
  "x ∈ [π/4 + πk; π/2 + πk)"
];
function answerMath(text){
  const atoms=value=>value.match(/arctg|[0-9]+|[xπk]|[^ ]/g).map(t=>{
    const tag=/^\d+$/.test(t)?"mn":/^(x|π|k|arctg)$/.test(t)?"mi":"mo";
    return "<"+tag+">"+t+"</"+tag+">";
  }).join("");
  if(text==="Не определён")return "<mtext>"+text+"</mtext>";
  return text.split(/(\d*π\/\d+| или )/).filter(Boolean).map(part=>{
    if(part===" или ")return "<mtext> или </mtext>";
    if(!part.includes("/"))return atoms(part);
    const [a,b]=part.split("/");
    return "<mfrac><mrow>"+atoms(a)+"</mrow><mn>"+b+"</mn></mfrac>";
  }).join("");
}
if ($("tasks")) $("tasks").innerHTML=tasks.map(([label,q,a],i)=>'<article class="card"><h3>'+label+'</h3><p>'+q.split(' ')[0]+'</p><div class="equation"><math>'+taskMath[i]+'</math></div><details><summary>Решение</summary><p>'+a+'</p><div class="equation"><math>'+answerMath(taskAnswers[i])+'</math></div></details></article>').join("");
const angles=[
 ["0°","0","0","1","0","—"],["30°","π/6","1/2","√3/2","√3/3","√3"],["45°","π/4","√2/2","√2/2","1","1"],["60°","π/3","√3/2","1/2","√3","√3/3"],["90°","π/2","1","0","—","0"],["120°","2π/3","√3/2","−1/2","−√3","−√3/3"],["135°","3π/4","√2/2","−√2/2","−1","−1"],["150°","5π/6","1/2","−√3/2","−√3/3","−√3"],["180°","π","0","−1","0","—"],["210°","7π/6","−1/2","−√3/2","√3/3","√3"],["225°","5π/4","−√2/2","−√2/2","1","1"],["240°","4π/3","−√3/2","−1/2","√3","√3/3"],["270°","3π/2","−1","0","—","0"],["300°","5π/3","−√3/2","1/2","−√3","−√3/3"],["315°","7π/4","−√2/2","√2/2","−1","−1"],["330°","11π/6","−1/2","√3/2","−√3/3","−√3"],["360°","2π","0","1","0","—"]
];
if ($("angles")) $("angles").innerHTML='<table><caption>Табличные углы (— означает, что значение не определено)</caption><thead><tr>'+["Градусы","Радианы","sin","cos","tg","ctg"].map(x=>'<th scope="col">'+x+'</th>').join("")+'</tr></thead><tbody>'+angles.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
function readMath(raw){
  const text=raw.trim().replace(/−/g,"-").replace(/,/g,".").replace(/\s+/g,"");
  const match=/^([+-]?)(?:(\d+(?:\.\d+)?|\.\d+)?(π|pi|√\d+(?:\.\d+)?)|(\d+(?:\.\d+)?|\.\d+))(?:\/(\d+(?:\.\d+)?))?$/i.exec(text);
  if(!match)return NaN;
  const [,sign,coefficient,symbol,decimal,denominator]=match;
  const value=symbol?(coefficient?+coefficient:1)*(symbol.startsWith("√")?Math.sqrt(+symbol.slice(1)):P):+decimal;
  return (sign==="-"?-1:1)*value/(denominator?+denominator:1);
}
function renderSandbox(){
  const prefix=$("sandbox-mode").value, inequality=prefix==="ineq", a=readMath($("sandbox-value").value);
  $("sandbox-eq").hidden=inequality;
  $("sandbox-ineq").hidden=!inequality;
  $("sandbox-error").textContent=Number.isFinite(a)?"":"Введите число, дробь, π или корень, например √2/2.";
  const area=$("sandbox-"+prefix);
  area.classList.toggle("invalid-sandbox",!Number.isFinite(a));
  if(!Number.isFinite(a)){$("sandbox-check").textContent="";return;}
  plot(prefix,inequality);
  const x=readMath($("sandbox-angle").value), kind=$(prefix+"-kind").value,s=specs[kind];
  if(!Number.isFinite(x)){$("sandbox-check").textContent="Введите угол в радианах, например π/6.";return;}
  if(s.pole!==undefined&&near((x-s.pole)/P,Math.round((x-s.pole)/P))){
    $("sandbox-check").textContent=kind+" x в этой точке не определён.";return;
  }
  const y=s.f(x), sign=inequality?$("ineq-sign").value:"=", equal=near(y,a);
  const valid={"=":equal,">":!equal&&y>a,"<":!equal&&y<a,"≥":equal||y>a,"≤":equal||y<a}[sign];
  $("sandbox-check").textContent=kind+"("+angle(x)+") ≈ "+num(y)+". Угол "+(valid?"подходит.":"не подходит.");
}
if($("sandbox-mode")){
  for(const prefix of ["eq","ineq"]) $(prefix+"-a").closest("label").hidden=true;
}
render();

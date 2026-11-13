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
  const other=stage>0&&$("inverse-branch").value==="1";
  const alternate={sin:[P/2,3*P/2],cos:[-P,0],tg:[P/2,3*P/2],ctg:[-P,0]};
  const [lo,hi]=other?alternate[kind]:s.limits;
  const inverseAngle=x=>other?({sin:()=>P-s.g(x),cos:()=>-s.g(x),tg:()=>s.g(x)+P,ctg:()=>s.g(x)-P}[kind])():s.g(x);
  const range=other?(bounded(s)?"[":"(")+angle(lo)+"; "+angle(hi)+(bounded(s)?"]":")"):s.range;
  $("branch-control").hidden=stage===0;
  $("inverse-a").textContent=num(a);
  $("inverse-range").textContent="Допустимый вход a: "+(bounded(s)?"[−1; 1]":"ℝ")+(stage?" · Углы выбранной ветви: "+range:"");
  const notes=[
    "Двигайте горизонтальный уровень y = a. Каждая точка пересечения даёт угол. Если точек несколько, угол по одному значению определить однозначно нельзя.",
    "Оставьте одну монотонную ветвь. На ней горизонтальная линия пересекает график ровно один раз при каждом допустимом a. Сравните стандартную и другую ветвь.",
    "Меняем координаты местами: (угол, значение) превращается в (значение, угол). Это отражение относительно y = x."
  ];
  $("stage-note").textContent=notes[stage];
  $("inverse-legend").textContent=["Синий — исходный график · золотой — уровень a","Синий — выбранная ветвь · золотой — уровень a","Синий — выбранная ветвь · золотой — обратный график · пунктир — y = x"][stage];
  const extent=stage===0?2*P:other?5:4;
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
    $("inverse-result").textContent=stage===1?"На выбранной ветви угол один: "+value+".":(other?"Обратная к выбранной ветви":"Стандартная "+s.inv)+" при a = "+num(a)+": "+value+" рад.";
  }
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
  const kind=$(prefix+"-kind").value,s=specs[kind],a=+$(prefix+"-a").value,k=+$(prefix+"-k").value;
  $(prefix+"-value").textContent=num(a);$(prefix+"-shift").textContent=k;
  const lo=-6*P,hi=6*P,c=chart(prefix+"-graph",lo,hi,-3.65,3.2);
  for(let n=-6;n<=6;n+=2){c.line([[n*P,-.12],[n*P,.12]],"#8591a8",1);c.label(n*P,0,angle(n*P),-11,17);}
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
  if ($("inverse-graph")) inverse();
  if ($("eq-graph")) plot("eq",false);
  if ($("ineq-graph")) plot("ineq",true);
}
document.addEventListener("input",event=>{
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
if ($("tasks")) $("tasks").innerHTML=tasks.map(([label,q,a])=>'<article class="card"><h3>'+label+'</h3><p>'+q+'</p><details><summary>Решение</summary><p>'+a+'</p></details></article>').join("");
const angles=[
 ["0°","0","0","1","0","—"],["30°","π/6","1/2","√3/2","√3/3","√3"],["45°","π/4","√2/2","√2/2","1","1"],["60°","π/3","√3/2","1/2","√3","√3/3"],["90°","π/2","1","0","—","0"],["120°","2π/3","√3/2","−1/2","−√3","−√3/3"],["135°","3π/4","√2/2","−√2/2","−1","−1"],["150°","5π/6","1/2","−√3/2","−√3/3","−√3"],["180°","π","0","−1","0","—"],["210°","7π/6","−1/2","−√3/2","√3/3","√3"],["225°","5π/4","−√2/2","−√2/2","1","1"],["240°","4π/3","−√3/2","−1/2","√3","√3/3"],["270°","3π/2","−1","0","—","0"],["300°","5π/3","−√3/2","1/2","−√3","−√3/3"],["315°","7π/4","−√2/2","√2/2","−1","−1"],["330°","11π/6","−1/2","√3/2","−√3/3","−√3"],["360°","2π","0","1","0","—"]
];
if ($("angles")) $("angles").innerHTML='<table><caption>Табличные углы (— означает, что значение не определено)</caption><thead><tr>'+["Градусы","Радианы","sin","cos","tg","ctg"].map(x=>'<th scope="col">'+x+'</th>').join("")+'</tr></thead><tbody>'+angles.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
render();

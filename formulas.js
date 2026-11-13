const row=(...items)=>'<mrow>'+items.join('')+'</mrow>';
const v=x=>'<mi>'+x+'</mi>';
const op=x=>'<mo>'+x+'</mo>';
const n=x=>'<mn>'+x+'</mn>';
const frac=(a,b)=>'<mfrac>'+a+b+'</mfrac>';
const pow=(a,b)=>'<msup>'+a+n(b)+'</msup>';
const f=(name,x)=>row(v(name),op('⁡'),x);
const par=x=>row(op('('),x,op(')'));
const x=v('x'), a=v('α'), b=v('β'), pi=v('π'), half=frac(pi,n(2));
const fn=(name,arg=x)=>f(name,arg);
const eq=(left,right)=>row(left,op('='),right);
const sum=(left,sign,right)=>row(left,op(sign),right);
const square=(name)=>row(pow(v(name),2),x);
const groups=[
  ['Формулы приведения', [
    ...[
      ['sin',pi,'−','sin',false,'\\pi-'],
      ['cos',pi,'−','cos',true,'\\pi-'],
      ['sin',half,'+','cos',false,'\\frac{\\pi}{2}+'],
      ['cos',half,'+','sin',true,'\\frac{\\pi}{2}+'],
      ['tg',half,'−','ctg',false,'\\frac{\\pi}{2}-'],
      ['ctg',half,'+','tg',true,'\\frac{\\pi}{2}+']
    ].map(([name,shift,sign,result,negative,tex])=>[
      eq(fn(name,par(sum(shift,sign,a))),row(negative?op('−'):'',fn(result,a))),
      '\\operatorname{'+name+'}('+tex+'\\alpha)='+(negative?'-':'')+'\\operatorname{'+result+'}\\alpha'
    ])
  ]],
  ['Основные тождества',[
    [eq(sum(square('sin'),'+',square('cos')),n(1)),'\\sin^2 x+\\cos^2 x=1'],
    [eq(fn('tg'),frac(fn('sin'),fn('cos'))),'\\operatorname{tg}x=\\frac{\\sin x}{\\cos x}'],
    [eq(fn('ctg'),frac(fn('cos'),fn('sin'))),'\\operatorname{ctg}x=\\frac{\\cos x}{\\sin x}'],
    [eq(sum(n(1),'+',square('tg')),frac(n(1),square('cos'))),'1+\\operatorname{tg}^2x=\\frac{1}{\\cos^2 x}'],
    [eq(sum(n(1),'+',square('ctg')),frac(n(1),square('sin'))),'1+\\operatorname{ctg}^2x=\\frac{1}{\\sin^2 x}']
  ]],
  ['Сумма и разность углов',[
    [eq(fn('sin',par(sum(a,'±',b))),sum(row(fn('sin',a),fn('cos',b)),'±',row(fn('cos',a),fn('sin',b)))),'\\sin(\\alpha\\pm\\beta)=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta'],
    [eq(fn('cos',par(sum(a,'±',b))),sum(row(fn('cos',a),fn('cos',b)),'∓',row(fn('sin',a),fn('sin',b)))),'\\cos(\\alpha\\pm\\beta)=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta'],
    [eq(fn('tg',par(sum(a,'±',b))),frac(sum(fn('tg',a),'±',fn('tg',b)),sum(n(1),'∓',row(fn('tg',a),fn('tg',b))))),'\\operatorname{tg}(\\alpha\\pm\\beta)=\\frac{\\operatorname{tg}\\alpha\\pm\\operatorname{tg}\\beta}{1\\mp\\operatorname{tg}\\alpha\\operatorname{tg}\\beta}']
  ]],
  ['Двойной угол и понижение степени',[
    [eq(fn('sin',row(n(2),x)),row(n(2),fn('sin'),fn('cos'))),'\\sin 2x=2\\sin x\\cos x'],
    [eq(fn('cos',row(n(2),x)),sum(square('cos'),'−',square('sin'))),'\\cos 2x=\\cos^2 x-\\sin^2 x'],
    [eq(square('sin'),frac(sum(n(1),'−',fn('cos',row(n(2),x))),n(2))),'\\sin^2 x=\\frac{1-\\cos 2x}{2}'],
    [eq(square('cos'),frac(sum(n(1),'+',fn('cos',row(n(2),x))),n(2))),'\\cos^2 x=\\frac{1+\\cos 2x}{2}']
  ]],
  ['Сумма в произведение',[
    ...[['sin','+','sin','cos'],['sin','−','cos','sin'],['cos','+','cos','cos'],['cos','−','sin','sin']].map(([name,sign,left,right])=>{
      const negative=name==='cos'&&sign==='−';
      return [eq(sum(fn(name,a),sign,fn(name,b)),row(negative?op('−'):'',n(2),fn(left,par(frac(sum(a,'+',b),n(2)))),fn(right,par(frac(sum(a,'−',b),n(2)))))),
        '\\'+name+'\\alpha'+(sign==='−'?'-':'+')+'\\'+name+'\\beta='+(negative?'-':'')+'2\\'+left+'\\frac{\\alpha+\\beta}{2}\\'+right+'\\frac{\\alpha-\\beta}{2}'];
    })
  ]]
];
const sheet=document.getElementById('formula-sheet');
const notes=[
  'При π/2 и 3π/2 меняем название функции. При π и 2π сохраняем его. Знак определяем по четверти исходного угла, считая α острым.',
  'В дробях знаменатель должен отличаться от нуля.',
  'Формула тангенса применима, когда обе части определены.'
];
groups.forEach(([title,items],i)=>{
  const section=document.createElement('div');
  section.innerHTML='<h2 class="formula-group">'+title+'</h2>'+(notes[i]?'<p>'+notes[i]+'</p>':'')+'<div class="formula-grid"></div>';
  const grid=section.lastElementChild;
  items.forEach(([math,latex])=>{
    const card=document.createElement('article');
    card.className='card formula-card';
    card.innerHTML='<div class="equation" tabindex="0"><math>'+math+'</math></div><button type="button">Копировать LaTeX</button>';
    const button=card.querySelector('button');
    button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(latex);button.textContent='Скопировано';}
      catch{const input=document.createElement('input');input.value=latex;input.readOnly=true;card.append(input);input.select();}
    });
    grid.append(card);
  });
  sheet.append(section);
});
document.querySelectorAll('#angles td').forEach(cell=>{
  const raw=cell.textContent;
  if(raw==='—'||raw.includes('°'))return;
  const part=t=>row(...t.match(/√[23]|\d+|./g).map(x=>x.startsWith('√')?'<msqrt>'+n(x.slice(1))+'</msqrt>':x==='π'?pi:/^\d+$/.test(x)?n(x):op(x)));
  const [left,right]=raw.split('/');
  cell.innerHTML='<math>'+(right?frac(part(left),part(right)):part(left))+'</math>';
});

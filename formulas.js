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
function renderFormulas(target, entries, descriptions=[]) {
entries.forEach(([title,items],i)=>{
  const section=document.createElement('div');
  section.innerHTML='<h2 class="formula-group">'+title+'</h2>'+(descriptions[i]?'<p>'+descriptions[i]+'</p>':'')+'<div class="formula-grid"></div>';
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
  target.append(section);
});
}
if(sheet) renderFormulas(sheet,groups,notes);
document.querySelectorAll('#angles td').forEach(cell=>{
  const raw=cell.textContent;
  if(raw==='—'||raw.includes('°'))return;
  const part=t=>row(...t.match(/√[23]|\d+|./g).map(x=>x.startsWith('√')?'<msqrt>'+n(x.slice(1))+'</msqrt>':x==='π'?pi:/^\d+$/.test(x)?n(x):op(x)));
  const [left,right]=raw.split('/');
  cell.innerHTML='<math>'+(right?frac(part(left),part(right)):part(left))+'</math>';
});

const y=v('y'), A=v('a'), K=v('k'), neg=z=>row(op('−'),z);
const call=(name,arg)=>f(name,par(arg));
const integers='<p>Во всех формулах k — любое целое число. В строках с −a подставляйте именно отрицание выбранного a.</p>';
const descriptions=['Арксинус','Арккосинус','Арктангенс','Арккотангенс'];
const names=['sin','cos','tg','ctg'];
const inverses=['arcsin','arccos','arctg','arcctg'];
const tx=z=>'\\operatorname{'+z+'}';
const membership=(variable,left,l,r,right)=>row(variable,op('∈'),op(left),l,op(';'),r,op(right));
const real=variable=>row(variable,op('∈'),v('ℝ'));
const inputDomain=variable=>membership(variable,'[',neg(n(1)),n(1),']');
const given=(formula,condition)=>row(formula,op(','),'<mspace width="0.6em"/>',condition);
const invTarget=document.getElementById('inverse-identities');
if(invTarget){
  renderFormulas(invTarget,names.map((name,i)=>{
    const inv=inverses[i], direct=tx(name), inverse=tx(inv), bounded=i<2, symmetric=i===0||i===2;
    const ranges=[
      membership(y,'[',neg(half),half,']'),membership(y,'[',n(0),pi,']'),
      membership(y,'(',neg(half),half,')'),membership(y,'(',n(0),pi,')')
    ];
    const texRanges=['[-\\pi/2,\\pi/2]','[0,\\pi]','(-\\pi/2,\\pi/2)','(0,\\pi)'];
    const domain=bounded?inputDomain(x):real(x), texDomain=bounded?'[-1,1]':'\\mathbb{R}';
    return [descriptions[i],[
      [given(eq(call(name,call(inv,x)),x),domain),direct+'('+inverse+'(x))=x,\\quad x\\in '+texDomain],
      [given(eq(call(inv,call(name,y)),y),ranges[i]),inverse+'('+direct+'(y))=y,\\quad y\\in '+texRanges[i]],
      [given(eq(call(inv,neg(x)),symmetric?neg(call(inv,x)):sum(pi,'−',call(inv,x))),domain),inverse+'(-x)='+(symmetric?'-':'\\pi-')+inverse+'(x),\\quad x\\in '+texDomain]
    ]];
  }),[
    'Обратная композиция возвращает угол только на главной ветви.',
    'При смене знака входа углы в сумме дают π.',
    'Границы углов ±π/2 исключены.',
    'При смене знака входа углы в сумме дают π. Углы 0 и π исключены.'
  ]);
}
const eqTarget=document.getElementById('basic-equations');
if(eqTarget){
  eqTarget.innerHTML=integers;
  const period=row(n(2),pi,K), piK=row(pi,K);
  // The exponent k is a variable, including in the k + 1 variant.
  const signed=(extra=false)=>'<msup>'+par(neg(n(1)))+(extra?sum(K,'+',n(1)):K)+'</msup>';
  const root=(name,level,texLevel,answer,texAnswer)=>[
    row(eq(fn(name),level),op('⇒'),eq(x,answer)),
    tx(name)+' x='+texLevel+'\\;\\Rightarrow\\;x='+texAnswer+',\\quad k\\in\\mathbb{Z}'
  ];
  const arc=(i,z=A)=>call(inverses[i],z);
  const R=(i,z,tex,ans,latex)=>root(names[i],z,tex,ans,latex);
  renderFormulas(eqTarget,[
    ['Синус',[
      R(0,A,'a',sum(row(signed(),arc(0)),'+',piK),'(-1)^k\\arcsin a+\\pi k'),
      R(0,neg(A),'-a',sum(row(signed(true),arc(0)),'+',piK),'(-1)^{k+1}\\arcsin a+\\pi k'),
      R(0,n(0),'0',piK,'\\pi k'),
      R(0,n(1),'1',sum(half,'+',period),'\\frac{\\pi}{2}+2\\pi k'),
      R(0,neg(n(1)),'-1',sum(neg(half),'+',period),'-\\frac{\\pi}{2}+2\\pi k')
    ]],
    ['Косинус',[
      R(1,A,'a',sum(row(op('±'),arc(1)),'+',period),'\\pm\\arccos a+2\\pi k'),
      R(1,neg(A),'-a',sum(row(op('±'),par(sum(pi,'−',arc(1)))),'+',period),'\\pm(\\pi-\\arccos a)+2\\pi k'),
      R(1,n(1),'1',period,'2\\pi k'),
      R(1,neg(n(1)),'-1',sum(pi,'+',period),'\\pi+2\\pi k'),
      R(1,n(0),'0',sum(half,'+',piK),'\\frac{\\pi}{2}+\\pi k')
    ]],
    ['Тангенс',[
      R(2,A,'a',sum(arc(2),'+',piK),tx('arctg')+'a+\\pi k'),
      R(2,neg(A),'-a',sum(neg(arc(2)),'+',piK),'-'+tx('arctg')+'a+\\pi k')
    ]],
    ['Котангенс',[
      R(3,A,'a',sum(arc(3),'+',piK),tx('arcctg')+'a+\\pi k'),
      R(3,neg(A),'-a',sum(sum(pi,'−',arc(3)),'+',piK),'\\pi-'+tx('arcctg')+'a+\\pi k')
    ]]
  ],[
    'Для a от −1 до 1 включительно. При |a| > 1 решений нет. Ниже приведены также случаи 0, 1 и −1.',
    'Для a от −1 до 1 включительно. При |a| > 1 решений нет. Ниже приведены также случаи 1, −1 и 0.',
    'Подходит любое действительное a. Решения повторяются через π.',
    'Подходит любое действительное a. Решения повторяются через π.'
  ]);
}

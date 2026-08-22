
(() => {
  const app = document.querySelector('#diagnosis-app');
  if (!app) return;
  const methods = {
    flea: {name:'フリマ・オークション', icon:'📱'},
    home: {name:'宅配買取', icon:'📦'},
    visit: {name:'出張買取', icon:'🚚'},
    store: {name:'店頭買取', icon:'🏬'}
  };
  const questions = [
    {key:'item', kicker:'ITEM', title:'何を売りたいですか？', help:'最も近い種類を1つ選んでください。', options:[
      ['brand','👜','ブランド品・時計・貴金属','比較的小さく、状態や真贋の確認が重要'],
      ['digital','📱','スマホ・パソコン・小型家電','初期化・付属品・動作確認が重要'],
      ['clothes','👕','着物・衣類・服飾小物','点数、ブランド、季節、状態で差が出やすい'],
      ['hobby','🎮','本・ホビー・コレクション','専門性、セット、希少性の説明が重要'],
      ['large','🪑','家具・大型家電','運搬・搬出・対象地域が重要'],
      ['mixed','📦','その他・いろいろ混在','点数とカテゴリの幅が重要']
    ]},
    {key:'size', kicker:'SIZE', title:'梱包・持ち運びの難しさは？', help:'一人で安全に扱えるかを基準にしてください。', options:[
      ['small','✋','小さい','60サイズ前後。自分で梱包しやすい'],
      ['medium','📦','中くらい','段ボール1箱程度。発送はできる'],
      ['large','🚚','大きい・重い','家具、楽器、大型家電など'],
      ['many','🗃️','点数が多い','箱が複数、家の整理、まとめ売り']
    ]},
    {key:'priority', kicker:'PRIORITY', title:'最も優先したいことは？', help:'迷う場合は、今いちばん困っていることを選びます。', options:[
      ['price','💴','できるだけ高く売る','時間と手間をかけても金額を優先'],
      ['speed','⚡','早く売る','数日以内の現金化・処分を優先'],
      ['easy','🪶','手間を減らす','撮影・説明・交渉・発送を減らしたい'],
      ['safe','🛡️','トラブルを避ける','個人間対応や返品対応を避けたい']
    ]},
    {key:'time', kicker:'TIME', title:'売却作業に使える時間は？', help:'撮影・説明・連絡・梱包・持込みまで含めます。', options:[
      ['none','⏱️','ほとんど使えない','30分未満が理想'],
      ['little','🕐','1〜2時間程度','最低限の準備ならできる'],
      ['some','🕒','数時間使える','複数の比較や出品準備ができる'],
      ['wait','📅','日数をかけられる','売れるまで待つこともできる']
    ]},
    {key:'condition', kicker:'CONDITION', title:'状態をどの程度説明できますか？', help:'不具合や欠品を自分で判断できるかを選びます。', options:[
      ['clear','✅','状態・動作が明確','傷や動作、付属品を説明できる'],
      ['used','🔎','使用感はあるが説明できる','写真と文章で状態を伝えられる'],
      ['unknown','❓','動作や真贋が分からない','専門家の確認が必要かもしれない'],
      ['broken','🧰','故障・欠品がある','修理前提、ジャンク、部品取りの可能性']
    ]},
    {key:'contact', kicker:'CONTACT', title:'人とのやり取りはどこまで可能ですか？', help:'購入者・事業者との連絡や訪問対応を想定します。', options:[
      ['online','💬','オンライン連絡はできる','コメント・価格交渉・発送連絡は可能'],
      ['shop','🏬','店頭なら対応できる','持込みと対面査定は可能'],
      ['visit','🏠','自宅訪問に対応できる','日程調整と訪問査定に対応できる'],
      ['minimal','🚫','やり取りを最小限にしたい','連絡回数と対面対応を減らしたい']
    ]}
  ];
  const state = {index:0, answers:{}};
  const qView = document.querySelector('#question-view');
  const panel = document.querySelector('#result-panel');
  const title = document.querySelector('#question-title');
  const help = document.querySelector('#question-help');
  const kicker = document.querySelector('#question-kicker');
  const grid = document.querySelector('#option-grid');
  const prev = document.querySelector('#prev-button');
  const next = document.querySelector('#next-button');
  const pLabel = document.querySelector('#progress-label');
  const pPercent = document.querySelector('#progress-percent');
  const pBar = document.querySelector('#progress-bar');

  function render(){
    const q = questions[state.index];
    title.textContent = q.title; help.textContent = q.help; kicker.textContent = q.kicker;
    const pct = Math.round((state.index+1)/questions.length*100);
    pLabel.textContent = `質問 ${state.index+1} / ${questions.length}`; pPercent.textContent = `${pct}%`; pBar.style.width = `${pct}%`;
    grid.innerHTML = '';
    q.options.forEach(([value,icon,label,sub]) => {
      const b=document.createElement('button'); b.type='button'; b.className='option-button'; b.dataset.value=value;
      b.setAttribute('aria-pressed', String(state.answers[q.key]===value));
      b.innerHTML=`<span class="option-icon" aria-hidden="true">${icon}</span><span><strong>${label}</strong><small>${sub}</small></span>`;
      b.addEventListener('click',()=>{state.answers[q.key]=value; render();}); grid.appendChild(b);
    });
    prev.disabled = state.index===0;
    next.disabled = !state.answers[q.key];
    next.textContent = state.index===questions.length-1 ? '結果を見る' : '次へ';
  }
  function score(){
    const s={flea:0,home:0,visit:0,store:0}; const a=state.answers; const reasons={flea:[],home:[],visit:[],store:[]};
    const add=(m,n,r)=>{s[m]+=n;if(r)reasons[m].push(r)};
    if(['brand','digital','hobby'].includes(a.item)){add('flea',18,'商品の特徴を写真と説明で伝えやすい');add('home',11,'専門業者の宅配査定とも比較しやすい');}
    if(a.item==='clothes'){add('home',16,'点数をまとめて送る方法と相性がよい');add('flea',10,'ブランドや状態が明確なら個別販売も検討できる');}
    if(a.item==='large'){add('visit',28,'大型品は搬出を含む方法が現実的');add('store',4);}
    if(a.item==='mixed'){add('visit',19,'品数が多い場合は訪問査定で負担を減らせる');add('home',16,'箱単位で送れる品なら宅配も使いやすい');}
    if(a.size==='small'){add('flea',16,'自分で梱包・発送しやすい大きさ');add('home',14);add('store',8);}
    if(a.size==='medium'){add('home',16,'段ボールで発送できる');add('flea',10);add('store',8);}
    if(a.size==='large'){add('visit',28,'運搬せずに査定を受けやすい');}
    if(a.size==='many'){add('visit',22,'点数が多くてもまとめて確認しやすい');add('home',17);}
    if(a.priority==='price'){add('flea',28,'販売価格を自分で設定しやすい');add('home',7);add('store',5);}
    if(a.priority==='speed'){add('store',24,'持込み後に結果を確認しやすい');add('visit',17);add('home',12);}
    if(a.priority==='easy'){add('visit',23,'搬出や点数整理の負担を減らしやすい');add('home',20);add('store',10);}
    if(a.priority==='safe'){add('store',22,'対面で内容を確認して判断しやすい');add('home',14);add('visit',12);}
    if(a.time==='none'){add('visit',18,'作業時間を抑えやすい');add('home',16);add('store',12);}
    if(a.time==='little'){add('home',15);add('store',13);add('visit',12);}
    if(a.time==='some'){add('flea',16,'撮影や説明の準備時間を確保できる');add('home',9);}
    if(a.time==='wait'){add('flea',20,'売れるまで待つ選択ができる');}
    if(a.condition==='clear'){add('flea',17,'状態を自分の言葉で説明できる');add('store',8);}
    if(a.condition==='used'){add('flea',12);add('home',10);add('store',10);}
    if(a.condition==='unknown'){add('store',18,'その場で専門スタッフへ確認しやすい');add('home',14);add('visit',12);}
    if(a.condition==='broken'){add('store',12);add('home',11);add('flea',6);}
    if(a.contact==='online'){add('flea',16,'個人間の連絡に対応できる');add('home',8);}
    if(a.contact==='shop'){add('store',22,'店頭での査定・説明に対応できる');}
    if(a.contact==='visit'){add('visit',22,'訪問日時の調整に対応できる');}
    if(a.contact==='minimal'){add('home',18,'申込みから発送までをまとめやすい');add('store',12);}
    return {scores:s,reasons};
  }
  function showResult(){
    const {scores,reasons}=score(); const max=Math.max(...Object.values(scores),1);
    const ranking=Object.entries(scores).sort((a,b)=>b[1]-a[1]); const first=ranking[0][0], second=ranking[1][0];
    const caveats={
      flea:['販売手数料・送料・梱包費を差し引いて確認','写真、説明、交渉、発送、返品対応まで自分で行う'],
      home:['査定後のキャンセル料・返送料を申込前に確認','送付対象外や本人確認、入金時期を確認'],
      visit:['事業者名、対象品、契約書面を落ち着いて確認','訪問購入の法的ルールと適用除外を公式情報で確認'],
      store:['交通費や持ち運びの負担を含めて比較','その場で即決せず、査定明細と返却条件を確認']
    };
    const reasonList=(reasons[first].slice(0,4).map(x=>`<li>${x}</li>`).join('') || '<li>回答全体から総合的に判定しました</li>');
    const cautionList=caveats[first].map(x=>`<li>${x}</li>`).join('');
    const rows=ranking.map(([key,val],i)=>`<div class="rank-row"><span class="rank-label">第${i+1}候補</span><strong>${methods[key].icon} ${methods[key].name}</strong><div class="score-bar" aria-label="適合度 ${Math.round(val/max*100)}"><span style="width:${Math.round(val/max*100)}%"></span></div></div>`).join('');
    panel.innerHTML=`<div class="result-hero"><span class="result-label">診断結果</span><h3>第一候補は「${methods[first].name}」</h3><p>${methods[first].name}を軸にしつつ、第二候補の「${methods[second].name}」と実際の手取り・条件を比較するのが合理的です。</p></div><div class="result-body"><div class="result-grid"><div class="info-box"><h4>この方法が向く理由</h4><ul>${reasonList}</ul></div><div class="info-box"><h4>売る前の注意</h4><ul>${cautionList}</ul></div></div><div class="ranking"><h4>候補ルート順位</h4>${rows}</div><div class="callout" style="margin-top:20px"><strong>この結果は価格査定ではありません。</strong><br>実際の販売手数料・送料・査定額・対象地域・キャンセル条件を確認し、最終判断してください。</div><div class="reset-wrap"><button id="reset-diagnosis" class="button button-secondary" type="button">最初からやり直す</button><a class="button button-primary" href="flea-profit.html">フリマ手取りを計算</a></div></div>`;
    qView.style.display='none'; panel.classList.add('is-visible');
    panel.querySelector('#reset-diagnosis').addEventListener('click',()=>{state.index=0;state.answers={};panel.classList.remove('is-visible');panel.innerHTML='';qView.style.display='block';render();qView.scrollIntoView({behavior:'smooth',block:'center'});});
  }
  prev.addEventListener('click',()=>{if(state.index>0){state.index--;render();}});
  next.addEventListener('click',()=>{const q=questions[state.index];if(!state.answers[q.key])return;if(state.index<questions.length-1){state.index++;render();}else{showResult();}});
  render();
})();

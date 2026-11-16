// Journey store item rows, in exact left-to-right, top-to-bottom screenshot order.
// Icon overlay quantities (4,5,...) are item pack contents, not exchange limits.
const items = [
 ['j01','上質武器の欠片選択ボックス',1000,3],
 ['j02','シークレット獣の欠片選択パック',500,3],
 ['j03','精製チップ',70,4],
 ['j04','獣の欠片選択パック',200,3],
 ['j05','回復スピードアップ1日',35,3],
 ['j06','訓練スピードアップ1日',35,3],
 ['j07','メガ資源パック',25,10],
 ['j08','武器欠片選択ボックス（橙）',250,4],
 ['j09','武器欠片選択ボックス（紫）',80,5],
 ['j10','ポテンシャルエキストラクト',25,30],
 ['j11','精製部品',25,8],
 ['j12','訓練スピードアップ4時間',10,8],
 ['j13','回復スピードアップ4時間',10,8],
 ['j14','スーパー資源パック',8,14]
].map(([id,name,price,max])=>({id,name,price,max}));
const storageKey='dls-journey-store-sim-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey))||{}}catch(e){}
const safeRecord=(x)=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const state={budget:Number.isFinite(Number(saved.budget))?Math.max(0,Math.floor(Number(saved.budget))):0,
 bought:safeRecord(saved.bought),plan:safeRecord(saved.plan),hideSold:!!saved.hideSold,
 limitOn:typeof saved.limitOn==='boolean'?saved.limitOn:true};
const $=id=>document.getElementById(id),fmt=x=>Math.round(x).toLocaleString('ja-JP');
const cleanCount=x=>Math.max(0,Math.floor(Number(x)||0));
for(const it of items){state.bought[it.id]=Math.min(it.max,cleanCount(state.bought[it.id]));state.plan[it.id]=Math.min(it.max-state.bought[it.id],cleanCount(state.plan[it.id]));}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){}}
function currentPlannedCost(){return items.reduce((s,it)=>s+state.plan[it.id]*it.price,0)}
function maxAffordable(it){return Math.max(0,Math.floor((state.budget-(currentPlannedCost()-state.plan[it.id]*it.price))/it.price))}
function validPlan(it,target){const cap=it.max-state.bought[it.id];return Math.max(0,Math.min(cap,cleanCount(target),state.limitOn?maxAffordable(it):cap))}
function setPlan(it,n){state.plan[it.id]=validPlan(it,n);save();render()}
function setBought(it,n){state.bought[it.id]=Math.min(it.max,cleanCount(n));state.plan[it.id]=validPlan(it,state.plan[it.id]);save();render()}
function editCount(it,kind,delta){if(kind==='bought')setBought(it,state.bought[it.id]+delta);else setPlan(it,state.plan[it.id]+delta)}
function inputCount(it,kind,value){if(!Number.isFinite(Number(value))){render();return}if(kind==='bought')setBought(it,value);else setPlan(it,value)}
function normalizePlans(){let remain=state.budget;for(const it of items){const allowed=Math.max(0,Math.min(state.plan[it.id],it.max-state.bought[it.id],Math.floor(remain/it.price)));state.plan[it.id]=allowed;remain-=allowed*it.price}}
function renderCatalog(){
 const root=$('catalog');root.replaceChildren();
 for(const it of items){
 const b=state.bought[it.id],p=state.plan[it.id],remaining=it.max-b;
 if(state.hideSold&&b>=it.max&&p===0)continue;
 const div=document.createElement('div');div.className='item'+(b+p>=it.max?' complete':'');
 const img=document.createElement('img');img.className='itemimg';img.alt='';img.loading='lazy';img.src='images/'+it.id+'.png';img.onerror=()=>{img.style.visibility='hidden'};div.appendChild(img);
 const body=document.createElement('div');body.className='itembody';
 const affordable=state.limitOn?maxAffordable(it):it.max;
 body.innerHTML=`<div class="itop"><div class="iname"></div><span class="tag">通常</span></div><div class="sub"><strong class="price">${fmt(it.price)}<small> pt</small></strong><span class="limit">上限 ${it.max} 個</span></div><div class="itemcontrols"><div class="bought-control"><label for="b-${it.id}">交換済み</label><div class="quantity"><button type="button" class="bminus" aria-label="交換済みを1減らす" ${b<=0?'disabled':''}>−</button><input id="b-${it.id}" class="count-input binput" type="number" min="0" max="${it.max}" step="1" inputmode="numeric" aria-label="${it.name}の交換済み数" value="${b}"><button type="button" class="bplus" aria-label="交換済みを1増やす" ${b>=it.max?'disabled':''}>＋</button></div><div class="plan-shortcuts"><button class="bzero" type="button" ${b===0?'disabled':''}>0個</button><button class="bmax" type="button" ${b>=it.max?'disabled':''}>MAX</button></div></div><div class="plan-control"><label for="p-${it.id}">交換予定 (残${remaining})</label><div class="quantity"><button type="button" class="minus" aria-label="交換予定を1減らす" ${p<=0?'disabled':''}>−</button><input id="p-${it.id}" class="count-input pinput" type="number" min="0" max="${remaining}" step="1" inputmode="numeric" aria-label="${it.name}の交換予定数" value="${p}"><button type="button" class="plus" aria-label="交換予定を1増やす" ${p>=remaining||(state.limitOn&&p>=affordable)?'disabled':''}>＋</button></div><div class="plan-shortcuts"><button class="zero" type="button" ${p===0?'disabled':''}>0個</button><button class="max" type="button" ${p>=remaining||(state.limitOn&&p>=affordable)?'disabled':''}>MAX</button></div></div></div>`;
 body.querySelector('.iname').textContent=it.name;
 if(b+p>=it.max){const badge=document.createElement('span');badge.className='done-label';badge.textContent='✓ 選択完了';body.querySelector('.itop').appendChild(badge)}
 for(const [sel,kind,d] of [['.bminus','bought',-1],['.bplus','bought',1],['.minus','plan',-1],['.plus','plan',1]])body.querySelector(sel).addEventListener('click',()=>editCount(it,kind,d));
 for(const [sel,fn] of [['.bzero',()=>setBought(it,0)],['.bmax',()=>setBought(it,it.max)],['.zero',()=>setPlan(it,0)],['.max',()=>setPlan(it,it.max-state.bought[it.id])]])body.querySelector(sel).addEventListener('click',fn);
 for(const [sel,kind] of [['.binput','bought'],['.pinput','plan']]){const field=body.querySelector(sel);field.addEventListener('change',()=>inputCount(it,kind,field.value));field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();field.blur()}})}
 div.appendChild(body);root.appendChild(div);
 }
}
function render(){
 const cost=currentPlannedCost(),left=state.budget-cost;
 $('budgetStat').textContent=fmt(state.budget);$('costStat').textContent=fmt(cost);$('remainStat').textContent=fmt(left);$('remainStat').className=left<0?'red':'green';
 $('budget').value=state.budget;
 document.querySelectorAll('[data-limit]').forEach(el=>{const active=(el.dataset.limit==='on')===state.limitOn;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))});
 $('modeHelp').textContent=state.limitOn?'ON：残りの交換ポイントを超える数量は追加できません。交換済み分は再計算しません。':'OFF：予算を超えて欲しい商品を選び、必要な交換ポイントと不足分を確認できます。';
 const boughtCost=items.reduce((s,it)=>s+state.bought[it.id]*it.price,0);
 $('goalBox').hidden=state.limitOn;$('goalNeed').textContent=fmt(cost)+' pt';$('goalTotal').textContent=fmt(cost+boughtCost)+' pt';$('goalShort').textContent=fmt(Math.max(0,cost-state.budget))+' pt';
 $('warning').innerHTML=left<0?`<div class="warn">⚠️ ポイントが ${fmt(-left)} pt 不足しています。</div>`:'';
 renderCatalog();
 const selected=items.filter(it=>state.plan[it.id]>0);
 const sum=$('summary');sum.replaceChildren();
 if(!selected.length){const el=document.createElement('div');el.className='empty';el.textContent='まだ交換予定の商品がありません。';sum.appendChild(el);return;}
 const table=document.createElement('table');table.innerHTML='<thead><tr><th>商品</th><th>単価</th><th>個数</th><th>小計</th></tr></thead>';
 const tbody=document.createElement('tbody');for(const it of selected){const tr=document.createElement('tr');for(const value of [it.name,fmt(it.price),fmt(state.plan[it.id]),fmt(it.price*state.plan[it.id])]){const td=document.createElement('td');td.textContent=value;tr.appendChild(td)}tbody.appendChild(tr)}table.appendChild(tbody);
 const foot=document.createElement('tfoot'),tr=document.createElement('tr');for(const v of ['合計','',fmt(selected.reduce((s,it)=>s+state.plan[it.id],0)),fmt(cost)]){const th=document.createElement('th');th.textContent=v;tr.appendChild(th)}foot.appendChild(tr);table.appendChild(foot);sum.appendChild(table);
}
$('limitBtns').addEventListener('click',e=>{const btn=e.target.closest('[data-limit]');if(!btn)return;const on=btn.dataset.limit==='on';if(on&&currentPlannedCost()>state.budget){if(!confirm('ポイント制限をONにすると、予算を超えている交換予定を商品順に減らします。よろしいですか？'))return;normalizePlans()}state.limitOn=on;save();render()});
$('budget').addEventListener('change',e=>{state.budget=cleanCount(e.target.value);if(state.limitOn)normalizePlans();save();render()});
$('hideSold').checked=state.hideSold;$('hideSold').addEventListener('change',e=>{state.hideSold=e.target.checked;save();renderCatalog()});
function resetPlanned(){if(confirm('交換予定のみすべて0個にしますか？（交換済み数は維持）')){for(const it of items)state.plan[it.id]=0;save();render()}}
$('resetPlan').addEventListener('click',resetPlanned);$('resetPlanTop').addEventListener('click',resetPlanned);
$('resetAll').addEventListener('click',()=>{if(confirm('保有ポイント・交換済み数・交換予定をすべて初期化しますか？')){state.budget=0;state.limitOn=true;state.hideSold=false;for(const it of items){state.bought[it.id]=0;state.plan[it.id]=0}$('hideSold').checked=false;save();render()}});
$('copy').addEventListener('click',async()=>{const selected=items.filter(it=>state.plan[it.id]>0),cost=currentPlannedCost();const msg=['【ジャーニーストア｜交換予定】',...selected.map(it=>`${it.name} × ${state.plan[it.id]}（${fmt(it.price*state.plan[it.id])}pt）`),`必要ポイント：${fmt(cost)} pt`,`交換後残高：${fmt(state.budget-cost)} pt`].join('\n');try{await navigator.clipboard.writeText(msg);alert('交換予定リストをコピーしました')}catch(e){prompt('こちらをコピーしてください',msg)}});
if(state.limitOn&&currentPlannedCost()>state.budget){state.limitOn=false}render();

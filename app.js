const C={'食費':['野菜','肉','フルーツ','調味料','お菓子','飲料','外食','その他'],'日用品':['コンタクト','洗剤','キッチン消耗品','衛生用品','その他'],'娯楽費':['Netflix','Kindle','映画','ゲーム','本','その他'],'交通費':['電車','バス','タクシー','ガソリン','その他'],'医療費':['病院','薬','その他'],'その他':['その他']};

const RULES=[['野菜',/野菜|キャベツ|白菜|トマト|玉ねぎ|人参|小松菜|レタス|きゅうり|大根/],['肉',/肉|豚|牛|鶏|ひき肉|ハム|ベーコン/],['フルーツ',/果物|フルーツ|りんご|バナナ|みかん|いちご|ぶどう/],['調味料',/調味料|醤油|味噌|砂糖|塩|酢|みりん|ケチャップ/],['お菓子',/菓子|チョコ|クッキー|アイス|せんべい|スナック/],['飲料',/水|お茶|コーヒー|ジュース|牛乳|酒|ビール/],['コンタクト',/コンタクト|レンズ/],['洗剤',/洗剤|アタック|トップ|漂白|柔軟剤/],['キッチン消耗品',/ラップ|アルミホイル|キッチンペーパー|スポンジ|ごみ袋/],['衛生用品',/ティッシュ|トイレットペーパー|歯磨き|シャンプー|石鹸|マスク/],['Netflix',/netflix|ネットフリックス/i],['Kindle',/kindle|キンドル/i],['映画',/映画|シネマ/],['ゲーム',/ゲーム|switch|playstation/i],['本',/本|書籍|雑誌/],['電車',/電車|鉄道|suica|pasmo/i],['バス',/バス/],['タクシー',/タクシー/],['ガソリン',/ガソリン|給油/],['病院',/病院|診療|クリニック/],['薬',/薬|ドラッグ/]];

const S=Object.fromEntries(Object.entries(C).flatMap(([m,ss])=>ss.map(s=>[s,m]))),$=s=>document.querySelector(s),yen=n=>`¥${Math.round(+n||0).toLocaleString('ja-JP')}`,month=()=>new Date().toISOString().slice(0,7),uid=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random();

let records=JSON.parse(localStorage.getItem('kakeibo-records-v1')||'[]'),items=[],editing=null,rec=null;

function save(){localStorage.setItem('kakeibo-records-v1',JSON.stringify(records));
render()}
function toast(m){let e=$('#toast');
e.textContent=m;
e.classList.add('show');
clearTimeout(toast.t);
toast.t=setTimeout(()=>e.classList.remove('show'),2200)}
function classify(n){let f=RULES.find(([,r])=>r.test(n)),sub=f?.[0]||'その他';
return{main:S[sub]||'その他',sub}}
function num(v){return +String(v).replace(/[，,]/g,'').replace(/[０-９]/g,d=>'０１２３４５６７８９'.indexOf(d))||0}
function parse(t){let x=t.replace(/＋/g,'+').replace(/，/g,',').replace(/￥/g,'円').trim(),tm=x.match(/(?:合計|全部で|計)\s*([\d,０-９]+)\s*円?/),total=tm?num(tm[1]):0,rm=x.match(/残り(?:は|を)?\s*([^、,。\s]+)/),out=[];
x.split(/[、,。\n]/).map(s=>s.trim()).filter(Boolean).forEach(seg=>{if(/^(合計|全部で|計)/.test(seg)||/残り(?:は|を)?/.test(seg))return;
let name=(seg.match(/^(.+?)(?=\s*[\d０-９])/)||[])[1]?.trim().replace(/[はが:]$/,'')||'',ns=[...seg.matchAll(/([\d,０-９]+)\s*円?/g)].map(a=>num(a[1]));
if(!ns.length)return;
if(ns.length>1&&name)ns.forEach((amount,i)=>out.push({id:uid(),name:name+(i+1),amount,...classify(name)}));
else{let n=name||seg.replace(/[\d,０-９+円\s]/g,'')||'支出';
out.push({id:uid(),name:n,amount:ns[0],...classify(n)})}});
if(rm&&total){let amount=Math.max(0,total-out.reduce((s,i)=>s+i.amount,0)),n=rm[1].replace(/円.*/,'');
if(amount)out.push({id:uid(),name:n,amount,...classify(n)})}if(!out.length&&total)out.push({id:uid(),name:'支出',amount:total,main:'その他',sub:'その他'});
return out}
function openEntry(mode,file){editing=null;
items=[];
$('#rawInput').value='';
$('#memoInput').value='';
$('#expenseDate').value=new Date().toISOString().slice(0,10);
document.querySelector('[name=payment][value=cash]').checked=true;
$('#capturePanel').hidden=false;
$('#reviewPanel').hidden=true;
$('#receiptPreview').hidden=true;
$('#listeningState').hidden=true;
$('#stopVoiceBtn').hidden=true;
$('#dialogTitle').textContent=mode==='voice'?'音声で入力':mode==='manual'?'手入力':mode==='camera'?'レシートを撮影':'写真から選ぶ';
$('#dialogStep').textContent='STEP 1';
$('#entryDialog').showModal();
if(mode==='voice')voice();
else if(file)receipt(file);
else setTimeout(()=>$('#rawInput').focus(),100)}
function voice(){let R=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!R){toast('このブラウザは音声入力に未対応です');
return}rec=new R;
rec.lang='ja-JP';
rec.continuous=true;
rec.interimResults=true;
let f='';
$('#listeningState').hidden=false;
$('#stopVoiceBtn').hidden=false;
rec.onresult=e=>{let z='';
for(let i=e.resultIndex;
i<e.results.length;
i++)e.results[i].isFinal?f+=e.results[i][0].transcript:z+=e.results[i][0].transcript;
$('#rawInput').value=f+z};
rec.onerror=()=>toast('聞き取れませんでした。文字でも入力できます');
rec.onend=()=>{$('#listeningState').hidden=true;
$('#stopVoiceBtn').hidden=true};
rec.start()}
function stop(){try{rec?.stop()}catch{}}
async function receipt(file){$('#receiptImage').src=URL.createObjectURL(file);
$('#receiptPreview').hidden=false;
$('#ocrStatus').textContent='画像を確認しています…';
if('TextDetector'in window)try{let b=await createImageBitmap(file),r=await new TextDetector().detect(b),t=r.map(x=>x.rawValue).join('\n');
$('#rawInput').value=t;
$('#ocrStatus').textContent=t?'文字を読み取りました。内容を確認してください。':'読み取れませんでした。画像を見ながら入力してください。'}catch{$('#ocrStatus').textContent='画像を見ながら入力してください。'}else $('#ocrStatus').textContent='このブラウザは画像の自動文字認識に未対応です。画像を見ながら入力してください。'}
function options(v,c){return v.map(x=>`<option ${x===c?'selected':''}>${x}</option>`).join('')}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function draft(){ $('#itemList').innerHTML=items.map(i=>`<div class="item-row" data-id="${i.id}"><div class="item-top"><input aria-label="品名" data-f="name" value="${esc(i.name)}"><input aria-label="金額" data-f="amount" type="number" inputmode="numeric" min="0" value="${i.amount}"><button type="button" class="remove-item">×</button></div><div class="item-category"><select aria-label="大分類" data-f="main">${options(Object.keys(C),i.main)}</select><select aria-label="内訳" data-f="sub">${options(C[i.main]||['その他'],i.sub)}</select></div></div>`).join('');
$('#reviewTotal').textContent=yen(items.reduce((s,i)=>s+(+i.amount||0),0))}
function reviewInput(){let p=parse($('#rawInput').value);
if(!p.length)return toast('品名と金額、または合計を入力してください');
items=p;
$('#capturePanel').hidden=true;
$('#reviewPanel').hidden=false;
$('#dialogStep').textContent='STEP 2';
$('#dialogTitle').textContent='内容を確認';
draft()}
function saveDraft(){if(!items.length)return toast('品目を追加してください');
let r={id:editing||uid(),date:$('#expenseDate').value||'',payment:document.querySelector('[name=payment]:checked').value,memo:$('#memoInput').value.trim(),items:items.map(i=>({...i,amount:+i.amount||0})),createdAt:new Date().toISOString()},ix=records.findIndex(x=>x.id===editing);
ix>=0?records[ix]=r:records.unshift(r);
save();
$('#entryDialog').close();
toast(editing?'修正して保存しました':'保存しました')}
const total=r=>r.items.reduce((s,i)=>s+(+i.amount||0),0),filtered=m=>records.filter(r=>!m||(r.date||'').startsWith(m));

function edit(id){let r=records.find(x=>x.id===id);
editing=id;
items=r.items.map(i=>({...i,id:i.id||uid()}));
$('#entryDialog').showModal();
$('#capturePanel').hidden=true;
$('#reviewPanel').hidden=false;
$('#dialogStep').textContent='EDIT';
$('#dialogTitle').textContent='記録を編集';
$('#expenseDate').value=r.date||'';
$('#memoInput').value=r.memo||'';
document.querySelector(`[name=payment][value=${r.payment}]`).checked=true;
draft()}
function histories(){let a=filtered($('#historyMonth').value);
let paymentName={cash:'現金',card:'カード',barcode:'バーコード'};
$('#historyList').innerHTML=a.length?a.map(r=>`<article class="history-card"><header><div><h3>${esc(r.memo||r.items.map(i=>i.name).slice(0,2).join('・')||'支出')}</h3><p class="meta">${r.date||'日付不明'} ・ ${paymentName[r.payment]||'現金'}</p></div><span class="amount">${yen(total(r))}</span></header><div class="chips">${r.items.slice(0,4).map(i=>`<span class="chip">${esc(i.sub)} ${yen(i.amount)}</span>`).join('')}</div><div class="history-actions"><button data-edit="${r.id}">編集</button><button class="delete" data-delete="${r.id}">削除</button></div></article>`).join(''):'<div class="empty-state"><span>🧾</span>まだ記録がありません<br>「入力」から保存できます</div>'}
function summary(){let a=filtered($('#summaryMonth').value),t=a.reduce((s,r)=>s+total(r),0),card=a.filter(r=>r.payment==='card').reduce((s,r)=>s+total(r),0),barcode=a.filter(r=>r.payment==='barcode').reduce((s,r)=>s+total(r),0),g={};
$('#summaryTotal').textContent=yen(t);
$('#cardTotal').textContent=yen(card);
$('#barcodeTotal').textContent=yen(barcode);
$('#cashTotal').textContent=yen(t-card-barcode);
a.flatMap(r=>r.items).forEach(i=>{g[i.main]??={total:0,subs:{}};
g[i.main].total+=+i.amount;
g[i.main].subs[i.sub]=(g[i.main].subs[i.sub]||0)+ +i.amount});
$('#categorySummary').innerHTML=Object.entries(g).sort((a,b)=>b[1].total-a[1].total).map(([m,v])=>`<article class="category-card"><header><span>${m}</span><span>${yen(v.total)}</span></header><div class="bar"><i style="width:${t?v.total/t*100:0}%"></i></div><ul>${Object.entries(v.subs).map(([s,n])=>`<li><span>${s}</span><span>${yen(n)}</span></li>`).join('')}</ul></article>`).join('')||'<div class="empty-state"><span>📊</span>保存すると分類別の集計が表示されます</div>';
renderComparison()}

function renderComparison(){
  const now=new Date(),months=[];
  for(let offset=5;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const value=records.filter(r=>(r.date||'').startsWith(key)).reduce((s,r)=>s+total(r),0);
    months.push({key,label:`${d.getMonth()+1}月`,value,current:offset===0});
  }
  const max=Math.max(...months.map(m=>m.value),1);
  $('#monthChart').innerHTML=months.map(m=>`<div class="month-column ${m.current?'current':''}"><span class="chart-value">${m.value?yen(m.value):'–'}</span><i class="chart-bar" style="height:${m.value?Math.max(8,m.value/max*115):4}px"></i><span class="chart-label">${m.label}</span></div>`).join('');
}

function csvCell(value){
  let text=String(value??'');
  if(/^[=+\-@]/.test(text))text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}

function exportCsv(){
  if(!records.length){toast('書き出す記録がありません');return}
  const header=['record_id','date','payment','memo','item_id','item_name','amount','main_category','sub_category'];
  const rows=[header.map(csvCell).join(',')];
  records.forEach(record=>record.items.forEach(item=>{
    rows.push([record.id,record.date,record.payment,record.memo,item.id,item.name,item.amount,item.main,item.sub].map(csvCell).join(','));
  }));
  const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;
  link.download=`kakeibo-backup-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('CSVを書き出しました');
}

function parseCsv(text){
  const rows=[];
  let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(quoted&&ch==='"'&&next==='"'){field+='"';i++;continue}
    if(ch==='"'){quoted=!quoted;continue}
    if(!quoted&&ch===','){row.push(field);field='';continue}
    if(!quoted&&(ch==='\n'||ch==='\r')){
      if(ch==='\r'&&next==='\n')i++;
      row.push(field);field='';
      if(row.some(value=>value!==''))rows.push(row);
      row=[];
      continue;
    }
    field+=ch;
  }
  row.push(field);
  if(row.some(value=>value!==''))rows.push(row);
  return rows;
}

async function importCsv(file){
  try{
    const rows=parseCsv((await file.text()).replace(/^\uFEFF/,''));
    const expected=['record_id','date','payment','memo','item_id','item_name','amount','main_category','sub_category'];
    if(!rows.length||expected.some((name,index)=>rows[0][index]!==name))throw new Error('形式が違います');
    const grouped=new Map();
    rows.slice(1).forEach(cols=>{
      if(cols.length<9)return;
      const clean=value=>String(value||'').replace(/^'(?=[=+\-@])/,'');
      const recordId=clean(cols[0])||uid();
      if(!grouped.has(recordId))grouped.set(recordId,{id:recordId,date:clean(cols[1]),payment:['cash','card','barcode'].includes(clean(cols[2]))?clean(cols[2]):'cash',memo:clean(cols[3]),items:[],createdAt:new Date().toISOString()});
      const name=clean(cols[5])||'支出',category=classify(name);
      grouped.get(recordId).items.push({id:clean(cols[4])||uid(),name,amount:num(cols[6]),main:clean(cols[7])||category.main,sub:clean(cols[8])||category.sub});
    });
    const imported=[...grouped.values()].filter(record=>record.items.length);
    if(!imported.length)throw new Error('記録がありません');
    let replace=records.length===0;
    if(records.length){
      replace=confirm(`${imported.length}件のバックアップで現在の記録を置き換えますか？\n\nOK：置き換える\nキャンセル：追加するか選ぶ`);
      if(!replace&&!confirm('現在の記録を残したまま、バックアップを追加しますか？'))return;
    }
    if(replace)records=imported;
    else{
      const existingIds=new Set(records.map(record=>record.id));
      records=[...records,...imported.filter(record=>!existingIds.has(record.id))];
    }
    save();
    toast(`${imported.length}件を読み込みました`);
  }catch(error){toast('CSVを読み込めませんでした')}
}
function render(){let a=filtered(month()),t=a.reduce((s,r)=>s+total(r),0),card=a.filter(r=>r.payment==='card').reduce((s,r)=>s+total(r),0);
$('#monthTotal').textContent=yen(t);
$('#monthCardTotal').textContent=yen(card);
histories();
summary()}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item,.view').forEach(x=>x.classList.remove('active'));
b.classList.add('active');
$('#'+b.dataset.view).classList.add('active');
render()});
$('#manualBtn').onclick=()=>openEntry('manual');
$('#voiceBtn').onclick=()=>openEntry('voice');
$('#cameraInput').onchange=e=>{if(e.target.files[0])openEntry('camera',e.target.files[0]);
e.target.value=''};
$('#photoInput').onchange=e=>{if(e.target.files[0])openEntry('photo',e.target.files[0]);
e.target.value=''};
$('#parseBtn').onclick=reviewInput;
$('#stopVoiceBtn').onclick=stop;
$('#backBtn').onclick=()=>{$('#capturePanel').hidden=false;
$('#reviewPanel').hidden=true};
$('#saveBtn').onclick=saveDraft;
$('#addItemBtn').onclick=()=>{items.push({id:uid(),name:'',amount:0,main:'その他',sub:'その他'});
draft()};

$('#itemList').oninput=e=>{let row=e.target.closest('.item-row');
if(!row)return;
let i=items.find(x=>x.id===row.dataset.id),f=e.target.dataset.f;
if(f==='amount')i.amount=+e.target.value||0;
else if(f)i[f]=e.target.value;
if(f==='main'){i.sub=C[i.main][0];
draft()}else $('#reviewTotal').textContent=yen(items.reduce((s,x)=>s+(+x.amount||0),0))};
$('#itemList').onclick=e=>{if(e.target.classList.contains('remove-item')){let id=e.target.closest('.item-row').dataset.id;
items=items.filter(i=>i.id!==id);
draft()}};
$('#historyList').onclick=e=>{if(e.target.dataset.edit)edit(e.target.dataset.edit);
if(e.target.dataset.delete&&confirm('この記録を削除しますか？')){records=records.filter(r=>r.id!==e.target.dataset.delete);
save();
toast('削除しました')}};
$('#deleteAllBtn').onclick=()=>{if(records.length&&confirm('すべて削除しますか？')){records=[];
save()}};
$('#historyMonth').onchange=histories;
$('#summaryMonth').onchange=summary;
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();
$('#exportCsvBtn').onclick=exportCsv;
$('#importCsvInput').onchange=e=>{if(e.target.files[0])importCsv(e.target.files[0]);e.target.value=''};
$('#entryDialog').addEventListener('close',stop);
$('#historyMonth').value=$('#summaryMonth').value=month();
render();

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  $('#installAppBtn').hidden=false;
});
$('#installAppBtn').onclick=async()=>{
  if(!deferredInstallPrompt)return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  $('#installAppBtn').hidden=true;
};
window.addEventListener('appinstalled',()=>toast('ホーム画面に追加しました'));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

if(document.modelContext?.registerTool)document.modelContext.registerTool({name:'add_expense',title:'支出を追加',description:'品目と金額、支払い方法を指定して家計簿に保存します。',inputSchema:{type:'object',properties:{name:{type:'string'},amount:{type:'number',minimum:0},payment:{enum:['cash','card','barcode']},date:{type:'string'}},required:['name','amount','payment'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(x){if(!x?.name||typeof x.amount!=='number'||!['cash','card','barcode'].includes(x.payment))throw Error('入力が正しくありません');
let r={id:uid(),date:x.date||'',payment:x.payment,memo:'',items:[{id:uid(),name:x.name,amount:x.amount,...classify(x.name)}],createdAt:new Date().toISOString()};
records.unshift(r);
save();
return{saved:true,id:r.id,total:x.amount}}}).catch?.(()=>{});


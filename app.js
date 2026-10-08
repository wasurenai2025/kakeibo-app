const C={'食費':['野菜','肉','魚','フルーツ','調味料','お菓子','飲料','外食','その他'],'日用品':['コンタクト','洗剤','キッチン消耗品','衛生用品','その他'],'娯楽費':['Netflix','Kindle','映画','ゲーム','本','その他'],'交通費':['電車','バス','タクシー','ガソリン','その他'],'医療費':['病院','薬','その他'],'その他':['その他']};

const RULES=[['野菜',/野菜|キャベツ|白菜|トマト|玉ねぎ|玉葱|じゃがいも|ジャガイモ|人参|小松菜|レタス|きゅうり|大根/],['肉',/肉|豚|牛|鶏|ひき肉|ハム|ベーコン/],['魚',/魚|鮭|サケ|さけ|まぐろ|マグロ|ツナ|さば|サバ|あじ|アジ|ぶり|ブリ|えび|エビ|いか|イカ|たこ|タコ|しらす|刺身/],['フルーツ',/果物|フルーツ|りんご|バナナ|みかん|いちご|ぶどう/],['調味料',/調味料|醤油|味噌|砂糖|塩|酢|みりん|ケチャップ/],['お菓子',/菓子|チョコ|クッキー|アイス|せんべい|スナック/],['飲料',/水|お茶|コーヒー|ジュース|牛乳|酒|ビール/],['コンタクト',/コンタクト|レンズ/],['洗剤',/洗剤|アタック|トップ|漂白|柔軟剤/],['キッチン消耗品',/ラップ|アルミホイル|キッチンペーパー|スポンジ|ごみ袋/],['衛生用品',/ティッシュ|トイレットペーパー|歯磨き|シャンプー|石鹸|マスク/],['Netflix',/netflix|ネットフリックス/i],['Kindle',/kindle|キンドル/i],['映画',/映画|シネマ/],['ゲーム',/ゲーム|switch|playstation/i],['本',/本|書籍|雑誌/],['電車',/電車|鉄道|suica|pasmo/i],['バス',/バス/],['タクシー',/タクシー/],['ガソリン',/ガソリン|給油/],['病院',/病院|診療|クリニック/],['薬',/薬|ドラッグ/]];

const S=Object.fromEntries(Object.entries(C).flatMap(([m,ss])=>ss.map(s=>[s,m]))),$=s=>document.querySelector(s),yen=n=>`¥${Math.round(+n||0).toLocaleString('ja-JP')}`,month=()=>new Date().toISOString().slice(0,7),uid=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random();

let records=JSON.parse(localStorage.getItem('kakeibo-records-v1')||'[]'),items=[],editing=null,rec=null;

function save(){localStorage.setItem('kakeibo-records-v1',JSON.stringify(records));
render()}
function toast(m){let e=$('#toast');
e.textContent=m;
e.classList.add('show');
clearTimeout(toast.t);
toast.t=setTimeout(()=>e.classList.remove('show'),2200)}
const CATEGORY_ICONS={
  '食費':'🍽️','日用品':'🧴','娯楽費':'🎬','交通費':'🚃','医療費':'🏥','電気':'💡','ガス':'🔥','水道':'💧','趣味・学習':'📚','税金・社会保険':'🧾','公共料金・放送':'📺','その他':'✨',
  '野菜':'🥬','肉':'🥩','魚':'🐟','フルーツ':'🍎','果物':'🍎','調味料':'🧂','お菓子':'🍪','飲料':'🥤','外食':'🍽️',
  'コンタクト':'👁️','洗剤':'🧴','清掃用品':'🧹','キッチン消耗品':'🧻','衛生用品':'🫧',
  'Netflix':'📺','U-NEXT':'📺','Amazonプライム':'📺','映画':'🎞️','ゲーム':'🎮','本':'📖','ChatGPT':'💬','電子書籍':'📱','オンライン講座':'🎓',
  '電車':'🚃','バス':'🚌','タクシー':'🚕','ガソリン':'⛽','病院':'🏥','薬':'💊','NHK':'📺'
};
const categoryIcon=(main,sub)=>CATEGORY_ICONS[sub]||CATEGORY_ICONS[main]||'✨';
const CATEGORY_ALIASES={'果物':'フルーツ','魚・魚介':'魚','魚介':'魚'};
function classify(n,hint=''){let hinted=CATEGORY_ALIASES[hint]||hint;
if(hinted&&S[hinted])return{main:S[hinted],sub:hinted};
let f=RULES.find(([,r])=>r.test(n)),sub=f?.[0]||'その他';
return{main:S[sub]||'その他',sub}}
function normalizeDigits(v){return String(v).replace(/[０-９]/g,d=>'０１２３４５６７８９'.indexOf(d))}
function num(v){return +normalizeDigits(v).replace(/[，,]/g,'')||0}
function extractSpokenDate(text){let normalized=normalizeDigits(text),m=normalized.match(/(?:(\d{4})年)?\s*(\d{1,2})月\s*(\d{1,2})日/);
if(!m)return null;
let year=+(m[1]||new Date().getFullYear()),mon=+m[2],day=+m[3],date=new Date(year,mon-1,day);
if(date.getFullYear()!==year||date.getMonth()!==mon-1||date.getDate()!==day)return null;
return{raw:m[0],value:year+'-'+String(mon).padStart(2,'0')+'-'+String(day).padStart(2,'0'),label:mon+'月'+day+'日'}}
function parse(t){let x=normalizeDigits(t).replace(/＋/g,'+').replace(/，/g,',').replace(/￥/g,'円').trim(),spokenDate=extractSpokenDate(x),out=[];
if(spokenDate){$('#expenseDate').value=spokenDate.value;x=x.replace(spokenDate.raw,' ')}
let tm=x.match(/(?:合計|全部で|計)\s*([\d,]+)\s*円?/),total=tm?num(tm[1]):0,rm=x.match(/残り(?:は|を)?\s*([^、,。\s]+)/);
const hintPattern='野菜|肉|魚・魚介|魚介|魚|フルーツ|果物|調味料|お菓子|飲料|外食|洗剤|キッチン消耗品|衛生用品|コンタクト|電車|バス|タクシー|ガソリン|病院|薬';
x=x.replace(new RegExp('([^、,。\\n]+?)[、,]\\s*(?:分類は|カテゴリーは)?\\s*('+hintPattern+')[、,]\\s*([\\d,]+)\\s*円?','g'),(all,name,hint,amount)=>{let cleanName=name.trim();out.push({id:uid(),name:cleanName,amount:num(amount),...classify(cleanName,hint)});return '\n'});
x=x.replace(/円\s*(?=[^＋+、,。\n])/g,'円\n');
x.split(/[、,。\n]/).map(s=>s.trim()).filter(Boolean).forEach(seg=>{if(/^(合計|全部で|計)/.test(seg)||/残り(?:は|を)?/.test(seg))return;
let name=(seg.match(/^(.+?)(?=\s*[\d])/)||[])[1]?.trim().replace(/[はが:]$/,'')||'',ns=[...seg.matchAll(/([\d,]+)\s*円?/g)].map(a=>num(a[1]));
if(!ns.length)return;
if(ns.length>1&&name)ns.forEach((amount,i)=>out.push({id:uid(),name:name+(i+1),amount,...classify(name)}));
else{let n=name||seg.replace(/[\d,+円\s]/g,'')||'支出';out.push({id:uid(),name:n,amount:ns[0],...classify(n)})}});
if(rm&&total){let amount=Math.max(0,total-out.reduce((s,i)=>s+i.amount,0)),n=rm[1].replace(/円.*/,'');if(amount)out.push({id:uid(),name:n,amount,...classify(n)})}
if(!out.length&&total)out.push({id:uid(),name:'支出',amount:total,main:'その他',sub:'その他'});
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
if(!R){toast('このブラウザは音声入力に未対応です');return}
rec=new R;rec.lang='ja-JP';rec.continuous=true;rec.interimResults=true;
let finalText='';
$('#listeningState').hidden=false;$('#stopVoiceBtn').hidden=false;
rec.onresult=e=>{let interim='';
for(let i=e.resultIndex;i<e.results.length;i++){let spoken=e.results[i][0].transcript;
if(e.results[i].isFinal){let spokenDate=extractSpokenDate(spoken);
if(spokenDate){$('#expenseDate').value=spokenDate.value;spoken=spoken.replace(spokenDate.raw,'');toast(spokenDate.label+'の日付で続けて入力します')}
spoken=spoken.trim();if(spoken)finalText+=(finalText?'\n':'')+spoken}else interim+=spoken}
$('#rawInput').value=finalText+(interim?(finalText?'\n':'')+interim:'')};
rec.onerror=()=>toast('聞き取れませんでした。文字でも入力できます');
rec.onend=()=>{$('#listeningState').hidden=true;$('#stopVoiceBtn').hidden=true};
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
$('#historyList').innerHTML=a.length?a.map(r=>`<article class="history-card"><header><div><h3>${esc(r.memo||r.items.map(i=>i.name).slice(0,2).join('・')||'支出')}</h3><p class="meta">${r.date||'日付不明'} ・ ${paymentName[r.payment]||'現金'}</p></div><span class="amount">${yen(total(r))}</span></header><div class="chips">${r.items.slice(0,4).map(i=>`<span class="chip"><b aria-hidden="true">${categoryIcon(i.main,i.sub)}</b>${esc(i.sub)} ${yen(i.amount)}</span>`).join('')}</div><div class="history-actions"><button data-edit="${r.id}">編集</button><button class="delete" data-delete="${r.id}">削除</button></div></article>`).join(''):'<div class="empty-state"><span>🧾</span>まだ記録がありません<br>「入力」から保存できます</div>'}
function summary(){let a=filtered($('#summaryMonth').value),t=a.reduce((s,r)=>s+total(r),0),card=a.filter(r=>r.payment==='card').reduce((s,r)=>s+total(r),0),barcode=a.filter(r=>r.payment==='barcode').reduce((s,r)=>s+total(r),0),g={};
$('#summaryTotal').textContent=yen(t);
$('#cardTotal').textContent=yen(card);
$('#barcodeTotal').textContent=yen(barcode);
$('#cashTotal').textContent=yen(t-card-barcode);
a.flatMap(r=>r.items).forEach(i=>{g[i.main]??={total:0,subs:{}};
g[i.main].total+=+i.amount;
g[i.main].subs[i.sub]=(g[i.main].subs[i.sub]||0)+ +i.amount});
$('#categorySummary').innerHTML=Object.entries(g).sort((a,b)=>b[1].total-a[1].total).map(([m,v])=>`<article class="category-card"><header><span class="category-heading"><b class="category-illustration small" aria-hidden="true">${categoryIcon(m,'')}</b>${m}</span><span>${yen(v.total)}</span></header><div class="bar"><i style="width:${t?v.total/t*100:0}%"></i></div><ul>${Object.entries(v.subs).map(([s,n])=>`<li><span class="sub-label"><b class="mini-icon" aria-hidden="true">${categoryIcon(m,s)}</b>${s}</span><span>${yen(n)}</span></li>`).join('')}</ul></article>`).join('')||'<div class="empty-state"><span>📊</span>保存すると分類別の集計が表示されます</div>';
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


function xlsxXml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]))}
function xlsxTextCell(ref,value,style=0){return '<c r="'+ref+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+xlsxXml(value)+'</t></is></c>'}
function xlsxNumberCell(ref,value,style=2){return '<c r="'+ref+'" s="'+style+'"><v>'+Number(value||0)+'</v></c>'}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return(crc^0xffffffff)>>>0}
function xlsxZip(files){
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
  const now=new Date(),dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),dosDate=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  const write=(view,pos,value,size)=>{if(size===2)view.setUint16(pos,value,true);else view.setUint32(pos,value,true)};
  files.forEach(file=>{const name=encoder.encode(file.name),data=encoder.encode(file.data),crc=crc32(data),local=new Uint8Array(30+name.length),view=new DataView(local.buffer);
    write(view,0,0x04034b50,4);write(view,4,20,2);write(view,6,0x0800,2);write(view,8,0,2);write(view,10,dosTime,2);write(view,12,dosDate,2);write(view,14,crc,4);write(view,18,data.length,4);write(view,22,data.length,4);write(view,26,name.length,2);write(view,28,0,2);local.set(name,30);parts.push(local,data);
    const center=new Uint8Array(46+name.length),cv=new DataView(center.buffer);write(cv,0,0x02014b50,4);write(cv,4,20,2);write(cv,6,20,2);write(cv,8,0x0800,2);write(cv,10,0,2);write(cv,12,dosTime,2);write(cv,14,dosDate,2);write(cv,16,crc,4);write(cv,20,data.length,4);write(cv,24,data.length,4);write(cv,28,name.length,2);write(cv,30,0,2);write(cv,32,0,2);write(cv,34,0,2);write(cv,36,0,2);write(cv,38,0,4);write(cv,42,offset,4);center.set(name,46);central.push(center);offset+=local.length+data.length;
  });
  const centralSize=central.reduce((sum,part)=>sum+part.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);write(ev,0,0x06054b50,4);write(ev,4,0,2);write(ev,6,0,2);write(ev,8,files.length,2);write(ev,10,files.length,2);write(ev,12,centralSize,4);write(ev,16,offset,4);write(ev,20,0,2);
  const output=new Uint8Array(offset+centralSize+end.length);let cursor=0;[...parts,...central,end].forEach(part=>{output.set(part,cursor);cursor+=part.length});return output;
}
async function exportExcel(){
  const selectedMonth=$('#historyMonth').value||month(),monthRecords=filtered(selectedMonth);
  if(!monthRecords.length){toast('選択した月に書き出す記録がありません');return}
  const paymentName={cash:'現金',card:'カード',barcode:'バーコード'},flatRows=[];
  monthRecords.forEach(record=>record.items.forEach(item=>flatRows.push({date:record.date||'日付不明',main:item.main||'その他',sub:item.sub||'その他',name:item.name||'支出',payment:paymentName[record.payment]||'現金',amount:+item.amount||0,memo:record.memo||''})));
  flatRows.sort((a,b)=>a.date.localeCompare(b.date));
  const totalAmount=flatRows.reduce((sum,row)=>sum+row.amount,0),paymentTotals={cash:0,card:0,barcode:0};
  monthRecords.forEach(record=>{paymentTotals[record.payment]=(paymentTotals[record.payment]||0)+total(record)});
  const title=selectedMonth.replace('-','年')+'月 家計簿',rows1=[];
  rows1.push('<row r="1" ht="34" customHeight="1">'+xlsxTextCell('A1',title,3)+'</row>');
  rows1.push('<row r="3">'+xlsxTextCell('A3','対象月',4)+xlsxTextCell('B3',selectedMonth)+xlsxTextCell('D3','現金',4)+xlsxNumberCell('E3',paymentTotals.cash)+'</row>');
  rows1.push('<row r="4">'+xlsxTextCell('A4','合計',4)+xlsxNumberCell('B4',totalAmount,7)+xlsxTextCell('D4','カード',4)+xlsxNumberCell('E4',paymentTotals.card)+'</row>');
  rows1.push('<row r="5">'+xlsxTextCell('D5','バーコード',4)+xlsxNumberCell('E5',paymentTotals.barcode)+'</row>');
  const headers=['日付','大分類','内訳','品名','支払い方法','金額','メモ'];rows1.push('<row r="8" ht="26" customHeight="1">'+headers.map((value,index)=>xlsxTextCell(String.fromCharCode(65+index)+'8',value,1)).join('')+'</row>');
  flatRows.forEach((row,index)=>{const r=9+index,alt=index%2===1?5:0,money=index%2===1?6:2;rows1.push('<row r="'+r+'" ht="22" customHeight="1">'+xlsxTextCell('A'+r,row.date,alt)+xlsxTextCell('B'+r,row.main,alt)+xlsxTextCell('C'+r,row.sub,alt)+xlsxTextCell('D'+r,row.name,alt)+xlsxTextCell('E'+r,row.payment,alt)+xlsxNumberCell('F'+r,row.amount,money)+xlsxTextCell('G'+r,row.memo,alt)+'</row>')});
  const cols1='<cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/><col min="4" max="4" width="24" customWidth="1"/><col min="5" max="5" width="15" customWidth="1"/><col min="6" max="6" width="14" customWidth="1"/><col min="7" max="7" width="28" customWidth="1"/></cols>';
  const sheet1='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+cols1+'<sheetData>'+rows1.join('')+'</sheetData><autoFilter ref="A8:G'+(8+flatRows.length)+'"/><mergeCells count="1"><mergeCell ref="A1:G1"/></mergeCells></worksheet>';
  const grouped=new Map();flatRows.forEach(row=>{const key=row.main+'|'+row.sub;grouped.set(key,(grouped.get(key)||0)+row.amount)});const summary=[...grouped.entries()].sort((a,b)=>b[1]-a[1]),rows2=[];
  rows2.push('<row r="1" ht="34" customHeight="1">'+xlsxTextCell('A1',selectedMonth.replace('-','年')+'月 分類別集計',3)+'</row>');
  rows2.push('<row r="3">'+['大分類','内訳','金額'].map((value,index)=>xlsxTextCell(String.fromCharCode(65+index)+'3',value,1)).join('')+'</row>');
  summary.forEach(([key,amount],index)=>{const r=4+index,splitAt=key.indexOf('|'),alt=index%2===1?5:0,money=index%2===1?6:2;rows2.push('<row r="'+r+'">'+xlsxTextCell('A'+r,key.slice(0,splitAt),alt)+xlsxTextCell('B'+r,key.slice(splitAt+1),alt)+xlsxNumberCell('C'+r,amount,money)+'</row>')});
  const totalRow=4+summary.length;rows2.push('<row r="'+totalRow+'">'+xlsxTextCell('A'+totalRow,'合計',4)+xlsxNumberCell('C'+totalRow,totalAmount,7)+'</row>');
  const sheet2='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="16" customWidth="1"/></cols><sheetData>'+rows2.join('')+'</sheetData><mergeCells count="1"><mergeCell ref="A1:C1"/></mergeCells></worksheet>';
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0&quot;円&quot;"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Yu Gothic"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Yu Gothic"/></font><font><b/><color rgb="FF123456"/><sz val="18"/><name val="Yu Gothic"/></font><font><b/><color rgb="FF245B66"/><sz val="11"/><name val="Yu Gothic"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF38BFA7"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0FBF9"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFB7DED8"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf><xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const files=[{name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},{name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},{name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="今月の家計簿" sheetId="1" r:id="rId1"/><sheet name="分類別集計" sheetId="2" r:id="rId2"/></sheets></workbook>'},{name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},{name:'xl/styles.xml',data:styles},{name:'xl/worksheets/sheet1.xml',data:sheet1},{name:'xl/worksheets/sheet2.xml',data:sheet2}];
  try{const blob=new Blob([xlsxZip(files)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='家計簿-'+selectedMonth+'.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Excelファイルを保存しました')}catch{toast('Excelファイルを作成できませんでした')}
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
function showView(viewId){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===viewId));
document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===viewId));
window.scrollTo({top:0,behavior:'smooth'});render()}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
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
$('#exportExcelBtn').onclick=exportExcel;
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

// ボタン選択＋電卓式の手入力
const MANUAL_DEFAULTS={
  '食費':['野菜','肉','魚','フルーツ','調味料','お菓子','飲料','外食','その他'],
  '日用品':['洗剤','清掃用品','キッチン消耗品','衛生用品','コンタクト','その他'],
  '電気':['電気料金'],'ガス':['ガス料金'],'水道':['水道料金'],
  '娯楽費':['Netflix','U-NEXT','Amazonプライム','映画','ゲーム','本','その他'],
  '趣味・学習':['ChatGPT','電子書籍','オンライン講座','その他'],
  '税金・社会保険':['住民税','自動車税','国民健康保険','年金','その他'],
  '公共料金・放送':['NHK','その他'],
  '交通費':['電車','バス','タクシー','ガソリン','その他'],
  '医療費':['病院','薬','その他'],'その他':['その他']
};
let manualCustom=JSON.parse(localStorage.getItem('kakeibo-custom-subs-v1')||'{}');
Object.keys(MANUAL_DEFAULTS).forEach(main=>{
  const learned=Array.isArray(manualCustom[main])?manualCustom[main]:[];
  C[main]=[...new Set([...MANUAL_DEFAULTS[main],...learned])];
});
let manualMain='食費',manualSub='野菜',manualExpression='',manualAmount=0,manualItems=[];
function ensureManualPanel(){
  if($('#manualPanel'))return;
  const panel=document.createElement('div');
  panel.id='manualPanel';
  panel.hidden=true;
  panel.innerHTML=`<div class="manual-step"><span>1</span><strong>項目を選ぶ</strong></div>
    <div id="manualMainButtons" class="choice-grid main-choices"></div>
    <div class="manual-step"><span>2</span><strong>内訳を選ぶ</strong></div>
    <div id="manualSubButtons" class="choice-grid sub-choices"></div>
    <div class="custom-sub-row"><input id="customSubInput" type="text" placeholder="新しい項目（例：NHK）"><button type="button" id="addCustomSubBtn">追加</button></div>
    <p class="field-help">一度追加した項目は、次回からボタンで選べます。</p>
    <div class="manual-step"><span>3</span><strong>金額を計算する</strong></div>
    <div class="calculator-display"><small id="calcLabel">食費 ＞ 野菜</small><strong id="calcExpression">0</strong><span id="calcResult">0円</span></div>
    <div id="calcKeys" class="calc-keys">
      <button type="button" data-key="7">7</button><button type="button" data-key="8">8</button><button type="button" data-key="9">9</button><button type="button" class="operator" data-key="÷">÷</button>
      <button type="button" data-key="4">4</button><button type="button" data-key="5">5</button><button type="button" data-key="6">6</button><button type="button" class="operator" data-key="×">×</button>
      <button type="button" data-key="1">1</button><button type="button" data-key="2">2</button><button type="button" data-key="3">3</button><button type="button" class="operator" data-key="−">−</button>
      <button type="button" data-key="0">0</button><button type="button" data-key="00">00</button><button type="button" class="clear-key" data-key="C">C</button><button type="button" class="operator" data-key="＋">＋</button>
      <button type="button" class="equal-key" data-key="＝">＝ 合計</button>
    </div>
    <button type="button" class="add-calculated-button" id="addCalculatedBtn">この項目を追加</button>
    <div id="manualAddedList" class="manual-added-list"></div>
    <div class="review-total manual-total"><span>入力中の合計</span><strong id="manualGrandTotal">¥0</strong></div>
    <div class="dialog-actions"><button type="button" class="primary-button" id="manualReviewBtn">確認画面へ進む</button></div>`;
  $('#capturePanel').before(panel);
  $('#calcKeys').onclick=e=>{const key=e.target.dataset.key;if(!key)return;handleCalcKey(key)};
  $('#addCustomSubBtn').onclick=addCustomSub;
  $('#addCalculatedBtn').onclick=addCalculatedItem;
  $('#manualReviewBtn').onclick=finishManualEntry;
}
function renderManualChoices(){
  $('#manualMainButtons').innerHTML=Object.keys(C).map(x=>`<button type="button" data-main="${esc(x)}" class="${x===manualMain?'selected':''}">${categoryIcon(x,'')} ${esc(x)}</button>`).join('');
  $('#manualSubButtons').innerHTML=(C[manualMain]||['その他']).map(x=>`<button type="button" data-sub="${esc(x)}" class="${x===manualSub?'selected':''}">${categoryIcon(manualMain,x)} ${esc(x)}</button>`).join('');
  $('#manualMainButtons').onclick=e=>{if(!e.target.dataset.main)return;manualMain=e.target.dataset.main;manualSub=C[manualMain][0];renderManualChoices();updateCalcDisplay()};
  $('#manualSubButtons').onclick=e=>{if(!e.target.dataset.sub)return;manualSub=e.target.dataset.sub;renderManualChoices();updateCalcDisplay()};
}
function updateCalcDisplay(){
  $('#calcLabel').textContent=manualMain+' ＞ '+manualSub;
  $('#calcExpression').textContent=manualExpression||'0';
  $('#calcResult').textContent=(manualAmount||0).toLocaleString('ja-JP')+'円';
}
function calculateExpression(){
  const safe=manualExpression.replace(/＋/g,'+').replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/');
  if(!safe||!/^[0-9+*\/.-]+$/.test(safe))return 0;
  try{const value=Function('return ('+safe+')')();return Number.isFinite(value)?Math.max(0,Math.round(value)):0}catch{return 0}
}
function handleCalcKey(key){
  if(key==='C'){manualExpression='';manualAmount=0}
  else if(key==='＝'){manualAmount=calculateExpression();if(!manualAmount)toast('金額を入力してください')}
  else{const operator=/[＋−×÷]/.test(key);if(operator&&(!manualExpression||/[＋−×÷]$/.test(manualExpression)))return;manualExpression+=key;manualAmount=0}
  updateCalcDisplay();
}
function addCustomSub(){
  const value=$('#customSubInput').value.trim();if(!value)return toast('追加する項目名を入力してください');
  if(!C[manualMain].includes(value))C[manualMain].push(value);
  manualCustom[manualMain]=[...new Set([...(manualCustom[manualMain]||[]),value])];
  localStorage.setItem('kakeibo-custom-subs-v1',JSON.stringify(manualCustom));
  manualSub=value;$('#customSubInput').value='';renderManualChoices();updateCalcDisplay();toast('次回から選べる項目に追加しました');
}
function addCalculatedItem(){
  const amount=manualAmount||calculateExpression();if(!amount)return toast('金額を入力して「＝ 合計」を押してください');
  manualItems.push({id:uid(),name:manualSub,amount,main:manualMain,sub:manualSub});
  manualExpression='';manualAmount=0;renderManualAdded();updateCalcDisplay();
}
function renderManualAdded(){
  $('#manualAddedList').innerHTML=manualItems.map(i=>`<div class="manual-added-item"><span><b>${esc(i.main)} ＞ ${esc(i.sub)}</b><small>${yen(i.amount)}</small></span><button type="button" data-remove="${i.id}">×</button></div>`).join('');
  $('#manualGrandTotal').textContent=yen(manualItems.reduce((s,i)=>s+i.amount,0));
  $('#manualAddedList').onclick=e=>{if(!e.target.dataset.remove)return;manualItems=manualItems.filter(i=>i.id!==e.target.dataset.remove);renderManualAdded()};
}
function openManualEntry(){
  ensureManualPanel();editing=null;items=[];manualItems=[];manualExpression='';manualAmount=0;manualMain='食費';manualSub=C[manualMain][0];
  $('#memoInput').value='';$('#expenseDate').value=new Date().toISOString().slice(0,10);document.querySelector('[name=payment][value=cash]').checked=true;
  $('#capturePanel').hidden=true;$('#reviewPanel').hidden=true;$('#manualPanel').hidden=false;$('#dialogTitle').textContent='かんたん手入力';$('#dialogStep').textContent='選択して入力';
  renderManualChoices();renderManualAdded();updateCalcDisplay();$('#entryDialog').showModal();
}
function finishManualEntry(){
  if(manualExpression&&(manualAmount||calculateExpression()))addCalculatedItem();
  if(!manualItems.length)return toast('項目と金額を追加してください');
  items=manualItems.map(i=>({...i}));$('#manualPanel').hidden=true;$('#reviewPanel').hidden=false;$('#dialogStep').textContent='最終確認';$('#dialogTitle').textContent='内容を確認';draft();
}
const normalOpenEntry=openEntry;
$('#manualBtn').onclick=openManualEntry;
$('#voiceBtn').onclick=()=>{ensureManualPanel();$('#manualPanel').hidden=true;normalOpenEntry('voice')};
$('#cameraInput').onchange=e=>{if(e.target.files[0]){ensureManualPanel();$('#manualPanel').hidden=true;normalOpenEntry('camera',e.target.files[0])}e.target.value=''};
$('#photoInput').onchange=e=>{if(e.target.files[0]){ensureManualPanel();$('#manualPanel').hidden=true;normalOpenEntry('photo',e.target.files[0])}e.target.value=''};



import {timelineRows} from './robotron-circuits.js';
const printable=v=>v===undefined?'Absent':JSON.stringify(v);
export function diagnosticOverview(report){
 if(!report||typeof report!=='object'||!report.hardware||!Array.isArray(report.disks)||report.disks.length>2)throw Error('Invalid diagnostic report structure.');
 const t=report.timeline;if(!t||!Number.isInteger(t.count)||t.count<0||t.count>512||!Array.isArray(t.words)||t.words.length!==t.count*13||!t.words.every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff))throw Error('Invalid captured timeline.');
 const fields={date:report.date,appRevision:report.appRevision,coreSha256:report.coreSha256,firmwareIdentity:report.firmwareIdentity};
 function add(prefix,value,depth=0){if(depth>5)throw Error('Report metadata is too deeply nested.');if(value&&typeof value==='object'){for(const key of Object.keys(value).sort()){if(Object.keys(fields).length>=256)throw Error('Too many metadata fields.');add(prefix+'.'+key,value[key],depth+1);}}else{if(typeof value==='string'&&value.length>4096)throw Error('Metadata field is too long.');fields[prefix]=value;}}
 add('model',report.model);add('hardware',report.hardware);
 report.disks.forEach((d,i)=>{for(const key of ['label','size','sha256','writable'])fields[`disk${i}.${key}`]=d[key];fields[`disk${i}.contentsIncluded`]=typeof d.bytes==='string';});
 fields.checkpointIncluded=!!report.checkpoint;fields.capturedEvents=t.count;
 for(const value of Object.values(fields))if(printable(value).length>4096)throw Error('Metadata field is too long.');
 return {fields,events:timelineRows(new Uint32Array(t.words).buffer)};
}
// Bounded sequence alignment: values and timing are deliberately excluded from
// anchors so changed reads/writes remain visible. Repeated accesses can be ambiguous.
export function alignEvents(a,b){
 const key=e=>JSON.stringify([e.master,e.kind,e.address,e.space,e.offset]);
 const ak=a.map(key),bk=b.map(key),n=a.length,m=b.length;
 if(n>512||m>512)throw Error('Capture exceeds alignment limit.');
 const score=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)
  score[i][j]=ak[i]===bk[j]?1+score[i+1][j+1]:Math.max(score[i+1][j],score[i][j+1]);
 const pairs=[];let i=0,j=0;
 while(i<n||j<m){
  if(i<n&&j<m&&ak[i]===bk[j])pairs.push([i++,j++]);
  else if(i<n&&(j===m||score[i+1][j]>=score[i][j+1]))pairs.push([i++,null]);
  else pairs.push([null,j++]);
 }
 return pairs;
}
export function compareDiagnostics(a,b){
 const first=diagnosticOverview(a),second=diagnosticOverview(b),left=first.fields,right=second.fields;
 const changes=[...new Set([...Object.keys(left),...Object.keys(right)])].sort().filter(k=>printable(left[k])!==printable(right[k])).map(key=>({key,left:printable(left[key]),right:printable(right[key])}));
 const pairs=alignEvents(first.events,second.events);
 let differences=0,origin=null,timing=0;
 const emit=(key,l,r)=>{differences++;if(differences<=16)changes.push({key,left:printable(l),right:printable(r)});};
 for(const [i,j]of pairs){
  const a=i===null?undefined:first.events[i],b=j===null?undefined:second.events[j];
  if(!a||!b){emit(`Unmatched event A:${i??'—'} B:${j??'—'}`,a,b);continue;}
  const {cycle:ac,...av}=a,{cycle:bc,...bv}=b;
  if(origin===null){origin=bc-ac;if(origin)changes.push({key:'Clock origin offset (B − A)',left:'0',right:String(origin)});}
  if(printable(av)!==printable(bv))emit(`Aligned event A:${i} B:${j}`,a,b);
  if(bc-ac!==origin){timing++;if(timing===1)changes.push({key:`First relative timing difference A:${i} B:${j}`,left:String(ac),right:`${bc} (${bc-ac-origin} clocks beyond origin offset)`});}
 }
 if(timing)changes.push({key:'Aligned events with relative timing differences',left:'0',right:String(timing)});
 if(differences>16)changes.push({key:'Additional event differences',left:String(differences-16),right:'Only first 16 shown; full captures remain below.'});
 return changes;
}
export function installDiagnosticViewer(parent,decode){
 const box=document.createElement('details');box.id='diagnostic-viewer';box.innerHTML='<summary>View or compare downloaded reports</summary><p>Files stay in this browser. Opening a report does not restore its checkpoint or change the running machine.</p><label>Report A <input data-report="0" type="file" accept=".json"></label><label>Report B (optional comparison) <input data-report="1" type="file" accept=".json"></label><button data-clear>Clear reports</button><p data-status role="status"></p><div data-overview></div><details><summary>Captured events in report A</summary><p>Disk fields are contemporaneous context, not proof that an event accessed that sector.</p><pre data-events tabindex="0"></pre></details><details><summary>Captured events in report B</summary><pre data-events-b tabindex="0"></pre></details><p>Events are aligned by bus master, operation and mapped address. Values and relative timing are compared separately. Repeated accesses can align ambiguously; this does not establish equivalent guest execution.</p><div data-comparison></div>';
 parent.append(box);const reports=[null,null],versions=[0,0],$=q=>box.querySelector(q);
 function table(host,headers,rows){host.replaceChildren();const t=document.createElement('table');t.style.cssText='width:100%;table-layout:fixed;text-align:left';const tr=document.createElement('tr');for(const h of headers){const th=document.createElement('th');th.textContent=h;tr.append(th);}t.append(tr);for(const row of rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=String(value);td.style.cssText='overflow-wrap:anywhere;vertical-align:top;padding:4px 2px';tr.append(td);}t.append(tr);}host.append(t);}
 function render(){const a=reports[0];table($('[data-overview]'),['Report A field','Value'],a?Object.entries(diagnosticOverview(a).fields).map(([k,v])=>[k,printable(v)]):[]);$('[data-events]').textContent=a?diagnosticOverview(a).events.map(e=>JSON.stringify(e)).join('\n'):'';$('[data-events-b]').textContent=reports[1]?diagnosticOverview(reports[1]).events.map(e=>JSON.stringify(e)).join('\n'):'';const diff=a&&reports[1]?compareDiagnostics(a,reports[1]):null;table($('[data-comparison]'),['Changed field','A','B'],diff?diff.map(d=>[d.key,d.left,d.right]):[]);if(diff&&!diff.length)$('[data-comparison]').append(document.createTextNode('No metadata or captured-event differences.'));}
 for(const input of box.querySelectorAll('[data-report]'))input.onchange=async()=>{const i=Number(input.dataset.report),version=++versions[i];reports[i]=null;render();try{const f=input.files[0];if(!f)return;if(f.size>32*1024*1024)throw Error('Report exceeds 32 MiB.');const report=await decode(await f.arrayBuffer());diagnosticOverview(report);if(version!==versions[i])return;reports[i]=report;render();$('[data-status]').textContent='Report '+(i?'B':'A')+' checksum verified. No machine state was changed.';}catch(e){if(version===versions[i])$('[data-status]').textContent=e.message;}finally{input.value='';}};
 $('[data-clear]').onclick=()=>{reports.fill(null);versions[0]++;versions[1]++;render();$('[data-status]').textContent='Reports cleared.';};
}

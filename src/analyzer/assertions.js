// SPDX-License-Identifier: MIT
import {KINDS} from './capture.js';
const require=(ok,message)=>{if(!ok)throw Error(message);};
const integer=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
export function validateMatcher(m){
 require(m&&typeof m==='object'&&!Array.isArray(m),'Invalid event matcher');
 require(Object.keys(m).every(k=>['kind','address','addressMask','data','dataMask','note'].includes(k)),'Unknown matcher field');
 require(KINDS.includes(m.kind)&&m.kind!=='','Matcher requires an event kind');
 for(const [key,max] of [['address',65535],['addressMask',65535],['data',255],['dataMask',255]])if(m[key]!==undefined)require(integer(m[key],max),'Invalid '+key);
 if(m.note!==undefined)require(typeof m.note==='string'&&m.note.length<=256,'Invalid annotation text');
}
export function matches(r,m){
 const mask=m.addressMask??([4,5].includes(r.kind)?255:65535);
 return KINDS[r.kind]===m.kind && (m.address===undefined||!((r.address^m.address)&mask)) && (m.data===undefined||!((r.data^m.data)&(m.dataMask??255))) && (!m.note||r.annotations.some(n=>n.includes(m.note)));
}
export function validateSuite(s){
 require(s?.schema===1&&typeof s.id==='string'&&s.id.length<=128&&Array.isArray(s.rules)&&s.rules.length>0&&s.rules.length<=128,'Invalid assertion suite');
 const ids=new Set();for(const r of s.rules){
  require(typeof r.id==='string'&&r.id.length<=128&&!ids.has(r.id),'Invalid/duplicate rule ID');ids.add(r.id);
  require(['count','sequence','response','bound'].includes(r.type),'Unknown rule type');
  const allowed={count:['event','min','max'],sequence:['events'],response:['event','response','within_us'],bound:['event','field','max']}[r.type];
  require(Object.keys(r).every(k=>['id','type',...allowed].includes(k)),'Unknown rule field');
  if(r.type==='count')require(r.min!==undefined||r.max!==undefined,'Count needs an explicit bound');
  if(r.type==='sequence'){require(Array.isArray(r.events)&&r.events.length>0&&r.events.length<=64,'Invalid sequence');r.events.forEach(validateMatcher);}
  else{validateMatcher(r.event);if(r.type==='response'){validateMatcher(r.response);require(Number.isFinite(r.within_us)&&r.within_us>=0,'Invalid deadline');}}
  if(r.type==='count')require(integer(r.min??0)&&integer(r.max??Number.MAX_SAFE_INTEGER)&&(r.min??0)<=(r.max??Number.MAX_SAFE_INTEGER),'Invalid count bounds');
  if(r.type==='bound')require(['duration_us','wait_us'].includes(r.field)&&Number.isFinite(r.max)&&r.max>=0,'Invalid event bound');
 }return s;
}
export async function evaluate(c,suite,{start=0,end=c.header.count,check=()=>{}}={}){
 validateSuite(suite);require(integer(start)&&integer(end)&&start<=end&&end<=c.header.count,'Invalid assertion range');
 if(c.header.type!=='compact')return {schema:1,suite:suite.id,capture_sha256:c.summary.sha256,results:suite.rules.map(r=>({id:r.id,outcome:'not applicable',reason:'Requires compact bus cycles',evidence:[]}))};
 const states=suite.rules.map(rule=>({rule,count:0,position:0,pending:[],evidence:[],failure:false,incomplete:false,missing:false,resource:false}));
 const evidence=(s,r)=>{if(s.evidence.length<32)s.evidence.push(r.index);};
 for(const s of states){const ms=s.rule.type==='sequence'?s.rule.events:[s.rule.event,...(s.rule.response?[s.rule.response]:[])];s.missing=ms.some(m=>!(c.header.capture_mask&(1<<KINDS.indexOf(m.kind))));}
 let uncertain=!!c.header.dropped,lastTime=null,firstTime=null,work=0,exhausted=false;
 for await(const r of c.events(start,end,check)){
  check();firstTime??=r.elapsed_us;lastTime=r.elapsed_us+r.duration*1e6/c.header.clock_hz;
  if(r.flags||r.kind===9||r.annotations.some(n=>/uncertain|incomplete|length unknown|may include loss/.test(n)))uncertain=true;
  for(const s of states){if(++work>20000000){exhausted=true;break;}if(s.missing)continue;const q=s.rule;
   if(q.type==='sequence'){if(s.position<q.events.length&&matches(r,q.events[s.position])){s.position++;evidence(s,r);}continue;}
   if(q.type==='response'){
    const remaining=[];
    for(const p of s.pending){
     if(r.elapsed_us>p.time+q.within_us){s.failure=true;s.first_violation??={record:p.index,observed_at:r.index};if(s.evidence.length<32)s.evidence.push(p.index);}
     else remaining.push(p);
     work++;
    }s.pending=remaining;
    if(s.pending.length&&matches(r,q.response)){s.pending.shift();evidence(s,r);}
    if(matches(r,q.event)){s.count++;if(s.pending.length>=4096)s.resource=true;else s.pending.push({time:r.elapsed_us,index:r.index});}
   }else if(matches(r,q.event)){
    s.count++;if(q.type==='count'){if(s.count>(q.max??Number.MAX_SAFE_INTEGER)){s.failure=true;s.first_violation??={record:r.index,observed_at:r.index};}evidence(s,r);}
    else{const v=(q.field==='wait_us'?r.wait_samples:r.duration)*1e6/c.header.clock_hz;if(v>q.max){s.failure=true;s.first_violation??={record:r.index,observed_at:r.index};evidence(s,r);}}
   }
  }
  if(exhausted)break;
 }
 return {schema:1,suite:suite.id,revision:suite.revision??1,capture_sha256:c.summary.sha256,range:{start,end},results:states.map(s=>{
  const q=s.rule;let outcome='pass',reason='Expectation satisfied';
  if(s.missing){outcome='inconclusive';reason='Required event class excluded by capture filter';}
  else if(s.resource){outcome='inconclusive';reason='Pending-response resource limit exceeded';}
  else if(q.type==='response'){
   for(const p of s.pending)if(lastTime!==null&&lastTime>=p.time+q.within_us){s.failure=true;s.first_violation??={record:p.index,observed_at:end-1};}else s.incomplete=true;
   if(!s.count||s.incomplete){outcome='inconclusive';reason=!s.count?'No trigger event observed':'Recording ends before response deadline';}
  }else if(q.type==='sequence'&&s.position<q.events.length){outcome='fail';reason='Required sequence not observed in selected window';}
  else if(q.type==='count'&&s.count<(q.min??0)){outcome='fail';reason='Required event count not reached';}
  else if(q.type==='bound'&&!s.count){outcome='inconclusive';reason='No applicable events observed';}
  if(s.failure&&!s.missing&&!s.resource){outcome='fail';reason='Observed count, timing or response violation';}
  if(uncertain&&!s.missing&&!s.resource){outcome='inconclusive';reason='Loss, partial/unstable/saturated cycle or invalid bus observation limits inference';}
  if(exhausted){outcome='inconclusive';reason='Analysis work limit exceeded; select a smaller range or suite';}
  if(start===end){outcome='inconclusive';reason='Empty recording window';}
  return {id:q.id,outcome,reason,count:s.count,matched_sequence:s.position,evidence:s.evidence,...(s.first_violation?{first_violation:s.first_violation}:{})};
 })};
}
export const defaultSuite={schema:1,id:'classic-controller-integrity',revision:1,rules:[
 {id:'controller-writes',type:'count',event:{kind:'io_write'},min:1},
 {id:'verified-read-field',type:'count',event:{kind:'io_read',address:2,note:'CRC ok'},min:1},
 {id:'no-bad-data-crc',type:'count',event:{kind:'io_read',note:'CRC BAD'},max:0},
 {id:'no-bad-write-crc',type:'count',event:{kind:'io_write',note:'CRC BAD'},max:0}
]};

export const BUILTIN_SUITES=[defaultSuite,
 {schema:1,id:'original-session-smoke',revision:1,rules:[{id:'test-port-roundtrip',type:'sequence',events:[{kind:'io_write',address:64,data:85},{kind:'io_read',address:64}]}]},
 {schema:1,id:'model-interrupt-watchdog-envelope',revision:1,rules:[{id:'acknowledgement-observed',type:'count',event:{kind:'interrupt_ack'},min:1},{id:'io-wait-within-model-watchdog',type:'bound',event:{kind:'io_read'},field:'wait_us',max:81.92}]},
 {schema:1,id:'guest-storage-traffic',revision:1,rules:[{id:'read-data',type:'count',event:{kind:'io_read',address:2},min:1},{id:'write-data',type:'count',event:{kind:'io_write',address:0},min:1},...defaultSuite.rules.filter(r=>r.id.includes('crc'))]}
];

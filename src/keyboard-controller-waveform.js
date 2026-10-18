const ns='http://www.w3.org/2000/svg';
export function validateWaveform(data,connectivity){
 if(data.schema!==1||data.net!=='/D0'||data.connectivitySha256!==connectivity)throw Error('Waveform does not match this controller');
 if(!/^[a-f0-9]{40}$/.test(data.source?.revision)||data.source.repository!=='https://github.com/ddanila/dac-emulation')throw Error('Waveform source is not pinned');
 if(!Number.isFinite(data.readTimeSeconds)||!Array.isArray(data.samples)||data.samples.length<2)throw Error('Missing waveform samples');
 if(!Number.isFinite(data.lowMaximumVolts)||!Number.isFinite(data.highMinimumVolts)||data.lowMaximumVolts>=data.highMinimumVolts)throw Error('Invalid receiver limits');
 let previous=-Infinity;
 for(const row of data.samples){
  if(row.length!==3||!row.every(Number.isFinite)||row[0]<previous)throw Error('Invalid waveform samples');
  previous=row[0];
 }
 if(data.samples.at(-1)[0]<=data.samples[0][0])throw Error('Empty waveform time range');
 if(data.readTimeSeconds<data.samples[0][0]||data.readTimeSeconds>data.samples.at(-1)[0])throw Error('Read is outside the excerpt');
 for(const name of ['cpu','rom','latch'])for(const key of ['lowEnableBits7To0','highEnableBits7To0'])
  if(!/^[01xz]{8}$/.test(data.driversAtRead?.[name]?.[key]))throw Error('Missing driver observation');
 if(data.firmwareAnalysis){
  const a=data.firmwareAnalysis;
  if(a.reportPath!=='verification/robotron-keyboard/analog/reports/floating-io/static-analysis.json'||a.observableDependencyFound!==false||a.qualified!==false||!/^[a-f0-9]{64}$/.test(a.romSha256)||!/^[a-f0-9]{64}$/.test(data.source.files?.[a.reportPath]))throw Error('Invalid firmware analysis provenance');
 }
 return data;
}
export function installControllerWaveform(parent,connectivity,selectNet){
 const panel=document.createElement('details');panel.dataset.recordedWaveform='';
 const summary=document.createElement('summary');summary.textContent='Recorded reference waveform';panel.append(summary);
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Open to inspect a retained electrical-bus failure.';panel.append(status);parent.append(panel);
 let loaded=false,pending=false;
 panel.addEventListener('toggle',async()=>{
  if(!panel.open||loaded||pending)return;pending=true;status.textContent='Loading recorded waveform…';
  try{
   const url=`${import.meta.env.BASE_URL}models/robotron-1715m/keyboard-controller-waveform.json`;
   const response=await fetch(url);if(!response.ok)throw Error(`HTTP ${response.status}`);
   const data=validateWaveform(await response.json(),connectivity);
   const content=document.createElement('div');content.dataset.waveformContent='';
   const note=document.createElement('p');note.textContent=data.scope;content.append(note);
   const read=document.createElement('p');read.textContent=`CPU read at ${(data.readTimeSeconds*1e3).toFixed(6)} ms: port 0x${data.address.toString(16).padStart(4,'0')}, sampled byte ${data.sampledHex}. X marks unknown data.`;content.append(read);
   const owners=document.createElement('p');owners.dataset.waveformDrivers='';
   owners.textContent='Driver intent at that read: '+['cpu','rom','latch'].map(name=>{
    const d=data.driversAtRead[name];return `${name.toUpperCase()} ${d.lowEnableBits7To0==='00000000'&&d.highEnableBits7To0==='00000000'?'released':`low ${d.lowEnableBits7To0}, high ${d.highEnableBits7To0}`}`;
   }).join('; ')+'.';content.append(owners);
   if(data.firmwareAnalysis){
    const explanation=document.createElement('p');explanation.dataset.waveformFirmware='';
    explanation.textContent='Reference firmware analysis finds no control/data dependence on the released-read value under normal instruction behavior, matching external inputs, and no asynchronous interruptions or electrical faults. Internal flags may differ. Bus voltage and CPU timing remain unqualified. ';
    const source=document.createElement('a');source.textContent='Read the firmware analysis and assumptions';source.href=`${data.source.repository}/blob/${data.source.revision}/${data.firmwareAnalysis.reportPath}`;source.target='_blank';source.rel='noopener';explanation.append(source);content.append(explanation);
   }
   const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 250');svg.setAttribute('role','img');svg.setAttribute('aria-label','Recorded D0 and supply voltages around the CPU read, with the receiver unknown band shaded');svg.style.cssText='display:block;width:100%;max-width:700px;background:#14232d';content.append(svg);
   const add=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))e.setAttribute(key,value);if(text)e.textContent=text;svg.append(e);return e;};
   const start=data.samples[0][0],end=data.samples.at(-1)[0],x=t=>50+(t-start)/(end-start)*530,y=v=>210-v/5.5*185;
   add('rect',{x:50,y:y(data.highMinimumVolts),width:530,height:y(data.lowMaximumVolts)-y(data.highMinimumVolts),fill:'#65552c'});
   for(const v of [0,data.lowMaximumVolts,data.highMinimumVolts,5]){
    add('line',{x1:50,x2:580,y1:y(v),y2:y(v),stroke:'#6a7a82','stroke-width':.5});
    add('text',{x:5,y:y(v)+4,fill:'#e1e9ed','font-size':12},`${v} V`);
   }
   for(const [column,color]of [[2,'#8cc8ef'],[1,'#ffe16a']])add('polyline',{points:data.samples.map(row=>`${x(row[0])},${y(row[column])}`).join(' '),fill:'none',stroke:color,'stroke-width':2});
   add('line',{x1:x(data.readTimeSeconds),x2:x(data.readTimeSeconds),y1:20,y2:210,stroke:'#b5bfc5','stroke-dasharray':'3 3'});
   add('text',{x:65,y:18,fill:'#ffe16a','font-size':12},'D0');add('text',{x:105,y:18,fill:'#8cc8ef','font-size':12},'Supply');
   add('text',{x:240,y:y(1.25),fill:'#fff0c5','font-size':12},'Unknown input band');
   for(const [t,anchor]of [[start,'start'],[data.readTimeSeconds,'middle'],[end,'end']])add('text',{x:x(t),y:235,fill:'#e1e9ed','font-size':12,'text-anchor':anchor},`${((t-data.readTimeSeconds)*1e9).toFixed(1)} ns`);
   const marker=add('circle',{r:4,fill:'#fff',stroke:'#14232d','stroke-width':1});
   const label=document.createElement('label');label.textContent='Inspect recorded sample ';const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=data.samples.length-1;slider.step=1;slider.setAttribute('aria-label','Recorded waveform sample');label.append(slider);content.append(label);
   const output=document.createElement('p');output.dataset.waveformSample='';output.setAttribute('aria-live','polite');content.append(output);
   const update=()=>{const row=data.samples[Number(slider.value)],level=row[1]<=data.lowMaximumVolts?'low':row[1]>=data.highMinimumVolts?'high':'unknown';marker.setAttribute('cx',x(row[0]));marker.setAttribute('cy',y(row[1]));output.textContent=`Saved sample ${((row[0]-data.readTimeSeconds)*1e9).toFixed(3)} ns from the read: D0 ${row[1].toFixed(6)} V; supply ${row[2].toFixed(6)} V. Receiver level: ${level}.`;};
   slider.value=data.samples.reduce((best,row,i)=>Math.abs(row[0]-data.readTimeSeconds)<Math.abs(data.samples[best][0]-data.readTimeSeconds)?i:best,0);slider.oninput=update;update();
   const select=document.createElement('button');select.type='button';select.textContent='Highlight D0 connections';select.onclick=()=>selectNet(data.net);content.append(select);
   const link=document.createElement('a');link.textContent='Open pinned simulation report';link.href=`${data.source.repository}/blob/${data.source.revision}/${data.source.reportPath}`;link.target='_blank';link.rel='noopener';content.append(' · ',link);
   const download=document.createElement('a');download.textContent='Download excerpt and provenance';download.href=url;download.download='keyboard-controller-waveform.json';content.append(' · ',download);
   status.textContent='Recorded samples only; the shaded band marks unspecified input logic. Driver intent is captured at the read, not at each slider position.';panel.append(content);loaded=true;
  }catch(error){status.textContent=`Recorded waveform could not load: ${error.message}. Close and reopen to retry.`;}finally{pending=false;}
 });
}

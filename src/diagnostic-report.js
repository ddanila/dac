import {installDiagnosticViewer} from './diagnostic-viewer.js';
import {digest} from './session-store.js';
import {base64} from './recording.js';
export async function encodeDiagnostic(report){
 const payload=JSON.stringify(report);
 if(payload.length>24*1024*1024)throw Error('Diagnostic report exceeds 24 MiB.');
 return new TextEncoder().encode(JSON.stringify({format:'DAC-diagnostic-1',sha256:await digest(new TextEncoder().encode(payload)),payload})).buffer;
}
export function installDiagnosticReport(send,inspection){
 const panel=document.createElement('details');panel.id='diagnostic-report';panel.innerHTML=`<summary>Download diagnostic report</summary><p>Includes build identities, hardware settings, the current inspection view and up to 512 already captured bus events. Bus events may contain bytes from your programs. Capture events in the timeline first if needed.</p><label><input data-checkpoint type="checkbox">Include a restorable checkpoint (machine memory and both disks)</label><label><input data-disks type="checkbox">Include disk contents separately</label><button data-download>Download report</button><label>Extract checkpoint from a report <input data-extract type="file" accept=".json"></label><p data-status role="status"></p>`;
 document.getElementById('debug-controls').after(panel);installDiagnosticViewer(panel,decodeDiagnostic);const button=panel.querySelector('button'),status=panel.querySelector('[data-status]');
 button.onclick=()=>{button.disabled=true;status.textContent='Preparing report…';send({type:'diagnostic-report',inspection:inspection(),checkpoint:panel.querySelector('[data-checkpoint]').checked,disks:panel.querySelector('[data-disks]').checked,appRevision:import.meta.env.VITE_APP_REVISION});};
 panel.querySelector('[data-extract]').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>32*1024*1024)throw Error('Report exceeds 32 MiB.');const report=await decodeDiagnostic(await file.arrayBuffer()),cp=report.checkpoint;if(cp?.format!=='DAC-checkpoint-1'||await digest(new TextEncoder().encode(JSON.stringify(cp.payload)))!==cp.sha256)throw Error('No valid attached checkpoint.');const url=URL.createObjectURL(new Blob([JSON.stringify(cp)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='diagnostic.daccheckpoint';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Checkpoint extracted. Import it under Named checkpoints to check firmware compatibility.';}catch(error){status.textContent=error.message;}finally{e.target.value='';}};
 return {message(d){if(d.type!=='diagnostic-report-result'&&d.type!=='diagnostic-report-error')return;button.disabled=false;if(d.type.endsWith('error')){status.textContent=d.message;return;}const url=URL.createObjectURL(new Blob([d.bytes],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='robotron.dacdiagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Report downloaded. Nothing was uploaded.';}};
}
export const diagnosticBytes=bytes=>({encoding:'base64',bytes:base64(bytes)});
export async function decodeDiagnostic(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>32*1024*1024)throw Error('Report exceeds 32 MiB.');
 const file=JSON.parse(new TextDecoder().decode(bytes));if(file.format!=='DAC-diagnostic-1'||typeof file.payload!=='string'||await digest(new TextEncoder().encode(file.payload))!==file.sha256)throw Error('Report checksum failed.');return JSON.parse(file.payload);
}

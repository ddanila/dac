import {writeFileSync} from 'node:fs';
import {monitorLeadPath,monitorLeadDefinitions,leadMetrics,leadLidClear} from '../src/monitor-cables.js';
import {inspectionOffset} from '../src/inspection-paths.js';
const rows=[];
for(const [name,definition] of Object.entries(monitorLeadDefinitions))for(const parking of [0,24])for(let step=0;step<=40;step++){
 const fraction=step/40,offset=inspectionOffset('system-lid',fraction),path=monitorLeadPath(name,offset,parking),metrics=leadMetrics(path),start=definition.curves[0][0].map((v,i)=>v+offset[i]),end=definition.curves.at(-1)[3].map((v,i)=>v+(i===1?parking:0));
 const error=Math.max(...path[0].map((v,i)=>Math.abs(v-start[i])),...path.at(-1).map((v,i)=>Math.abs(v-end[i])));
 const lidClear=leadLidClear(path,offset,definition.radius),restLength=leadMetrics(monitorLeadPath(name)).length;
 const lengthChange=metrics.length-restLength,lengthChangePercent=100*lengthChange/restLength;
 rows.push({restLength,lengthChange,lengthChangePercent,lidClear,name,fraction,parking,...metrics,endpointError:error,clear:lidClear&&error<1e-8&&metrics.minRadius>definition.radius*2&&metrics.maxTurnDegrees<30});
}
const report={scope:'164 sampled centerline poses, two leads, connected/parked ends, canonical system-cover path. Monitor upper-shell movement leaves the captive lead ends unchanged. Nominal radius, not a manufacturer bend specification: minimum centerline radius must exceed twice the modeled cable radius and direction changes stay below 30 degrees per sample. Tube cross sections are rotated rigidly. Every line segment between sampled centers also stays outside the lid bounding box expanded by cable radius. Length changes are disclosed as illustrative stretching, not physical slack. No continuous-pose or whole-enclosure collision or real slack/strain certification.',allSamplesPass:rows.every(r=>r.clear),results:rows};
writeFileSync(new URL('../docs/robotron/monitor-cable-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(`${rows.length} samples; pass=${report.allSamplesPass}`);if(!report.allSamplesPass)process.exitCode=1;

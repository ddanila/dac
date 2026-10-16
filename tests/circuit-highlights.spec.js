import {test,expect} from '@playwright/test';
test('circuit selection highlights package instances and clears without changing geometry',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{loadRobotron}=await import('/src/robotron-model.js');const model=await loadRobotron(new T.CanvasTexture(document.createElement('canvas')));model.focusCircuit('A3',['A1','A5']);const refs=[];model.group.traverse(o=>{if(o.userData.circuitRef)refs.push(o.userData.circuitRef);});model.focusCircuit(null);let remaining=0;model.group.traverse(o=>{if(o.userData.circuitRef)remaining++;});return {refs,remaining};});
 expect(result.refs.sort()).toEqual(['A1','A3','A5']);expect(result.remaining).toBe(0);
});
test('timeline preserves cycle, physical RAM offset and disk context',async()=>{
 const {timelineRows}=await import('../src/robotron-circuits.js');
 const rows=timelineRows(Uint32Array.from([9,1,1,0x4000,0xa5,1,1,0x24000,0,17,1,3,2]).buffer);
 expect(rows).toEqual([{cycle:4294967305,kind:'MW',address:0x4000,value:0xa5,master:'DMA',space:1,offset:0x24000,unit:0,cylinder:17,head:1,sector:3,phase:2}]);
});

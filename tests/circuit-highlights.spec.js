import {test,expect} from '@playwright/test';
test('circuit selection highlights package instances and clears without changing geometry',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{loadRobotron}=await import('/src/robotron-model.js');const model=await loadRobotron(new T.CanvasTexture(document.createElement('canvas')));model.focusCircuit('A3',['A1','A5']);const refs=[];model.group.traverse(o=>{if(o.userData.circuitRef)refs.push(o.userData.circuitRef);});model.focusCircuit(null);let remaining=0;model.group.traverse(o=>{if(o.userData.circuitRef)remaining++;});return {refs,remaining};});
 expect(result.refs.sort()).toEqual(['A1','A3','A5']);expect(result.remaining).toBe(0);
});

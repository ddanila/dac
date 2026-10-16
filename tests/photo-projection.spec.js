import {test,expect} from '@playwright/test';
import {fitProjection,projectPoint} from '../scripts/photo-projection.mjs';
test('perspective fit predicts held-out landmarks and rejects degenerate inputs',()=>{
 const h=[1.2,.1,30,-.15,.9,15,.0004,-.0003];
 const pairs=[[0,0],[600,0],[0,400],[600,400]].map(model=>({model,photo:projectPoint(h,model)}));
 const fit=fitProjection(pairs),point=[230,170];expect(projectPoint(fit,point)[0]).toBeCloseTo(projectPoint(h,point)[0],7);expect(projectPoint(fit,point)[1]).toBeCloseTo(projectPoint(h,point)[1],7);
 expect(()=>fitProjection(Array.from({length:4},()=>pairs[0]))).toThrow('degenerate');
});
test('photo review renders controls and evaluates perspective fit in browser',async({page})=>{
 const {reviewControls,reviewStyle,reviewScript}=await import('../scripts/photo-review-ui.mjs');const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<style>${reviewStyle}</style>${reviewControls({name:'test',photo:''})}${reviewScript}`);
 const box=page.locator('.overlay');await page.locator('summary').click();
 for(const point of [{x:30,y:30},{x:300,y:30},{x:30,y:300},{x:300,y:300}]){await page.locator('[data-action=measure]').click();await box.click({position:point});await box.click({position:point});}
 await page.locator('[data-action=fit]').click();await expect(page.locator('.review-result')).toContainText('Training: 4 points, RMS 0.00 px');expect(errors).toEqual([]);
});

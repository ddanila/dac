import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
test('functional keyboard release binds museum assets and keeps electrical scope separate',()=>{
 expect(execFileSync('python3',['scripts/keyboard-controller-release.py','--check'],{encoding:'utf8'})).toContain('release inputs verified');
});
test('release checker rejects stale evidence and broadened qualification claims',()=>{
 for(const mutation of ["r['files'][next(iter(r['files']))]='0'*64", "r['electricallyQualified']=True"]){
  const code="import runpy; m=runpy.run_path('scripts/keyboard-controller-release.py'); r=m['read'](m['TARGET']); "+mutation+"; m['check'](r)";
  expect(()=>execFileSync('python3',['-c',code],{stdio:'pipe'})).toThrow();
 }
});

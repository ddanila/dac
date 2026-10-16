// A cancelled/failed intervening push must not erase its required coverage.
import {execFileSync} from 'node:child_process';
export function successfulBaseline(runs,branch,head){return runs.find(r=>r.conclusion==='success'&&r.event==='push'&&r.head_branch===branch&&r.head_sha!==head)?.head_sha||null;}
export function validatedBaseline(env=process.env){
 if(env.GITHUB_EVENT_NAME!=='push'||!env.GH_TOKEN||!env.GITHUB_REPOSITORY)return null;
 try{
  const api=path=>JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8',env}));
  const branch=env.GITHUB_REF_NAME,head=env.GITHUB_SHA;
  const runs=api(`repos/${env.GITHUB_REPOSITORY}/actions/workflows/site.yml/runs?branch=${encodeURIComponent(branch)}&event=push&status=success&per_page=20`).workflow_runs;
  const base=successfulBaseline(runs,branch,head);if(!base)return null;
  const comparison=api(`repos/${env.GITHUB_REPOSITORY}/compare/${base}...${head}`);
  return ['ahead','identical'].includes(comparison.status)&&comparison.merge_base_commit.sha===base?base:null;
 }catch{return null;} // Missing evidence always selects full coverage.
}

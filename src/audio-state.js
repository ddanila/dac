export function audioStateChanged(){if(typeof window!=='undefined')window.dispatchEvent(new Event('dac-audio-state'));}
export function audioStatus(enabled,context,error){return !enabled?'disabled':error?'blocked or unavailable: '+error:!context?'not started':context.state||'running';}

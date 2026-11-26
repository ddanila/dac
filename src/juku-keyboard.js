let definitions;
export function setJukuKeyboardDefinitions(value) {
  if(value?.schema!==1 || !['juku','juss','at'].every(n=>Array.isArray(value.layouts?.[n]?.keys)))throw Error('Invalid Juku keyboard definitions.');
  definitions=value;
}
import {jukuCharacter} from './input-sequence.js';
export function jukuLayout(profile) {
  const name=profile==='card-at'?'at':['mainboard-juss','early-juss','single-density'].includes(profile)?'juss':'juku';
  return definitions?.layouts[name] || {keys:[]};
}
export class JukuHostKeyboard {
  constructor(send) {this.send=send;this.held=new Map();this.profile='mainboard-juku';this.mode='text';}
  release() {this.held.clear();this.send({type:'keyboard-release'});}
  configure(profile,mode=this.mode) {this.release();this.profile=profile;this.mode=mode;}
  press(token,event) {
    if(this.held.has(token))return;
    this.held.set(token,event);
    if(![...this.held.entries()].some(([k,v])=>k!==token&&v.type===event.type&&v.key===event.key))this.send({...event,down:true});
  }
  up(token) {
    const event=this.held.get(token);if(!event)return false;
    this.held.delete(token);
    if(![...this.held.values()].some(v=>v.type===event.type&&v.key===event.key))this.send({...event,down:false});
    return true;
  }
  down(e) {
    if(e.repeat||this.held.has(e.code))return true;
    const physical=jukuLayout(this.profile).keys.find(k=>k.codes.includes(e.code));
    // Host Meta shortcuts remain available. The physical mode owns real Ctrl/Alt.
    if(e.metaKey)return false;
    if(this.mode==='physical' || ['CapsLock','NumLock','ScrollLock'].includes(e.code)) {
      if(!physical)return false;
      this.press(e.code,{type:'keyboard-contact',key:physical.id});return true;
    }
    let key;
    if(e.key==='Enter')key=13;
    else if(e.key==='Tab')key=9;
    else if(e.key==='Backspace')key=8;
    else if(e.key.length===1) {
      // Guest Caps state belongs to the ROM; remove host Caps from the text identity.
      let text=e.key;
      if(e.getModifierState?.('CapsLock'))text=e.shiftKey?text.toUpperCase():text.toLowerCase();
      key=jukuCharacter(text);
      if(e.ctrlKey&&key!==undefined&&/^[a-z]$/i.test(text))key=text.toUpperCase().charCodeAt(0)&31;
    } else key={ArrowDown:0x80,ArrowUp:0x8b,ArrowRight:0x8c,ArrowLeft:0x8d,Delete:0x81,Home:0x85,End:0x8e,PageUp:0x8f,PageDown:0x90,F1:0x87,F2:0x88,F3:0x89,F4:0x8a,F5:0x82,F6:0x83,F7:0x91,F8:0x84}[e.key];
    if(key!==undefined) {this.press(e.code,{type:'key',key});return true;}
    // Extra AT functions and host-independent controls still use physical keys.
    if(physical && !physical.modifier) {this.press(e.code,{type:'keyboard-contact',key:physical.id});return true;}
    return false;
  }
}
export function renderJukuKeyboard(root,host,active) {
  root.replaceChildren();
  for(const key of jukuLayout(host.profile).keys) {
    const button=document.createElement('button');button.type='button';button.textContent=key.label;
    button.dataset.contact=key.id;button.title=key.codes.join(', ')||key.label;
    const token='panel:'+key.id,press=()=>{if(active())host.press(token,{type:'keyboard-contact',key:key.id});};
    const release=()=>host.up(token);
    if(key.modifier) {
      button.setAttribute('aria-pressed','false');
      button.onclick=()=>{if(!active())return;if(host.held.has(token))release();else press();button.setAttribute('aria-pressed',String(host.held.has(token)));};
    } else {
      button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);press();};
      button.onpointerup=button.onpointercancel=button.onlostpointercapture=release;
      button.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)press();}};
      button.onkeyup=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();release();}};
      button.onblur=release;
    }
    root.append(button);
  }
}

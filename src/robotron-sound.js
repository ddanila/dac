// Blend the recorded tail into its head, then loop at adjacent source samples.
// The original WAV remains unchanged; no synthesized fan replaces it.
export function seamlessFan(context,buffer){
 if(!buffer?.getChannelData||!context.createBuffer)return buffer;
 const n=Math.min(Math.round(buffer.sampleRate*.08),Math.floor(buffer.length/4));if(n<2)return buffer;
 const result=context.createBuffer(buffer.numberOfChannels,buffer.length-n,buffer.sampleRate);
 for(let ch=0;ch<buffer.numberOfChannels;ch++){const src=buffer.getChannelData(ch),out=result.getChannelData(ch),plain=buffer.length-2*n;out.set(src.subarray(n,buffer.length-n));for(let i=0;i<n;i++){const t=i/(n-1);out[plain+i]=src[buffer.length-n+i]*(1-t)+src[i]*t;}}
 return result;
}
// Recorded from Danila's Robotron. Opt-in audio; no oscillator substitutes.
export function keySoundGroup(key) {
  const code = typeof key === 'number' ? key : key?.input?.code;
  return code === 32 ? 'space' : code === 13 ? 'enter' : 'regular';
}
export function createRobotronSound({
  createContext = () => new AudioContext(),
  fetchAsset = (url) => fetch(url),
  base = `${import.meta.env?.BASE_URL || '/'}audio/robotron/`,
} = {}) {
  let context, master, loading, enabled = false, powered = false, hidden = false;
  let epoch = 0, spatial = false, pans = {keyboard:0,case:0};
  const panners = {}, gains={}, levels={fan:1,power:1,keyboard:1};
  const buffers = new Map(), voices = new Set(), variants = { regular: 0, space: 0, enter: 0 };
  const names = ['power-on', 'fan', 'power-off', ...Object.keys(variants).flatMap(k => [1,2,3].map(i => `${k}-${i}`))];
  function stop() {
    epoch++;
    for (const source of voices) { source.onended = null; source.stop(); source.disconnect(); }
    voices.clear();
  }
  function play(name, loop = false, ended) {
    if (!enabled || hidden || !buffers.has(name)) return;
    const source = context.createBufferSource();
    source.buffer = buffers.get(name); source.loop = loop;
    source.connect(gains[/^(regular|space|enter)-/.test(name)?'keyboard':name==='fan'?'fan':'power'] || master); voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); ended?.(); };
    source.start();
    return source;
  }
  function steady() { if (powered && enabled && !hidden) play('fan', true); }
  async function unlock() {
    if (!enabled) return;
    if (!context) {
      context = createContext(); master = context.createGain();
      master.gain.value = .45; master.connect(context.destination);
      if(context.createStereoPanner) for(const group of ['keyboard','case']) {
        const panner = context.createStereoPanner();panner.pan.value=spatial?pans[group]:0;
        panner.connect(master);panners[group]=panner;
      }
    }
    for(const group of Object.keys(levels))if(!gains[group]){const g=context.createGain();g.gain.value=levels[group];g.connect(panners[group==='keyboard'?'keyboard':'case']||master);gains[group]=g;}
    await context.resume();
    if (!loading) loading = Promise.all(names.map(async name => {
      const response = await fetchAsset(`${base}${name}.wav`);
      if (!response.ok) throw new Error(`Cannot load Robotron sound: ${name}`);
      const decoded=await context.decodeAudioData(await response.arrayBuffer());buffers.set(name,name==='fan'?seamlessFan(context,decoded):decoded);
    })).catch(error => { loading = undefined; throw error; });
    await loading;
  }
  return {
    unlock,
    volume(group,value){if(!(group in levels)||!Number.isFinite(value)||value<0||value>1)throw Error("Invalid sound volume.");levels[group]=value;if(gains[group]){if(gains[group].gain.setTargetAtTime)gains[group].gain.setTargetAtTime(value,context.currentTime,.025);else gains[group].gain.value=value;}},
    spatial(value) {spatial=!!value;for(const group of Object.keys(panners))panners[group].pan.setTargetAtTime(spatial?pans[group]:0,context.currentTime,.05);},
    position(value) {pans=value;for(const group of Object.keys(panners))panners[group].pan.setTargetAtTime(spatial?pans[group]:0,context.currentTime,.05);},
    async enable(value) {
      enabled = value; stop();
      const token = epoch;
      if (value) { await unlock(); if (token === epoch) steady(); }
    },
    async power(value) {
      if (value === powered) return;
      powered = value; stop();
      const token = epoch;
      if (!enabled || hidden) return;
      await unlock();
      if (token !== epoch) return;
      play(value ? 'power-on' : 'power-off', false, value ? () => { if (token === epoch) steady(); } : undefined);
    },
    key(key) {
      if (!powered || !enabled || hidden || !buffers.size) return;
      const group = keySoundGroup(key), variant = variants[group]++ % 3 + 1;
      play(`${group}-${variant}`);
    },
    async visibility(value) {
      hidden = value; stop();
      const token = epoch;
      if (!hidden && enabled) { await unlock(); if (token === epoch) steady(); }
    },
    // Machine/profile changes are not physical switch clicks.
    reset() { powered = false; stop(); },
  };
}

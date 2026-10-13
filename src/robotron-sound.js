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
  let epoch = 0;
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
    source.connect(master); voices.add(source);
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
    }
    await context.resume();
    if (!loading) loading = Promise.all(names.map(async name => {
      const response = await fetchAsset(`${base}${name}.wav`);
      if (!response.ok) throw new Error(`Cannot load Robotron sound: ${name}`);
      buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
    })).catch(error => { loading = undefined; throw error; });
    await loading;
  }
  return {
    unlock,
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

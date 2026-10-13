import { test, expect } from '@playwright/test';
import { createRobotronSound, keySoundGroup } from '../src/robotron-sound.js';
function fixture(fetchAsset = async url => ({ ok: true, arrayBuffer: async () => url })) {
  const played = [];
  const context = {
    destination: {}, resume: async () => {}, decodeAudioData: async value => value,
    createGain: () => ({ gain: {}, connect() {} }),
    createBufferSource: () => ({ connect() {}, disconnect() {}, stop() { this.stopped = true; }, start() { played.push(this); } }),
  };
  return { sound: createRobotronSound({ createContext: () => context, fetchAsset, base: '/' }), played };
}
test('recorded startup becomes a fan loop; shutdown replaces it and mute cancels it', async () => {
  const { sound, played } = fixture();
  await sound.enable(true); await sound.power(true);
  expect(played.map(p => p.buffer)).toEqual(['/power-on.wav']);
  played[0].onended();
  expect(played[1].buffer).toBe('/fan.wav'); expect(played[1].loop).toBe(true);
  await sound.power(false);
  expect(played[1].stopped).toBe(true); expect(played[2].buffer).toBe('/power-off.wav');
  await sound.enable(false); expect(played[2].stopped).toBe(true);
});
test('keys use three takes per class; visibility and profile changes stop sounds', async () => {
  const { sound, played } = fixture();
  await sound.power(true); expect(played).toHaveLength(0);
  await sound.enable(true); expect(played[0].buffer).toBe('/fan.wav');
  for (let i=0;i<4;i++) sound.key({ input: { code: 32 } });
  sound.key(13); sound.key(65);
  expect(played.slice(1).map(p=>p.buffer)).toEqual(['/space-1.wav','/space-2.wav','/space-3.wav','/space-1.wav','/enter-1.wav','/regular-1.wav']);
  await sound.visibility(true); sound.key(65); expect(played).toHaveLength(7);
  await sound.visibility(false); expect(played.at(-1).buffer).toBe('/fan.wav');
  sound.reset(); expect(played.at(-1).stopped).toBe(true);
  sound.key(65); expect(played).toHaveLength(8);
  expect(keySoundGroup({ input: { modifier: 'shift' } })).toBe('regular');
});
test('late downloads cannot restart audio after power off or mute', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const { sound, played } = fixture(async url => { await pending; return { ok:true, arrayBuffer:async()=>url }; });
  const enabling = sound.enable(true);
  const powering = sound.power(true);
  await sound.enable(false); finish(); await Promise.all([enabling,powering]);
  expect(played).toHaveLength(0);
});
test('browser decodes all recorded WAVs and starts/stops actual audio sources', async ({ page }) => {
  await page.route('**/audio-check', route => route.fulfill({ contentType:'text/html', body:'<button>Enable</button>' }));
  await page.goto('/audio-check');
  await page.evaluate(async () => {
    const { createRobotronSound } = await import('/src/robotron-sound.js');
    const context = new AudioContext();
    window.audioContext = context;
    window.recordedSound = createRobotronSound({ createContext:()=>context });
    document.querySelector('button').onclick = () => {
      window.audioReady = window.recordedSound.enable(true);
    };
  });
  await page.click('button');
  await page.evaluate(async () => {
    await window.audioReady;
    await window.recordedSound.power(true);
    window.recordedSound.key(32); window.recordedSound.key(13);
    await window.recordedSound.power(false);
    await window.recordedSound.enable(false);
    await window.audioContext.close();
  });
});

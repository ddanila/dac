import {test, expect} from '@playwright/test';
import {runtimeReady} from './runtime-fixture.js';

test('foreign builds cannot alter the running machine; old checkpoints remain exportable', async ({page}) => {
  await page.addInitScript(() => {
    const Base = Worker;
    window.Worker = class extends Base {
      constructor(...args) { super(...args); window.coreWorker = this; }
    };
  });
  await runtimeReady(page);
  await page.locator('#media-controls').evaluate(e => e.open = true);
  await page.locator('#demo').click();
  await page.locator('#drive-b-controls').evaluate(e => e.open = true);
  await page.locator('#blank-b').click();
  await expect(page.locator('#disk-b-status')).toContainText('inserted');
  await page.locator('#power').click();
  await expect(page.locator('#status')).toHaveText('Running');
  const result = await page.evaluate(async () => {
    const worker = window.coreWorker;
    const request = (message, type) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error(`No ${type} response to ${message.type}`)), 5000);
      const listener = ({data}) => {
        if (data.type === type) {clearTimeout(timer); worker.removeEventListener('message', listener); resolve(data);}
      };
      worker.addEventListener('message', listener);
      worker.postMessage(message);
    });
    const store = await import('/src/session-store.js');
    const checkpoints = await import('/src/checkpoints.js');
    const recordings = await import('/src/recording.js');
    await request({type:'record-start'}, 'record-status');
    const recording = await request({type:'record-stop'}, 'download');
    worker.postMessage({type:'visibility', hidden:true});
    const snapshot = (await request({type:'export-state'}, 'download')).bytes;
    await request({type:'checkpoint-save', name:'Current'}, 'checkpoint-status');
    const key = (await store.storedKeys()).find(k => k.startsWith('checkpoint:'));
    const checkpoint = await checkpoints.loadCheckpoint(key);
    const foreign = 'f'.repeat(64);
    checkpoint.build = foreign;
    checkpoint.stateKey = checkpoint.stateKey.replace(/^state:[a-f0-9]{64}:/, `state:${foreign}:`);
    const oldKey = await checkpoints.saveCheckpoint({...checkpoint, name:'Old build'});
    const before = await store.digest(await (await import('/src/collection-backup.js')).exportCollection());
    const {header, offset} = store.snapshotHeader(snapshot);
    const oldState = await store.encodeSnapshot(header.key.replace(/^state:[a-f0-9]{64}:/, `state:${foreign}:`), snapshot.slice(offset));
    const record = await recordings.decodeRecording(recording.bytes);
    record.build = foreign;
    const errors = [];
    errors.push((await request({type:'import-state', bytes:oldState}, 'storage')).message);
    errors.push((await request({type:'checkpoint-restore', key:oldKey}, 'checkpoint-status')).message);
    errors.push((await request({type:'record-replay', bytes:await recordings.encodeRecording(record)}, 'record-status')).message);
    const afterState = (await request({type:'export-state'}, 'download')).bytes;
    const after = await store.digest(await (await import('/src/collection-backup.js')).exportCollection());
    const exported = await checkpoints.exportCheckpoint(oldKey);
    const exportedOld = JSON.parse(new TextDecoder().decode(exported)).payload;
    worker.postMessage({type:'checkpoint-list'});
    return {errors, sameState:await store.digest(snapshot) === await store.digest(afterState), sameStorage:before === after,
      oldKey, exportedBuild:exportedOld.build, diskSizes:exportedOld.disks.map(d => d.bytes.length)};
  });
  expect(result.errors).toHaveLength(3);
  for (const error of result.errors) expect(error).toContain('Unsupported emulator build');
  expect(result.sameState).toBe(true);
  expect(result.sameStorage).toBe(true);
  expect(result.exportedBuild).toBe('f'.repeat(64));
  expect(result.diskSizes[1]).toBeGreaterThan(0);
  await page.locator('#checkpoint-controls').evaluate(e => e.open = true);
  await page.locator('#checkpoint-list').selectOption(result.oldKey);
  await expect(page.locator('#checkpoint-list option:checked')).toContainText('Unsupported build');
  await expect(page.locator('#checkpoint-restore')).toBeDisabled();
  await expect(page.locator('#checkpoint-export')).toBeEnabled();
  await expect(page.locator('#checkpoint-delete')).toBeEnabled();
  await expect(page.locator('#status')).toHaveText('Running');
  await expect(page.locator('#error')).toBeEmpty();
});

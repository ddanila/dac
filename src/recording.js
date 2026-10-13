import { digest } from "./session-store.js";
export const RECORD_LIMIT = 100000;
export function base64(bytes) {
  const data = new Uint8Array(bytes);
  let text = "";
  for (let i = 0; i < data.length; i += 16384)
    text += String.fromCharCode(...data.subarray(i, i + 16384));
  return btoa(text);
}
export function unbase64(text) {
  if (
    typeof text !== "string" ||
    text.length > 2400000 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(text)
  )
    throw Error("Invalid recording media.");
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0)).buffer;
}
export async function encodeRecording(record) {
  const payload = JSON.stringify(record);
  return new TextEncoder().encode(
    JSON.stringify({
      format: "DAC-recording-1",
      sha256: await digest(new TextEncoder().encode(payload)),
      payload,
    }),
  ).buffer;
}
export async function decodeRecording(bytes) {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength > 16 * 1024 * 1024)
    throw Error("Recording exceeds 16 MB.");
  const file = JSON.parse(new TextDecoder().decode(bytes));
  if (
    file.format !== "DAC-recording-1" ||
    typeof file.payload !== "string" ||
    (await digest(new TextEncoder().encode(file.payload))) !== file.sha256
  )
    throw Error("Recording failed its integrity check.");
  const r = JSON.parse(file.payload);
  if (
    ![0, 1, 2].includes(r.kind) ||
    typeof r.build !== "string" ||
    !Array.isArray(r.firmware) ||
    r.firmware.length > 4 ||
    !Array.isArray(r.disks) ||
    r.disks.length !== 2 ||
    !Array.isArray(r.writable) ||
    r.writable.length !== 2 ||
    !r.writable.every((v) => typeof v === "boolean") ||
    !Array.isArray(r.events) ||
    r.events.length > RECORD_LIMIT
  )
    throw Error("Invalid recording header.");
  const slots = new Set();
  for (const [slot, data] of r.firmware) {
    if (![0, 1, 2, 3].includes(slot) || slots.has(slot))
      throw Error("Invalid firmware slot.");
    slots.add(slot);
    unbase64(data);
  }
  for (const data of r.disks) if (data !== null) unbase64(data);
  r.media ||= [];
  if (!Array.isArray(r.media) || r.media.length > 8)
    throw Error("Too many recorded media changes.");
  for (const media of r.media) {
    if (typeof media.writable !== "boolean")
      throw Error("Invalid media protection.");
    if (media.bytes !== null) unbase64(media.bytes);
  }
  for (const e of r.events) {
    if (!Array.isArray(e) || !e.every(Number.isInteger))
      throw Error("Invalid recording event.");
    const [op, a, b] = e;
    if (op === 0 && e.length === 2 && a > 0 && a <= 100000) continue;
    if (
      [1, 2, 3].includes(op) &&
      e.length === 3 &&
      a >= 0 &&
      a < (op === 1 ? 256 : 104) &&
      b >= 0 &&
      b <= (op === 3 ? 3 : 1)
    )
      continue;
    if (
      op === 7 &&
      e.length === 3 &&
      a >= 0 &&
      a < 2 &&
      b >= 0 &&
      b < r.media.length
    )
      continue;
    if ([9,10].includes(op) && e.length === 3 && a >= 0 && a < 2 && b >= 0 && b < 2) continue;
    if ([4, 5, 6, 8].includes(op) && e.length === 1) continue;
    throw Error("Unsupported recording event.");
  }
  if (
    !Array.isArray(r.result) ||
    r.result.length !== 4 ||
    !r.result.every((x) => typeof x === "string" && /^[a-f0-9]{64}$/.test(x))
  )
    throw Error("Invalid recording result.");
  return r;
}
export function playEvent(module, handle, e, media = []) {
  const [op, a, b] = e;
  if (op === 7) {
    const disk = media[b],
      bytes = disk.bytes
        ? new Uint8Array(unbase64(disk.bytes))
        : new Uint8Array();
    const p = bytes.length ? module._malloc(bytes.length) : 0;
    if (bytes.length && !p) throw Error("Not enough memory for replay disk.");
    try {
      if (p) module.HEAPU8.set(bytes, p);
      if (
        module._dac_mount_unit(
          handle,
          a,
          p,
          bytes.length,
          Number(disk.writable),
        ) < 0
      )
        throw Error("Recorded media rejected.");
    } finally {
      if (p) module._free(p);
    }
    return;
  }
  if (op === 9 || op === 10) {
    const action = op === 9 ? module._dac_drive_door : module._dac_drive_inserted;
    if (!action || action(handle, a, b) < 0) throw Error("Recorded drive lever rejected.");
    return;
  }
  if (op === 8) {
    module._dac_printer_clear(handle);
    return;
  }
  const result =
    op === 0
      ? module._dac_run(handle, a)
      : op === 1
        ? module._dac_key(handle, a, b)
        : op === 2
          ? module._dac_matrix(handle, a, b)
          : op === 3
            ? module._dac_tap(handle, a, b)
            : op === 4
              ? module._dac_reset(handle)
              : module._dac_power(handle, op === 6 ? 1 : 0);
  if (result < 0 || (op === 0 && result === 0))
    throw Error("Recording event rejected by emulator.");
}
export async function outputHashes(module, handle) {
  const pixels = module._dac_video(handle),
    n = module._dac_width(handle) * module._dac_height(handle) * 4;
  const bytes = [module.HEAPU8.slice(pixels, pixels + n)];
  for (let u = 0; u < 2; u++) {
    const p = module._dac_disk_data_unit(handle, u),
      size = module._dac_disk_size_unit(handle, u);
    bytes.push(module.HEAPU8.slice(p, p + size));
  }
  const p = module._dac_printer_data(handle),
    size = module._dac_printer_size(handle);
  bytes.push(module.HEAPU8.slice(p, p + size));
  return Promise.all(bytes.map(digest));
}

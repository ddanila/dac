// Static imports pin expected identities in the application build as well as
// documenting them beside the downloadable media.
import manifest from "./robotron-media.json";
export async function loadHistoricalRobotron(base) {
  const bytes = await Promise.all(manifest.files.map(async (entry) => {
    const url = new URL(`media/robotron/${entry.file}`, base);
    url.searchParams.set("v", entry.sha256);
    const response = await fetch(url);
    if (!response.ok) throw Error(`Historical media could not be loaded: ${entry.file}`);
    const data = await response.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), b => b.toString(16).padStart(2, "0")).join("");
    if (data.byteLength !== entry.size || digest !== entry.sha256)
      throw Error(`Historical media integrity check failed: ${entry.file}`);
    return data;
  }));
  return { firmware: [[0, bytes[0]], [1, bytes[1]]], disk: bytes[2] };
}

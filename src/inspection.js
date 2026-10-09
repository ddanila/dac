export const inspections = {
  overview: {
    title: "Danila’s Robotron",
    text: "The overall dimensions come from the original manual. Photographs supply the visible details; small dimensions and curves are estimated.",
    photo: "133017092",
  },
  front: {
    title: "The working front panel",
    text: "Power and reset operate the emulator. The switch shapes and vent pattern follow Danila’s photographs; their exact dimensions are estimated.",
    photo: "133019620",
  },
  keyboard: {
    title: "A keyboard you can use",
    text: "Click the modeled keys, or focus the exhibit and type. Shift and Ctrl latch for one character; Caps Lock stays on. Its lamp shows the on-screen Caps Lock state. Some specimen-specific keys remain unmapped.",
    photo: "132919894",
  },
  drives: {
    title: "Two drives, one mounted disk",
    text: "The front faces are photographed; the second reuses the first drive’s crop. The first red lamp follows actual emulator transfers, not motor or drive-select timing.",
    photo: "133022597",
  },
  monitor: {
    title: "The monitor",
    text: "The rounded bezel, shell joint and blue tape follow the photo. The curved glass is an estimate; the picture on it is live emulator output.",
    photo: "133017092",
  },
  back: {
    title: "Rear details are still unknown",
    text: "No photograph of this specimen’s rear panel is available yet. Connector placement and labels are intentionally absent; this view shows only the approximate exterior envelope.",
  },
  under: {
    title: "Under the keyboard",
    text: "The bottom plate, wear and cable come from the owner’s photos. Feet and screw positions are approximate. The system-unit underside is still unverified.",
    photo: "133005363",
  },
  assembly: {
    title: "Separate the exterior parts",
    text: "The lid, fascia, monitor and keyboard deck can be inspected separately. Empty areas mean the electronics have not been modeled; this is not a reconstruction of the interior.",
  },
};
export function showInspection(name) {
  const entry = inspections[name] || inspections.overview;
  document.getElementById("inspection-title").textContent = entry.title;
  document.getElementById("inspection-text").textContent = entry.text;
  const reference = document.getElementById("reference-photo");
  reference.hidden = !entry.photo;
  if (entry.photo)
    reference.href = new URL(
      `models/robotron-1715m/photos/PXL_20261009_${entry.photo}.jpg`,
      new URL(import.meta.env.BASE_URL, location.origin),
    ).href;
}

export const inspections = {
  overview: {
    title: "Danila’s Robotron",
    text: "The overall dimensions come from the original manual. Shapes and colors follow the owner’s photographs. Painted metal, plastic and rubber use consistent materials; small dimensions and curves are estimated.",
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
  connector: {
    title: "The keyboard connector",
    text: "The tapered housing, paired release levers, three slotted screws and separate contact insert follow Danila’s new close-ups. The opposite side has hexagonal nuts. Its size and resting cable route are estimated; the contact face is hidden while plugged in.",
    photo: "20261010_090425989",
  },
  drives: {
    title: "Two drives, one mounted disk",
    text: "The recessed faces, insertion slots, latches and red lenses are modeled from the photographs. The first red lamp follows actual emulator transfers, not motor or drive-select timing.",
    photo: "133022597",
  },
  monitor: {
    title: "The monitor",
    text: "The rounded bezel, shell joint and blue tape follow the photo. The curved glass is an estimate; the picture on it is live emulator output.",
    photo: "20250516_141624490",
  },
  back: {
    title: "Rear details are still unknown",
    text: "No photograph of this specimen’s rear panel is available yet. Connector placement and labels are intentionally absent; this view shows only the approximate exterior envelope.",
  },
  under: {
    title: "Under the keyboard",
    text: "The separate bottom plate, four rubber feet with metal inserts, fasteners and cable grommet are modeled from the photos. A single lead connects the keyboard to the case; its resting route and small dimensions are estimated. The system-unit underside is still unverified.",
    photo: "133005363",
  },
  inside: {
    title: "Inside the system unit",
    text: "The cover and monitor move up and back together. Choose Drives for a close view of the mechanisms, or lift the drives to see below them. Two TEAC FD-55FV reference drives include frames, spindle clamps, head carriages, motors and boards. The mounting bracket, power supply shield, fan, photographic logic boards and cable runs follow another PC 1715. Exact drive suffix, board version and wiring remain unverified for this 1715M/W.",
  },
  "monitor-inside": {
    title: "Inside the monitor",
    text: "The upper shell lifts above the CRT funnel and neck, deflection yoke and windings, metal chassis, vertical circuit board, neck board, shielding and wiring. These shapes follow Robotrontechnik’s K7222.25 reference photos; tube dimensions and the exact electronics in Danila’s monitor remain unverified. The live display stays on the front of the tube.",
  },
  assembly: {
    title: "Open the case and keyboard",
    text: "The lid and monitor move up and back together; the drive assembly moves forward and up, and the fascia and keyboard deck lift away. Cable runs are hidden while parts are separated. Drive mechanisms, logic boards, the power supply shield, fan and wiring are modeled from references. Keyboard switches and its board are approximate; the contents of the PSU shield remain unmodeled. Open the monitor separately to inspect its reference CRT and electronics.",
  },
};
export function showInspection(name) {
  const entry = inspections[name] || inspections.overview;
  document.getElementById("inspection-title").textContent = entry.title;
  document.getElementById("inspection-text").textContent = entry.text;
  document.getElementById("interior-credit").hidden = !(
    document.getElementById("open-case").checked ||
    document.getElementById("open-monitor").checked
  );
  const reference = document.getElementById("reference-photo");
  reference.hidden = !entry.photo;
  if (entry.photo)
    reference.href = new URL(
      `models/robotron-1715m/photos/PXL_${entry.photo.includes("_") ? entry.photo : "20261009_" + entry.photo}.jpg`,
      new URL(import.meta.env.BASE_URL, location.origin),
    ).href;
}

const interiorReferences = document.getElementById("interior-references");
interiorReferences.addEventListener("toggle", () => {
  if (!interiorReferences.open) return;
  for (const image of interiorReferences.querySelectorAll("img[data-src]")) {
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
});

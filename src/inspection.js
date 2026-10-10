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
    text: "Press the modeled keys, or focus the exhibit and type. Physical keys stay visibly depressed until released; completed 3D clicks send input to the running OS. Shift and Ctrl latch for one character; Caps Lock stays on. Its lamp shows the on-screen Caps Lock state. Some specimen-specific keys remain unmapped.",
    photo: "132919894",
  },
  typing: {
    title: "Type on the Robotron",
    text: "Power on and wait for A>. Click the 3D keys below the live display, or focus either view and use your keyboard. Try DIR followed by ET. Shift and Ctrl latch for one character; Caps Lock stays on. Escape releases keyboard focus.",
    photo: "132919894",
  },
  "plate-robotron": {
    title: "Robotron K 5601 · serial 044713",
    text: "The owner’s plate reads K 5601, FABR.-NR. 044713, HERGESTELLT IN DER DDR, and VEB ROBOTRON – BUCHUNGSMASCHINENWERK KARL-MARX-STADT. The model preserves the photographed serial and maker text; the cable-obscured country line is typeset. This plate identifies this drive, not both drives.",
    photo: "20250212_094057627",
  },
  "plate-ratan": {
    title: "Ratan assembly label",
    text: "Assembled in India by RATAN EXPORTS & INDUSTRIES LTD. The model field is not legibly filled in. The photographed paper, print and wear are retained; no model number has been invented.",
    photo: "20250212_094043026",
  },
  "board-2064": {
    title: "TEAC 15532064-00A",
    text: "This is the shorter sensor board in the drive bearing the Robotron K 5601 plate. The marking is a board part number; it does not establish an FD-55 drive suffix.",
    photo: "20250212_094109733",
  },
  "board-2092": {
    title: "TEAC 15532092-00A",
    text: "This is the longer sensor board in the drive bearing the Ratan assembly sticker. Its outline differs from the other drive. The board number is visible in Danila’s photograph.",
    photo: "20250212_094103763",
  },
  connector: {
    title: "The keyboard connector",
    text: "The tapered housing, paired release levers, three slotted screws and separate contact insert follow Danila’s new close-ups. The opposite side has hexagonal nuts. Its size and resting cable route are estimated; the contact face is hidden while plugged in.",
    photo: "20261010_090425989",
  },
  drives: {
    title: "Two drives, one mounted disk",
    text: "The two mechanisms now follow Danila’s own photos, including their different sensor-board shapes, clamp bridges, head carriages and rear plates. Choose Drive labels to inspect the manufacturer markings. The first red lamp follows actual emulator transfers, not motor or drive-select timing.",
    photo: "20250212_094033966",
  },
  "drive-labels": {
    title: "Two drives with their own histories",
    text: "Danila’s rear plates identify a Robotron K 5601, serial 044713, from VEB Robotron Buchungsmaschinenwerk Karl-Marx-Stadt, and an assembly by Ratan Exports & Industries Ltd. in India. The TEAC board labels read 15532064-00A and 15532092-00A. These small photo labels retain the original print and wear. The cable-obscured country line is typeset. Drive sizes and hidden details remain estimates.",
    photo: "20250212_094038758",
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
    text: "The cover and monitor move up and back together. The fan spins while powered on (illustrative speed; reduced-motion settings pause it). Choose Drives for a close view of the mechanisms, or lift the drives to see below them. The two drives follow owner photographs and include their distinct boards and manufacturer plates, frames, spindle clamps, head carriages and motors. The mounting bracket, power supply shield, fan, photographic logic boards and cable runs follow another PC 1715. Exact drive suffix, board version and wiring remain unverified for this 1715M/W.",
  },
  "monitor-inside": {
    title: "Inside the monitor",
    text: "The upper shell lifts above the CRT funnel and neck, deflection yoke and windings, metal chassis, vertical circuit board, neck board, shielding and wiring. These shapes follow Robotrontechnik’s K7222.25 reference photos; tube dimensions and the exact electronics in Danila’s monitor remain unverified. The live display stays on the front of the tube.",
  },
  assembly: {
    title: "Open the case and keyboard",
    text: "The lid and monitor move up and back together; the drive assembly moves forward and up, and the fascia and keyboard deck lift away. Cable runs are hidden while parts are separated. Drive mechanisms and rear plates follow owner photographs; logic boards, the power supply shield, fan and wiring still use comparative references. Keyboard switches and its board are approximate; the contents of the PSU shield remain unmodeled. Open the monitor separately to inspect its reference CRT and electronics.",
  },
};
let currentInspection = "overview";
function photoUrl(photo) {
  return new URL(`models/robotron-1715m/photos/PXL_${photo.includes("_") ? photo : "20261009_" + photo}.jpg`, new URL(import.meta.env.BASE_URL, location.origin)).href;
}
export function showSpecimenDetail(name = currentInspection) {
  const entry = inspections[name];
  if (!entry?.photo) return;
  document.getElementById("detail-title").textContent = entry.title;
  document.getElementById("detail-description").textContent = entry.text;
  const photo = document.getElementById("detail-photo");
  photo.src = photoUrl(entry.photo);
  photo.alt = `Danila’s photograph: ${entry.title}`;
  document.getElementById("detail-original").href = photo.src;
  document.getElementById("specimen-detail").showModal();
}
document.getElementById("reference-details").onclick = () => showSpecimenDetail();
document.getElementById("detail-close").onclick = () => document.getElementById("specimen-detail").close();
export function showInspection(name) {
  currentInspection = name;
  const entry = inspections[name] || inspections.overview;
  document.getElementById("inspection-title").textContent = entry.title;
  document.getElementById("inspection-text").textContent = entry.text;
  document.getElementById("interior-credit").hidden = !(
    document.getElementById("open-case").checked ||
    document.getElementById("open-monitor").checked
  );
  const reference = document.getElementById("reference-photo");
  reference.hidden = !entry.photo;
  document.getElementById("reference-details").hidden = !entry.photo;
  if (entry.photo) reference.href = photoUrl(entry.photo);
}

const interiorReferences = document.getElementById("interior-references");
interiorReferences.addEventListener("toggle", () => {
  if (!interiorReferences.open) return;
  for (const image of interiorReferences.querySelectorAll("img[data-src]")) {
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
});

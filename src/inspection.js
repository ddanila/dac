import { createKeyViewer } from "./key-viewer.js";
import { createDisketteViewer } from "./diskette-viewer.js";
let disketteViewer, detailGeneration=0;
export const inspections = {
  "key-mechanism": {
    title:"One key, from cap to contact",
    text:"Isolate and press a complete spring-return key. The rubber pad meets two separated PCB electrodes. This is a mechanical demonstration; the keyboard controller and OS are unchanged. The dimensions of the spring are owner measurements; installed compression, travel and contact pattern remain estimates.",
    photo:"20261012_185834871",
    views:[["Loose key parts","20261012_185834871"],["Switch base","20261012_185855185"],["Keyboard PCB","20261012_123907435"]],
  },
  diskette: {
    title: "Danila’s diskette and storage sleeve",
    text: "This is the diskette used with the museum machine. The handwritten label belongs to this specimen; the emulated disk contents are selected separately. The white sleeve is the one Danila uses, not original packaging. Rotate and flip the CAD model, or slide the disk into its sleeve. The sleeve uses clean paper geometry; its printed instructions remain available in the reference photos below. Disk 1/2 labels beside removed session disks identify their contents and stay with them when moved; they are museum labels, not markings on the physical specimen. Drag a removed disk into either open, empty drive, or use the Insert/Move buttons. Remove a disk to cover or uncover its write-protect notch; the modeled sticker and emulator share the same protection state.",
    photo: "20261013_113451775",
    views: [["Diskette · label", "20261013_113451775"], ["Diskette · reverse", "20261013_113457457"], ["Sleeve · plain", "20261013_113428737"], ["Sleeve · instructions", "20261013_113436448"]],
  },
  overview: {
    title: "Danila’s Robotron",
    text: "The overall dimensions come from the original manual. Shapes and colors follow the owner’s photographs. Painted metal, plastic and rubber use consistent materials; small dimensions and curves are estimated.",
    photo: "133017092",
  },
  front: {
    title: "The working front panel",
    text: "Power and reset operate the emulator. The reset pad is grey and recessed almost flush with the lower front panel, as in Danila’s close-up; it is distinct from the protruding power rocker. Local dimensions and the vent pattern remain photo estimates.",
    photo: "20261012_124827690",
  },
  keyboard: {
    title: "A keyboard you can use",
    text: "Black keys have a square flange and rounded raised body; the clear function keys have silver inserts and black legends. Press the modeled keys, or focus the exhibit and type. With S600 loaded, the keyboard’s own Z80 scans switches and sends serial input to the OS; its firmware drives Caps and SI/SO state. Clicked Shift/Ctrl latch for one character. Physical keys remain held until release. S600 is a reference layout: some printed legends differ. Without a keyboard ROM, the character adapter retains unverified mappings.",
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
    title: "Two independently usable drives",
    text: "The two mechanisms now follow Danila’s own photos, including their different sensor-board shapes, clamp bridges, head carriages and rear plates. Choose Drive labels to inspect the manufacturer markings. Each drive has independent media and write protection. Lamps, spindle rotation and head travel follow emulator activity; head travel uses the nominal 96-tpi TEAC specification. Current emulation supplies spindle phase, startup/coast speed and fractional head position. READY, head loading and settling use a documented reference profile; exact specimen dynamics remain unmeasured. Older preserved cores retain their earlier behavior.",
    photo: "20250212_094033966",
  },
  "drive-labels": {
    title: "Two drives with their own histories",
    text: "Danila’s rear plates identify a Robotron K 5601, serial 044713, from VEB Robotron Buchungsmaschinenwerk Karl-Marx-Stadt, and an assembly by Ratan Exports & Industries Ltd. in India. The TEAC board labels read 15532064-00A and 15532092-00A. These small photo labels retain the original print and wear. The cable-obscured country line is typeset. Drive sizes and hidden details remain estimates.",
    photo: "20250212_094038758",
  },
  monitor: {
    title: "The monitor",
    text: "The curved glass carries live emulator output. Owner underside photos now establish the hollow annular stand, folded metal brackets, two ribbed adjustment knobs, vent banks and cable outlet. Local dimensions and the screen curvature remain estimates.",
    photo: "20261012_125132359.MP",
  },
  back: {
    title: "Rear connections",
    photo: "20261012_125413618",
    text: "Danila’s October 12 close-ups guide the recessed socket openings, pale keyed inserts, retaining blocks, three-contact monitor outlet, vertical mains inlet and cross-slotted fuse caps. The clean nameplate preserves Typ W 1715/330 and Masch.-Nr. 67581. V24’s alternating populated positions follow the close-up; hidden contact details and local dimensions remain estimates. The sockets are shown unplugged for inspection.",
  },
  under: {
    title: "Under the keyboard",
    text: "The separate bottom plate, four rubber feet with metal inserts, fasteners and cable grommet are modeled from the photos. A single lead connects the keyboard to the case; its resting route and small dimensions are estimated. The new system-unit underside photos also establish rectangular rubber frames with metal inserts.",
    photo: "20261012_131106217",
  },
  inside: {
    title: "Inside this museum machine",
    photo: "20261013_150242933",
    text: "The cover and monitor move up and back together. The fan spins while powered on (illustrative speed; reduced-motion settings pause it). Choose Drives for a close view of the mechanisms, or lift the drives to see below them. The two drives follow owner photographs and include their distinct boards and manufacturer plates, frames, spindle clamps, head carriages and motors. Danila’s October 13 photos now guide the cover stiffeners, crossed fan retainers and cushioning, PSU access grommets, and brown 05-330-0024 drive adapters. These are this museum machine’s details, with estimated dimensions. The visible rear board is solder-side up and is likely the W/M display controller: the original W manual places the U8272 floppy controller on the main board. Its marking differs from the available CRT drawing, so its exact revision remains unconfirmed. The current comparative logic-board geometry still awaits replacement. Hidden PSU electronics, exact drive suffix and wiring remain unverified.",
  },
  "monitor-inside": {
    title: "Inside the monitor",
    text: "The upper shell lifts above the CRT funnel and neck, deflection yoke and windings, metal chassis, vertical circuit board, neck board, shielding and wiring. These shapes follow Robotrontechnik’s K7222.25 reference photos; tube dimensions and the exact electronics in Danila’s monitor remain unverified. The live display stays on the front of the tube.",
  },
  assembly: {
    title: "Open the case and keyboard",
    text: "The lid and monitor move up and back together; the drive assembly moves forward and up, and the fascia and keyboard deck lift away. Cable runs are hidden while parts are separated. Drive mechanisms and rear plates follow owner photographs; logic-board geometry and hidden wiring still use comparative references. Owner photos now establish the fan retainers, PSU-cover grommets and drive adapters. The separate keyboard controller now follows owner photos; switch construction and local dimensions remain approximate; the contents of the PSU shield remain unmodeled. Open the monitor separately to inspect its reference CRT and electronics.",
  },
};
Object.assign(inspections, {
  "keyboard-inside": {
    title: "Inside the keyboard",
    evidence: "Owner board and loose-key photographs · local dimensions estimated",
    text: "The keycaps and deck move back and up; the mounting plate, switches and springs move forward so the broad switch PCB stays visible from above, with the paired contact pads facing upward. Orbit below the board to see the photo-referenced buses and solder details. Six hole-aligned insulating supports and washers retain the switch PCB; short contact fan-outs and the controller entry bundle are modeled as estimated routes, not an electrical netlist. The pale slotted guides, circular cap cups and dark rubber contact pads follow the loose-key photos and owner confirmation. The narrow controller lifts out separately, showing its socketed processor, replacement EPROM and metallic trace detail. Visible routing is approximate, not an electrical netlist. The springs use the owner’s 13 mm outer diameter, 23 mm free length and 0.4 mm wire. Turn count follows the spring photo; travel, installed compression and hidden contact details remain estimates.",
    photo: "20261012_123907435",
  },
  "component-logic": {
    title: "System logic boards",
    evidence: "Comparative reference · another PC 1715",
    text: "These photographic boards come from Old Crap Vintage Computing’s PC 1715. They show the arrangement of logic, memory and connectors; the PCB revision and component identities in Danila’s 1715M have not been verified. Reusable KiCad DIP packages now provide shaped bodies, pin-one notches and bent metal leads. Resistors, ceramic capacitors, electrolytics and metal-can components follow visible photo locations. Package matches, orientation and hidden details remain provisional; this is not an electrical reconstruction. KiCad model credits and file-specific licences are preserved with the exhibit.",
    reference: "https://oldcrap.org/2017/12/26/robotron-1715/",
  },
  "component-psu": {
    title: "Power supply and fan",
    evidence: "Comparative reference · dimensions estimated",
    text: "The shield and fan placement follow another PC 1715. The inside of the shield is not modeled. Fan motion indicates museum power state; its speed is illustrative.",
    reference: "https://oldcrap.org/2017/12/26/robotron-1715/",
  },
  "component-keyboard": {
    title: "Keyboard electronics",
    evidence: "Owner electronics photos · local dimensions estimated",
    text: "Danila’s October 12 photos show the broad switch PCB and a separate narrow controller with a socketed UB880D, small DIP logic, discrete components, connector and shield clamp. The model reconstructs clean parts with nominal 2.54 mm IC lead pitch; board dimensions, placement and hidden routing remain estimates. Open the keyboard to separate the controller for inspection. Danila confirms that the installed EPROM came from another board. Its blue window cover is modeled, but the photos do not identify its binary contents. The emulator still uses the documented S600 reference ROM; it is not claimed to be a dump of this chip.",
    photo: "20261012_123622947",
  },
  "component-crt": {
    title: "CRT, yoke and monitor electronics",
    evidence: "Comparative K7222.25 reference · dimensions estimated",
    text: "The shaped tube funnel and neck, deflection yoke windings, neck socket, board components and mounting hardware follow K7222.25 reference photographs. Their exact dimensions and part numbers remain unverified for this monitor. The curved screen displays live emulator output.",
    reference:
      "https://www.robotrontechnik.de/html/zubehoer/bildschirme.htm#k7222-25",
  },
  "component-drives": {
    ...inspections["drive-labels"],
    evidence: "Owner photographs · hidden dimensions estimated",
  },
});
inspections["rear-panel"] = { ...inspections.back, title: "Rear sockets and markings" };
inspections.logic = inspections["component-logic"];
inspections.motherboard = {
  ...inspections["component-logic"],
  title: "Motherboard",
  text: "The controller and chassis are hidden so the lower board can be inspected from either side. KiCad packages, drilled holes, metal pads and solder fillets share the same lead positions. Pale traces and markings are extracted from the comparative photograph; hidden routing and electrical connectivity are not reconstructed. Connector dimensions, passive sizes and package assignments remain estimates until Danila’s board is photographed.",
};
inspections["floppy-controller"] = {
  ...inspections["component-logic"],
  title: "Original 1715 FDC — comparative model",
  text: "This is the original 64 KB 1715’s separate floppy controller, retained as a comparative model; it is not confirmed hardware from this W/M specimen. The W/M manual places the U8272 FDC on the main board and display control on a separate card. The reference card is shown independently, including photo-estimated yellow film capacitors, different electrolytic sizes, a divided two-row connector and individual contacts. Orbit below it to see lead-aligned solder fillets. The board artwork comes from another PC 1715; pin count, connector keying, component values and the underside routing remain unverified for this specimen.",
};
for (const board of ["motherboard", "floppy-controller"])
  inspections[board + "-under"] = {
    ...inspections[board],
    title: inspections[board].title + " underside",
    text: "Mounting screws, washers and hex standoffs share the board’s clearance-hole positions. Component leads have metal pads and solder fillets. Underside tracks and exact mounting dimensions are not verified for Danila’s specimen and are not reconstructed. Orbit or zoom to inspect; the reference-photo toggle returns to the component side.",
  };
Object.assign(inspections, {
  "focus-head": {
    title: "Head carriage",
    text: "The highlighted carriage and shield follow Danila’s drive photographs. Their rail bores now clear the fixed guide rods at all 80 modeled track positions. Travel uses the TEAC reference specification: 96 tracks per inch, or 20.90 mm over 79 steps. The exact specimen suffix and carriage origin remain unverified.",
    photo: "20250212_094033966",
  },
  "focus-spindle": {
    title: "Spindle and retaining ring",
    text: "The highlighted hub follows the owner’s overview photo. Shape and speed are estimates. Normal operation follows emulator motor activity; the separate mechanical demo is visual only.",
    photo: "20250212_094033966",
  },
  "focus-clamp": {
    title: "Clamp and latch",
    text: "The lever turns a separate journal-supported shaft and eccentric cam. The slotted follower lifts the clamp and a release rail above the upper head. Normal operation follows each drive door; the inspection demo remains visual only. Hidden linkage dimensions, cam profile and exact head-lift kinematics are estimates from the owner photos, not measured mechanics.",
    photo: "20250212_094038758",
  },
  "drive-top": { ...inspections.drives, title: "Drive mechanisms from above" },
  "drive-rear": {
    ...inspections["drive-labels"],
    title: "Drive connectors and rear plates",
  },
  "drive-demo": {
    title: "Mechanical motion demo · visual only",
    text: "A slow 12-second cycle illustrates head travel, spindle rotation and latch/clamp movement. It sends no commands to the emulator. Use Manual position with reduced motion, or switch the demo off to restore live drive activity. Linkage timing and geometry remain illustrative.",
    photo: "20250212_094033966",
  },
});
let currentInspection = "overview";
function photoUrl(photo) {
  return new URL(
    `models/robotron-1715m/photos/PXL_${photo.includes("_") ? photo : "20261009_" + photo}.jpg`,
    new URL(import.meta.env.BASE_URL, location.origin),
  ).href;
}
export function showSpecimenDetail(name = currentInspection) {
  const entry = inspections[name];
  if (!entry) return;
  const generation=++detailGeneration;
  disketteViewer?.dispose(); disketteViewer=undefined;
  document.getElementById("diskette-viewer")?.remove();
  document.getElementById("diskette-tools")?.remove();
  document.getElementById("detail-title").textContent = entry.title;
  document.getElementById("detail-description").textContent =
    (entry.evidence ? entry.evidence + ". " : "") + entry.text;
  const photo = document.getElementById("detail-photo");
  photo.hidden = !entry.photo;
  if (entry.photo) photo.src = photoUrl(entry.photo);
  photo.alt = `Danila’s photograph: ${entry.title}`;
  const link = document.getElementById("detail-original");
  link.hidden = !(entry.photo || entry.reference);
  link.href = entry.photo ? photo.src : entry.reference || "#";
  link.textContent = entry.photo
    ? "View owner’s original photograph ↗"
    : "View credited reference ↗";
  let choices = document.getElementById("detail-views");
  if (!choices) { choices = document.createElement("div"); choices.id = "detail-views"; choices.className = "secondary-controls"; photo.before(choices); }
  choices.replaceChildren();
  for (const [label, source] of entry.views || []) {
    const button = document.createElement("button"); button.textContent = label;
    button.setAttribute("aria-pressed", String(source === entry.photo));
    button.onclick = () => {
      photo.src = photoUrl(source); photo.alt = `Danila’s photograph: ${label}`; link.href = photo.src;
      for (const b of choices.children) b.setAttribute("aria-pressed", String(b === button));
    };
    choices.append(button);
  }
  document.getElementById("specimen-detail").showModal();
  if(name==="diskette" || name==="key-mechanism") {
    const host=document.createElement("div");host.id="diskette-viewer";host.setAttribute("aria-label",name==="diskette"?"Rotate the 3D diskette and sleeve":"Inspect a complete key mechanism");
    const tools=document.createElement("div");tools.id="diskette-tools"; choices.before(host,tools);
    Promise.resolve(name==="diskette"?createDisketteViewer(host,tools):createKeyViewer(host,tools)).then(viewer=>{if(generation!==detailGeneration)viewer.dispose();else disketteViewer=viewer;});
  }
}
document.getElementById("reference-details").onclick = () =>
  showSpecimenDetail();
document.getElementById("detail-close").onclick = () =>
  document.getElementById("specimen-detail").close();
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

for (const button of document.querySelectorAll("[data-component]"))
  button.onclick = () => showSpecimenDetail(button.dataset.component);

document.getElementById("specimen-detail").addEventListener("close",()=>{detailGeneration++;disketteViewer?.dispose();disketteViewer=undefined;});

export function showAnnotation(annotation){
  const id="annotation-"+annotation.id;
  inspections[id]={title:annotation.title,text:annotation.dimensions,evidence:annotation.evidence,photo:annotation.photo,reference:annotation.source};
  showSpecimenDetail(id);
}

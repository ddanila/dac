import {circuits} from './robotron-circuits.js';
import { createChipViewer } from "./chip-viewer.js";
import { createKeyViewer } from "./key-viewer.js";
import { createDisketteViewer } from "./diskette-viewer.js";
let disketteViewer, chipViewer, detailGeneration=0;
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
    text: "The separate bottom plate, four rubber feet with metal inserts, fasteners, two cable-opening rubber strips and a round cable bush in a folded short-edge support are modeled from the photos. A single lead connects the keyboard to the case; its resting route and small dimensions are estimated. The new system-unit underside photos also establish rectangular rubber frames with metal inserts.",
    photo: "20261012_131106217",
  },
  inside: {
    title: "Inside this museum machine",
    photo: "20261013_150242933",
    text: "The cover and monitor move up and back together. The fan spins while powered on (illustrative speed; reduced-motion settings pause it). Choose Drives for a close view of the mechanisms, or lift the drives to see below them. The two drives follow owner photographs and include their distinct boards and manufacturer plates, frames, spindle clamps, head carriages and motors. Danila’s October 13 photos now guide the cover stiffeners, crossed fan retainers and cushioning, PSU access grommets, and brown 05-330-0024 drive adapters. These are this museum machine’s details, with estimated dimensions. The W/M main board now follows its placement drawing, including U8272 at A44. The separate display board is solder-side up as photographed, with components underneath. The exact photographed display-board revision remains unconfirmed. Hidden PSU electronics, exact drive suffix and wiring remain unverified.",
  },
  "monitor-inside": {
    title: "Inside the monitor",
    text: "The upper shell lifts above the CRT funnel and neck, deflection yoke and windings, metal chassis, vertical circuit board, neck board, shielding and wiring. These shapes follow Robotrontechnik’s K7222.25 reference photos; tube dimensions and the exact electronics in Danila’s monitor remain unverified. The live display stays on the front of the tube.",
  },
  assembly: {
    title: "Open the case and keyboard",
    text: "The lid and monitor move up and back together; the drive assembly moves forward and up, and the keyboard deck lifts away. Cable endpoints remain attached while parts are separated; intermediate extension is illustrative. Drive mechanisms and rear plates follow owner photographs; the mainboard follows the W drawing and the display-board population follows the new owner component-side photos, while unseen wiring remains estimated. Owner photos now establish the fan retainers, PSU-cover grommets and drive adapters. The separate keyboard controller now follows owner photos; switch construction and local dimensions remain approximate; the contents of the PSU shield remain unmodeled. Open the monitor separately to inspect its reference CRT and electronics.",
  },
};
Object.assign(inspections, {
  "keyboard-inside": {
    title: "Inside the keyboard",
    evidence: "Owner board and loose-key photographs · local dimensions estimated",
    text: "The keycaps and deck move back and up; the mounting plate, switches and springs move forward so the broad switch PCB stays visible from above, with the paired contact pads facing upward. Orbit below the board to see the photo-referenced buses, solder details and pale socket on the stepped PCB tongue. The socket follows the owner close-up; its docking with the detached controller remains unverified. Six hole-aligned insulating supports and washers retain the switch PCB; short contact fan-outs and the controller entry bundle are modeled as estimated routes, not an electrical netlist. The pale slotted guides, circular cap cups and dark rubber contact pads follow the loose-key photos and owner confirmation. The narrow controller lifts out separately, showing its socketed processor, replacement EPROM, grey resistors with blue end bands and metallic trace detail. Visible routing is approximate, not an electrical netlist. The springs use the owner’s 13 mm outer diameter, 23 mm free length and 0.4 mm wire. Turn count follows the spring photo; travel, installed compression and hidden contact details remain estimates.",
    photo: "20261012_123907435",
  },
  "component-logic": {
    title: "System logic boards",
    evidence: "Documented W/M design with owner display-board reference",
    text: "The W/M motherboard integrates the U8272 floppy controller, CPU and 256 KB RAM. The separate display controller is installed solder-side up, as photographed in this specimen. Mainboard placement follows the W drawings; display footprints follow the owner photo. The October 14 photos now show both component faces. Display population follows this specimen; motherboard placement and unmeasured dimensions remain provisional. KiCad package credits and licences are retained.",
    reference: "https://xepb.org/robotron/docs/1715w.zip",
  },
  "component-psu": {
    title: "Power supply and fan",
    evidence: "Your specimen · dimensions estimated",
    text: "The cover, grommets, fan straps and cushions follow Danila’s photographs. The unseen power-supply electronics are not reconstructed. Fan motion indicates museum power state; its speed is illustrative.",
    photo: "20261013_150303351",
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
    views:[["Carrier underside","20261014_073718163"],["Drive rear board","20261014_073642069"],["Rear plate","20261014_073636885"]],
  },
});
inspections["rear-panel"] = { ...inspections.back, title: "Rear sockets and markings" };
inspections.logic = inspections["component-logic"];
inspections.motherboard = {
  ...inspections["component-logic"], title:"W/M motherboard",
  evidence:"Your specimen + documented W/M design · placement and dimensions estimated",
  photo:"20261014_072654600",
  views:[["Motherboard components","20261014_072654600"],["Processor area","20261014_073200542"],["Rear connectors","20261014_073219091"]],
  text:"Owner photos now guide the positions of the two CTCs and 32 RAM packages (M4164B-12 in your photo; U2164 in the drawing). The UA880 CPU, UA858 DMA, UA8560 SIO and U8272 floppy controller at A44 follow the documented W design. The W drawing supplies component references; photo-registered components share two calibrated photo planes based on six nominal DIP packages. Visible mounting holes and screws are distinguished from obscured estimated mounts. Unregistered parts and the board envelope remain estimates. The controller belongs on this main board. KiCad package geometry supplies nominal bodies and leads; local dimensions and complete placement remain unverified. Click an individual chip to inspect its role, owner photo and original drawing. This is a clean drawing-based reconstruction, not a traced electrical netlist.",
  reference:"https://xepb.org/robotron/docs/1715w.zip"
};
inspections["display-controller"] = {
  title:"W/M display controller", evidence:"Your specimen + documented W/M design · exact revision unconfirmed",
  photo:"20261014_072935298",
  views:[["Component side","20261014_072935298"],["Board marking","20261014_072941759"],["Wound component","20261014_072944002"],["Installed solder side","20261013_150312308"]],
  text:"The board is mounted solder-side up. Its component side now follows Danila’s October 14 photo: 39 visible IC packages, three UL6516D memories, Siemens SAB8275P, upright red capacitors and the wound component. Clean geometry and legible package labels replace inferred hidden population; small dimensions, pin-one orientation and copper routing remain provisional. The visible 1.93.310402.1 B 2 marking does not prove equivalence to the available 310412 drawing. Source-photo mode remains optional evidence."

};
inspections["fan-detail"]={title:"Fan mounting",evidence:"Your specimen · local dimensions estimated",photo:"20261013_150303351",text:"Crossed metal retaining strips, corner screws and pale cushioning follow this machine. The rotor spins when powered; speed remains illustrative."};
inspections["adapter-detail"]={title:"Drive ribbon adapters",evidence:"Your specimen + documented interface · local dimensions estimated",photo:"20261013_150516969",text:"The brown 05-330-0024 boards carry a black drive-edge socket and a taller pale ribbon connector with its retaining latch. Individual 34-way drive and 26-way ribbon contacts replace the previous blocks. Clean routing follows visible staggered bends without claiming a verified electrical pinout. Ribbon routes terminate on the W/M main board; hidden slack remains estimated."};
inspections["case-cover"]={title:"Inside the case cover",evidence:"Your specimen · local dimensions estimated",photo:"20261013_150009163",text:"Two hat-section stiffeners span the width. Separate black vent inserts, their screws, folded return lips and slotted fixing strips follow the removed cover photographs. The fascia remains attached when the cover lifts. All three enclosures use owner-confirmed 1 mm bent painted sheet, with hollow returns rather than thick solid fronts. Wear and corrosion are not reproduced."};
for (const board of ["motherboard", "display-controller"])
  inspections[board + "-under"] = {
    ...inspections[board],
    title: inspections[board].title + " underside",
    text: board === "display-controller" ? "This lower face now follows the owner’s component-side photo, including 39 IC packages, upright red capacitors and the wound component. The upper face is the solder side. Small dimensions and untraced routing remain provisional." : "Mounting holes, metal pads and solder fillets follow the drawing-based package placement. Unseen underside routing is not invented.",
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
  let entry = typeof name === "object" ? name : inspections[name];
  const circuit = entry?.component?.board === "motherboard" && circuits.find(c=>c.ref===entry.component.ref);
  if(circuit) entry={...entry,sheet:`Stromlaufplan ${circuit.sheet}.jpg`,text:`${entry.text} ${circuit.signal} Drawing: 1715W/teil_b/Stromlaufplan ${circuit.sheet}.jpg in the linked archive.`};
  if (!entry) return;
  const generation=++detailGeneration;
  disketteViewer?.dispose(); disketteViewer=undefined;
  chipViewer?.dispose();chipViewer=undefined;document.getElementById("component-comparison")?.remove();
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
  let drawing = document.getElementById("detail-drawing");
  if (!drawing) {
    drawing = document.createElement("a"); drawing.id = "detail-drawing";
    drawing.target = "_blank"; drawing.rel = "noopener noreferrer";
    drawing.style.marginLeft = "1em"; link.after(drawing);
  }
  drawing.hidden = !(entry.photo && entry.reference);
  drawing.href = entry.reference || "#";
  drawing.textContent = entry.sheet ? `Download W/M drawings · ${entry.sheet} ↗` : "Open original drawing / source ↗";
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
  if(entry.component && entry.packageModel){
    const panel=document.createElement('section');panel.id='component-comparison';
    const evidence=document.createElement('dl');evidence.id='component-confidence';
    for(const [term,value]of Object.entries(entry.confidence||{})){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;evidence.append(dt,dd);}
    const pair=document.createElement('div');pair.className='component-pair';
    const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent='Your machine · original photograph';
    const crop=document.createElement('canvas');crop.id='component-photo-crop';crop.setAttribute('role','img');crop.setAttribute('aria-label',`Owner photograph crop: ${entry.title}`);figure.append(crop,caption);
    const modelFigure=document.createElement('figure'),host=document.createElement('div'),modelCaption=document.createElement('figcaption');host.id='component-model';host.setAttribute('aria-label','Rotate the clean package model');modelCaption.textContent='Clean package model · nominal dimensions';modelFigure.append(host,modelCaption);
    pair.append(figure,modelFigure);panel.append(pair,evidence);photo.before(panel);
    if(entry.crop && entry.photo){
      photo.hidden=true;const img=new Image();img.onload=()=>{if(generation!==detailGeneration)return;const [x,y,w,h]=entry.crop;const sw=Math.min(w,1-x)*img.naturalWidth,sh=Math.min(h,1-y)*img.naturalHeight;crop.width=Math.min(1000,Math.round(sw));crop.height=Math.round(crop.width*sh/sw);crop.getContext('2d').drawImage(img,x*img.naturalWidth,y*img.naturalHeight,sw,sh,0,0,crop.width,crop.height);crop.dataset.ready='true';};img.onerror=()=>{if(generation!==detailGeneration)return;figure.hidden=true;photo.hidden=false;};img.src=photoUrl(entry.photo);
    }else{figure.hidden=true;}
    chipViewer=createChipViewer(host,entry);
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

document.getElementById("specimen-detail").addEventListener("close",()=>{detailGeneration++;disketteViewer?.dispose();disketteViewer=undefined;chipViewer?.dispose();chipViewer=undefined;});

export function showAnnotation(annotation){
  const id="annotation-"+annotation.id;
  inspections[id]={title:annotation.title,text:annotation.dimensions,evidence:annotation.evidence,photo:annotation.photo,reference:annotation.source};
  showSpecimenDetail(id);
}

window.addEventListener("dac-model-ready",event=>{
  const evidence=event.detail?.evidence;if(!evidence)return;
  let panel=document.getElementById("assembly-evidence");if(panel)return;
  panel=document.createElement("details");panel.id="assembly-evidence";
  const summary=document.createElement("summary");summary.textContent="Model evidence and physical verification";panel.append(summary);
  for(const entry of evidence.assemblies){
    const p=document.createElement("p");
    const categories=entry.classes || [];
    p.textContent=`${entry.title}: ${(Array.isArray(categories)?categories:[categories]).map(c=>evidence.categories[c]||c).join(" + ")}. ${entry.note} Physical verification: ${entry.physicalVerification}.`;
    panel.append(p);
  }
  document.getElementById("inspection-text").after(panel);
});

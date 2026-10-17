# Keyboard controller implementation record

Thirty-first implementation pass, 2026-10-17. Digital reference qualification passes,
and the museum consumes KiCad-derived DIP placement, pads, outline and artwork.
The [plan](keyboard-controller-plan.md) remains incomplete: physical routing,
discrete component identification and specimen measurements are still open.

## Current revisions

| Repository | Delivered | Revision |
| --- | --- | --- |
| `3d-models` | Reviewed 70-component schematic, nine DIP and twenty-one resistor placements, BR1, photo evidence and partial A1/reset/A4/BR1 copper; local CPU/A4 fit and withdrawn clock-route review | `a8b6694` |
| `dac-emulation` | Reviewed CAD pin, bridge tests, automatic failure waveforms and passing bus/TV80 qualification; runtime stays core 0.17.0, snapshot layout 15 | `cdda844` |
| `dac` | Compatible CAD/core pins, archived 0.16.0 snapshots, raw latch diagnostics, placement residuals, assigned-route 3D highlighting and accurate qualification status | This change |

Full-resolution owner photos establish **05-330-4102-8 1c**, correcting the former
model-derived board identifier. The kbdbabel drawing names this family but uses
RD for the output clock where Zander uses WR, and names a different ROM type.
The implemented electrical reference remains explicitly Zander's drawing. Neither
successful co-simulation nor matching board markings resolves that disagreement.

## What the thirty-first pass corrects

The CPU-side CLK assignment from the previous pass is withdrawn. Its underside
terminal at (1354, 2811) projects near top pixel (1529, 3054). The nearby observed
top terminal at (1527, 3048) appears to connect to A4:13 D6, conflicting with the
tentative A5:6 CLK origin. The five native sections are removed from copper and
museum net highlighting. Original pixels, the conflict and retired native UUIDs
remain in CAD `evidence.json:routeReviews`; no replacement D6 route or via is
asserted. The museum exposes the conflict when inspecting A5 or A4.

The local CPU/A4 geometric fit still passes its independent pad checks. That
result does not establish solder-junction attachment or through-board terminal
identity. The previous passing checks established geometry consistency, not
physical electrical continuity. Further tracing needs a sharper junction view
or continuity evidence before assigning either proposed net.

Registration validation now also bounds native endpoints to the reviewed hull
and limits inferred attachment displacement to the local tolerance. Previously
only photo points were bounded, allowing an inferred route to depart from its
photo evidence. Synthetic regression cases exercise these failures, while the
withdrawn real route is explicitly required to stay absent.

Counts return to 25 assigned sections (17 observed, 8 inferred), 37 unplaced parts,
229 airwires and one dangling A1 endpoint. The BR1/R10.3 connection, placements,
schematic connectivity and digital qualification are unchanged. All 22 export
checks, native KiCad integration, four mesh-contract checks, model/download
metadata, 19 browser tests and the build pass. The underside geometry matches
the reviewed pre-candidate BR1 baseline; its restored baseline passes all three
strict visual checks. CAD CI passes.

## What the thirtieth pass adds

**Superseded:** the CPU CLK route assignment below was withdrawn in the thirty-first
pass after a conflicting top-side observation. This section records the history.

The first data/clock milestone now includes a partial underside CLK route from
CPU A5 pin 6. Four observed sections reach a nearby round terminal; one inferred
attachment reconciles the native pad with its observed solder joint. The terminal
continuation, through-board construction and connection to BR1 remain unresolved.
No via or complete clock path is claimed.

A new local CPU/A4 projection uses four anchors spanning both packages and six
independent pad checks, including CPU pin 6. Maximum residual is 0.661 mm within
the existing 1.25 mm photo tolerance. The reviewed scope is limited to the convex
anchor hull and nominal photo-estimated PCB geometry. The separate global
underside fit still fails; the earlier A4 photo-to-photo extrapolation remains
unqualified. Export rejects stale landmark hashes, failed local checks, route
pixels outside the hull and observed geometry that differs from the projection.

The museum shows this limited local result, the CPU underside observations and
the unresolved terminal in the route evidence. Net highlighting still includes
both disconnected CLK islands; it does not imply a traced connection between them.
Totals are now 30 assigned sections (21 observed, 9 inferred), 37 unplaced parts,
229 airwires and two dangling route endpoints. Previously placed components,
previous routes and schematic connectivity are unchanged. All 22 export checks,
native KiCad integration, four mesh-contract checks, model/download metadata,
19 browser tests and the build pass. The CPU-clock underside close-up was reviewed;
only the controller trace mesh changed. The controller baseline was updated and
all three strict visual checks pass. CAD CI also passes.

## What the twenty-ninth pass fixes

Component inspection now displays the recorded underside solder-joint observations
for BR1 and R10.3 alongside their top-photo lead observations. Numbering remains
reference-derived; these annotations use original photo pixels, not projected
native pads. Their captions explicitly retain the unqualified underside alignment
and unmeasured end-to-end continuity. Components without underside observations
receive no fabricated underside overlay; BR2 remains an unnumbered candidate.

The new browser check exposed a missing asset: the controller evidence referenced
`PXL_20261012_123648677.jpg`, but general model sync did not include it because it
was absent from the model's photo-reference list. Its existing supporting-photo
link therefore could not load. Sync now includes all local controller evidence
photos, first checks the controller export, compares each evidence hash with the
photo inventory and verifies the copied bytes. The browser regression checks
that every local evidence photo is served with its pinned SHA-256.

All 18 controller browser tests and the build pass; the BR1 underside preview was
visually inspected. Geometry, native placements, routing, CAD/core revisions and
completion counts are unchanged. No 3D baseline update is required.

Further review of the top photo and oblique CPU close-up
`PXL_20261012_123729356.jpg` confirms raised, bent leads around R6.4/R6.5 and an
obscured C6/R4.3 junction. Body-end estimates alone do not resolve hole positions
or electrical terminal order. These remaining parts stay unplaced pending a
stronger pad correspondence or continuity check; this review adds no net claims.

## What the twenty-eighth pass adds

BR1 and R10.3 now use native KiCad pads observed in the top photo. A short visible
underside connection joins their original-top left terminals, supporting the
reference CLK-side assignments. BR1 pin 1 remains OSC_OUT; pin 2 is CLK on the CPU
side. R10.3 pin 1 is +5V and pin 2 is CLK. End-to-end continuity to A7 and the CPU
is unmeasured. The local bottom segment is explicitly inferred from native pad
positions; it does not qualify the global underside registration.

OpenSCAD consumes BR1's native pads for holes, lands, solder and a nominal closed
wire shape; its dimensions and bend remain estimates. R10.3 replaces its legacy
resistor body. The museum shows numbered BR1 photo observations and distinguishes
this placement from BR2's still-unnumbered location candidate. The source record
continues to describe service use as inferred, with no documented factory opening
procedure. All twelve controller mesh consumers are rebuilt together.

This brings the reconstruction to 21 native resistors and one bridge, 37 unplaced
components and 25 assigned copper sections (17 observed, 8 inferred), with 229
airwires. Previously placed components and all previous assigned routes are
unchanged. Schematic connectivity and the existing digital qualification remain
unchanged. All 21 export checks, native KiCad integration, four mesh-contract
checks, model/download metadata, 16 browser tests and the build pass. The top
close-up and underside were inspected; only the controller baseline was updated.
All three strict visual checks and CAD CI pass.

## What the twenty-seventh pass fixes

The BR1/R10.3 review exposed a geometry synchronization defect. Migrating resistors
removed legacy solder joints, but the underside generator did not add joints for
native resistor pads. The export freshness guard also omitted the separate lead,
resistor-body and resistor-band meshes, allowing stale meshes to retain a new
common source stamp. Earlier passing metadata checks did not cover this omission.

The solder generator now uses all 40 native resistor pads. All twelve affected
mesh consumers have per-mesh export receipts binding source and mesh hashes.
Partial rebuilds update only their own receipts; metadata validation rejects
stale or missing receipts and altered meshes. Four regression tests cover these
failure modes and run in CAD CI. The full affected mesh set is regenerated,
including the previously omitted lead mesh. No KiCad placements, connectivity,
routing or completion counts changed. Twenty controller export checks, four new
mesh-contract tests, model/download metadata, fifteen browser tests and the build
pass. Enlarged lead and underside views were inspected; only the controller
visual baseline was updated. All three strict visual checks and CAD CI pass.

The local underside joint pair near R10.3 and BR1 appears connected in the photo
(approximately [1558,3616] to [1559,3660] in original underside pixels). This is
useful for the next bridge-side review, but global registration remains unqualified
and neither native placement nor a bridge terminal assignment was promoted here.

## What the twenty-sixth pass adds

R6.3 and R9.9 are now natively placed beside A2.2/A4. Their upper leads share a
visible top link; +5V is their only common reference net, supporting pin 1
orientation. Lower LATCH_OE_N and IO_ACTIVE assignments remain reference-derived.
Both bodies were absent from legacy geometry. Native pads now drive their bodies,
leads, holes, lands and lower blue collars without removing a legacy estimate.

The shared copper link adds one observed section and two inferred pad attachments.
Its feed remains unresolved: this is a separate physical island on the same
reference net as the reset supply tree. Tests retain that distinction, and net
highlighting includes assigned islands without asserting a traced connection.
There are now twenty native resistors, 39 unplaced components, 24 assigned copper
sections (17 observed, 7 inferred), and 230 airwires. Earlier placements and copper
are unchanged; the original A1:1 dangling endpoint remains. Twenty export checks,
native KiCad integration, model/download metadata, fifteen browser tests and the
production build pass. The photo overlay and enlarged model region were reviewed;
only the controller visual baseline was updated. All three strict visual checks
and CAD CI pass.

## What the twenty-fifth pass adds

R11.1 and R11.2, the LED series resistors beside X1, are now natively placed.
Factory placement identifies the pair; the original top photo supplies their
lead endpoints and lower blue collar ends. The inner leads align with adjacent
X1 rows consistent with reference A5/A6, and are assigned connector-side pin 2.
Outer leads are assigned flip-flop-side pin 1. Exact connector registration and
end-to-end continuity remain unverified, so these are reference-derived mappings.

Both bodies were missing from legacy geometry. Native geometry now supplies
their bodies, leads, holes, lands and collars, with no legacy entry removed.
Eighteen resistors are native and 41 components remain unplaced. Existing
placements, copper and airwire counts are unchanged. The export test checks the
opposite lead orientations and the distinct Caps and SI/SO nets. Nineteen export
checks, native KiCad integration, model/download metadata, fifteen browser tests
and the production build pass. The photo overlay and enlarged model region were
reviewed, and only the controller visual baseline was updated. All three strict visual checks
and CAD CI pass. All three strict
visual checks and CAD CI pass.

Against the plan's exit criteria, digital qualification and synchronization remain
implemented, while PCB reconstruction, complete geometry migration and the first
physical data/clock path remain incomplete. Adding these parts does not resolve
connector pin registration, hidden routing or specimen timing/ROM evidence.

## What the twenty-fourth pass adds

Museum component inspection now shows numbered original-photo observations for
all sixteen native resistors and all nine reviewed DIP packages. The labels come
from recorded photo pins, including held-out DIP observations; unobserved pins
are not invented. Supporting close-up links are shown when declared in component
evidence. Photo pixels remain separate from the native coordinates used for net
highlights. Candidate endpoints remain unnumbered and do not become connected pads.

The R6.4/R6.5 review exposed the importance of distinguishing raised lead bends
from board holes. Their positions remain unassigned pending that review. The new
inspection view makes the recorded points directly reviewable alongside the pin
mapping notes and original image. It does not qualify exact hole centres or
continuity. No CAD geometry, connectivity or reconstruction counts changed.

Fifteen controller browser tests and the production build pass. The new test
checks resistor pin numbering, the supporting source link, DIP held-out points,
and switching back to an unplaced candidate without leaking electrical highlights.
The numbered R6.6 crop was visually inspected.

## What the twenty-third pass adds

R6.6 and R4.3 now have native placements from top-photo lead endpoints and
factory identities. The owner's CPU/oscillator close-up supports orientation
against A6:10 and A7:11. The lower OSC_RC continuation remains partly obscured;
net assignments are reference-derived and have not been continuity measured.

Both resistor bodies were absent from legacy geometry. Their native nominal
centres are (94.08, -3.05) and (113.74, -4.27) mm, distinct from the remaining
legacy estimates, so no legacy entries were removed. Native pads now position
the bodies, leads, holes, lands and upper blue collars. Sixteen resistors are
native; 43 components remain unplaced. Copper and airwire counts are unchanged.

The supporting close-up is pinned in the evidence manifest. Export includes all
local evidence sources in freshness checks and rejects source/evidence hash
disagreement. The stale-source test now mutates every declared local photo;
isolated test fixtures copy those sources instead of assuming only two photos.
Eighteen export checks, native KiCad integration, model/download metadata, fourteen
controller browser tests and the production build pass. The photo overlay and
enlarged model region were reviewed; only the controller visual baseline changed.
All three strict visual checks and CAD CI pass.

## What the twenty-second pass adds

The canonical evidence ledger now reflects recovered factory placement and the
reviewed reset supply tree, replacing stale descriptions from the first copper
pass. Coverage totals are referenced through generated qualification rather than
copied into the gap ledger. Discrete-terminal uncertainty explicitly separates
the fourteen placed resistors from the three remaining reset candidates.

A scoped source audit records the manufacturer's contents page, keyboard sheets
(PDF pages 9–12), and review of a contact sheet of all 50 pages. No keyboard
solder-side copper drawing was identified in that source. This does not imply
that no such drawing exists elsewhere. R4.2/R7/R8 underside correspondence
remains ambiguous among nearby joints; no terminal assignment was promoted from
the unreliable global-photo extrapolation.

No geometry or connectivity changes were made. The counts remain 45 unplaced
components, 21 assigned copper segments and 231 airwires. Eighteen export checks
pass; model/download metadata and cross-repository synchronization checks pass.
The existing digital and visual qualification scopes are unchanged.

## What the twenty-first pass adds

The top-photo supply strip remains visible beside C4 and reaches R6.1's right
lead. R6.1 is now natively placed, with four observed copper sections and one
inferred pad attachment extending the supply tree. Pin 2 follows reference
RESET_BASE; hidden branches and measured continuity remain unresolved.

The legacy model's omitted reset resistor is now identified as R6.1. Its nominal
photo-projected centre is x=-89.09 mm, while the three remaining legacy reset
estimates near x=-86, -82 and -78 correspond to R4.2, R7 and R8. R6.1 adds the
missing body, leads, pads, holes and observed collar without removing an existing
resistor. R4.2/R7/R8 remain candidates requiring terminal review.

There are now fourteen native resistors, 45 unplaced components, 21 assigned
copper sections (16 observed, 5 inferred) and 231 airwires. The graph check now
verifies that the local supply tree reaches exactly four reviewed supply pads.
Eighteen export checks, native KiCad integration, model/download metadata and
fourteen controller browser tests pass. The production build passes. The copper
overlay and enlarged reset-area render were inspected, and the controller visual
baseline was updated. All three strict visual checks and CAD CI pass. The
reference schematic and HDL remain unchanged.

## What the twentieth pass adds

R5 is now natively placed and connected to the reviewed local supply strip. A
closer top-photo review shows the copper continuing from the R3/R4.1 junction to
R5's right lead above C4. Two observed segments and one inferred pad attachment
extend the route. Its reference RESET_BIAS terminal remains unmeasured, and the
supply continuation behind C4 is unresolved.

Native pad geometry replaces R5's legacy body, lead, land, hole and collar
placement. Thirteen resistors are now native; 46 components remain unplaced.
There are 16 assigned copper sections (12 observed, 4 inferred) and 232 airwires.
All earlier placements and copper are retained. A graph check verifies that the
local supply tree reaches exactly the three reviewed supply pads without islands.
Eighteen export checks, native KiCad integration, model/download metadata and
fourteen controller browser tests pass. The production build passes. The route
overlay and model render were reviewed, and the controller visual baseline was
updated. All three strict visual checks and CAD CI pass. Reference schematic
and HDL connectivity are unchanged.

## What the nineteenth pass adds

The visible top-side strip between R3:1 and R4.1:1 is now native KiCad copper on
reference net +5V. Three segments are photo-observed; two short pad attachments
are inferred because solder obscures the precise hole/copper boundary. Each
segment retains its original photo pixels and geometry-bound provenance. The
1.0 mm width and nominal planar scale are estimates. The overlay was visually
checked against the original photograph; hidden supply continuation is unresolved.

The native track connects the two supply pads and reduces unresolved airwires
from 234 to 233. Assigned copper increases from 8 to 13 segments (10 observed,
3 inferred). The original A1:1 route and its single dangling endpoint remain
unchanged, as do all component placements and the 294 unassigned artwork segments.
Seventeen export checks cover the new path's endpoints, net and classification.
The reference schematic and HDL connectivity are unchanged. Native KiCad,
model/download metadata and fourteen controller browser tests pass, as does the
production build. The controller render was reviewed and its baseline updated;
all three strict visual checks and CAD CI pass.

## What the eighteenth pass adds

R3 and R4.1 now have native KiCad placements. Their right leads share a visible
top-side connection, and +5V is their only common net in the reference schematic.
That supports pin 1 orientation without relying on the failing global underside
fit. Their opposite reset-node assignments remain reference-derived, not measured
continuity. The shared visible copper itself is not yet a native routed track.

The two corresponding legacy resistor estimates were removed; native pad geometry
now drives bodies, leads, lands, holes and the photographed collar ends. No
previously placed component moved. Twelve resistors are native and 47 components
remain unplaced. R5 and the lower four reset resistors remain photo candidates;
the missing seventh reset resistor is still a model gap.

Sixteen export checks and the native KiCad integration test pass. Connectivity
and the existing eight copper sections remain unchanged, retaining the reference
HDL qualification. Museum candidate-photo coverage now exercises R5 rather than
the newly placed R3. All thirteen controller browser tests and the production
build pass. The twelve review views render; the changed controller geometry was
reviewed and its visual baseline updated. All three strict visual regression
checks and CAD CI pass.

## What the seventeenth pass adds

Museum component inspection now displays original specimen-photo crops for the
seven reset resistor candidates and BR1/BR2. The crop uses the recorded original
pixel endpoints, with unnumbered circles at the observation uncertainty radius
and a link to the full original photo. This makes the physical evidence directly
reviewable alongside the reference circuit. Candidate endpoints never enter the
pad positions or electrical highlights; the components remain unplaced.

The reset underside comparison did not establish reliable physical terminal
order, so no new net assignment was made. Thirteen controller browser tests pass,
including selection changes, clearing, photo rendering and separation from
net-connected pads. The production build passes, and the R3 crop was visually
reviewed against its lead ends. CAD and HDL revisions remain unchanged.

## What the sixteenth pass adds

The factory placement drawing and original top photo identify seven reset-side
resistors: R3, R4.1, R5, R6.1, R4.2, R7 and R8. Their fourteen lead positions,
observed blue collar ends and four readable value markings are now recorded in
canonical component evidence. Pixel pairs use photographic left/right order,
not schematic pin numbers. Physical terminal order remains unresolved.

This review exposes a model omission: only six legacy resistor placements exist
in that area. The eventual native migration must replace those six with all
seven photographed components. No pad or net assignment was inferred from that
legacy geometry. The reference supply-side and ground-side groups require
separate continuity review before native placement; the underside registration
limits still apply.

All sixteen export tests, model/download metadata checks and twelve controller
browser tests pass. Generated
geometry and connectivity are unchanged, so the unplaced count remains 49 and
existing HDL qualification still applies. Museum metadata and editable downloads
include the observations; this is evidence progress, not completed PCB placement.

## What the fifteenth pass adds

All eight R9 sensing resistors are now native PCB footprints, ordered according
to the factory placement drawing and positioned from photographed lead ends.
Their row/base terminal assignments remain reference-derived: the matrix-facing
lower lead is pad 1 and the transistor-facing upper lead pad 2. Hidden continuity
has not been measured. Their original pixel observations and limits are retained
in component evidence and the separate direct-placement photo report.

The eight legacy placement entries were removed. Native pad geometry now drives
the bank's bodies, leads, holes and lands. For all ten migrated resistors, one
blue collar is rendered at the photographed end, including the reversed collar
on R9.7. This corrects the former symmetric two-band appearance; it is not an
assertion of electrical polarity or a resistance reading.

The unplaced count falls from 57 to 49. No previously placed component moved;
connectivity, eight assigned copper sections, 234 airwires and one dangling
endpoint remain unchanged. Sixteen export tests and the native KiCad integration
test pass, as do model/download checks. The photo overlay was inspected against
all sixteen bank lead ends. Reference HDL qualification remains applicable.
Twelve controller browser tests, the production build and CAD CI pass. All twelve
review views render; the three strict visual regression checks pass after
reviewing and updating only the controller baseline.

## What the fourteenth pass adds

R10.1 (clock pull-up) and R10.2 (data pull-up) now have native KiCad placements
from photographed lead endpoints and factory placement identities. Pad 1 is
assigned to the shared supply-side lower lead, supported by the visible underside
connection toward A1:14. The upper signal paths disappear into the A1 region;
pad 2 net identity remains reference-derived. Values, body/hole dimensions and
nominal photo scale are not specimen measurements or continuity qualification.

OpenSCAD now derives these resistors' centres, angles, lead spacing, board holes
and pad dimensions from the native PCB. The two separate legacy placement entries
were removed while retaining the existing resistor body/lead shapes. The photo
report and overlay include the new lead endpoints, explicitly marked as direct
placement with no independent held-out validation. Component evidence is now
pinned in the museum sidecar and displayed when selecting a component.

The unplaced count falls from 59 to 57. No previous placed component moved, no
schematic net changed, and the 234 airwires and single dangling track remain.
Fifteen export tests, the native KiCad integration test and model/download checks
pass. The existing HDL qualification applies to unchanged connectivity. Twelve
controller browser tests, the production build and CAD CI pass. All twelve
review views render; the three strict visual regression checks pass after
reviewing the resistor change and updating only the controller baseline.

## What the thirteenth pass corrects

The factory schematic's twelve A2 NAND gates agree with the reconstructed
netlist, resolving the location-label discrepancy as a reconstruction placement
error. A2.1 belongs across from A1 on the cable side of X1; A2.2 belongs beyond
X1 on the A4 edge; A2.3 belongs beyond X1 on the CPU edge. The native footprint
poses and their photo-landmark records now follow those identities. Stable
component references, pin numbers, schematic nets and HDL wiring are unchanged.
Only the three A2 placed records changed; no unrelated package was moved.

`evidence.json` retains the previous location labels and the independently read
factory gate pin/net assignments. Fourteen export tests check their consistency
and correct board regions; all photo-fit checks and the native KiCad integration
test pass. The controller meshes and museum sidecar are regenerated together, so
selecting A2 components or their nets now marks the correct physical locations.
This is a reference-placement correction supported by the factory drawing, not
a claim that specimen copper continuity has been measured. The existing digital
qualification still applies to the unchanged connectivity. All eleven controller
browser tests, the production build and CAD CI pass. All twelve review views
render and the three strict visual regression checks pass without baseline changes.

## What the twelfth pass discovers

A source search during the completion audit recovered the manufacturer
[service drawing set](https://www.tiffe.de/Robotron/PC1715/PC-1715-Schaltplaene.pdf).
PDF page 10 (printed drawing 8) contains populated placement drawing
63-330-4103-2, and page 11 contains factory schematic 56-330-4103-7. The PDF is
hashed in `evidence.json` and linked, not redistributed. This usable drawing
changes the next physical-reconstruction step: compare its reference locations
and pin connections against the specimen before relying on photo-only inference.
The previously rejected unfinished Zander placement sheet remains unusable.

The drawing supports two visible wire-link candidates: BR1 beside C6/R10.3 at
the ROM/oscillator end, and BR2 beside R9.1 on the cable side of A1. Original
photo endpoints and their uncertainty are recorded without assigning schematic
pin numbers to their order. Bridge inspection in the museum links the factory
placement and states that terminal order and electrical continuity are unverified.
The native footprints remain unplaced pending those checks.

The three A2 package locations have different reference labels in the factory
drawing and current reconstruction. The evidence records this discrepancy as
physical-location candidates; it does not establish a historical circuit variant.
It may instead identify a reconstruction placement error. Resolve the pin/net
correspondence before renaming or moving packages. A6/A7 printed type labels
also differ from current reference values and are retained for comparison.

Thirteen export tests, model/download metadata checks, ten controller browser
tests and the production build pass. CAD CI passes for `33b5465`. Geometry,
connectivity and the existing HDL qualification are unchanged. The plan is still
incomplete, but the newly recovered source provides substantive work toward the
remaining placements rather than making specimen measurements the only next step.

## What the eleventh pass closes

Selecting a controller component or net now highlights its assigned copper in the
3D museum as well as the circuit drawing. The overlay uses exported native route
coordinates and IDs: observed sections are gold, inferred sections dashed orange,
and unresolved assigned sections dashed cyan. Top and underside sections retain
their respective board heights. Highlights attach to the board through inspection
movement, and closing or clearing selection disposes them. Unassigned artwork is
excluded from net highlighting. These overlays identify evidence, not live
current flow or measured continuity.

The real-model browser tests verify route selection and exclusion, top/bottom
coordinates, pad alignment, provenance styling, board attachment, geometry
preservation and resource disposal. Ten controller tests pass in Chromium,
Firefox and WebKit (30 cases), and the production build passes. The selected
A1:1 route was also rendered and visually checked against its model trace.
CAD, HDL and physical reconstruction status are unchanged. CPU WR/RD photo
inspection still does not establish a continuous path to A1.

## What the tenth pass establishes

The underside investigation now distinguishes local correspondence from the
failing board-wide fit. Four A4 corner pins define a local photo-to-photo map;
four different interior pins check it, with residuals of 0.16–0.37 nominal mm.
The projected upper terminal near A4 matches the top A1:1 route endpoint within
0.22 nominal mm; the neighboring lower terminal provides a second pattern match.
Both lie outside the anchor columns, so the report explicitly marks them as
extrapolated candidates. A tentative terminal near A6 differs by more than 2 mm
when projected with the same fit. This does not establish a safe calibration for
the whole underside route, nor prove that the A6 candidate is the counterpart.

Original pixel observations, the local matrix, held-out checks, candidate
residuals and extrapolation flags are retained in the CAD evidence and generated
report. The underside overlay marks local check pins and candidate terminals;
selecting A4 in the museum exposes the fit and its limits. Local success does
not override the failed global checks or qualify copper assignment. No geometry,
via, connectivity or HDL change was made. Physical totals remain eight assigned
top sections, one dangling endpoint, 234 airwires and 59 unplaced components.
Thirteen export tests pass, including independent-check validation and a guard
against treating this local fit as qualified copper evidence. All eight controller
browser tests and the production build pass; CAD CI passes for `58655bb`.

## What the ninth pass establishes

The first actual copper route is now native KiCad geometry: the top track leaving
A1 pin 1, running around X1 and ending at a round terminal near A4 (original
photo pixel 1241,2966). Seven segments follow visible copper. One short segment
connects the fitted pad centre to the visible lead edge and is explicitly inferred.
The estimated width is 0.35 mm; board scale remains nominal. Every segment has a
UUID, geometry-bound evidence and original-photo pixel locators. Native geometry
is exported into OpenSCAD, the museum mesh, review SVG and photo overlay.

This is a partial route. `/WR_N` names the reference schematic connection at
A1:1; the traced section does **not** establish continuity to the CPU WR pin or
resolve the WR/RD source disagreement. The terminal's underside correspondence
and continuation remain unresolved. No through-via or hidden route was invented.
DRC retains one `track_dangling` finding, with 234 airwires still unresolved.
There are now eight assigned copper segments; all 294 legacy artwork segments
remain unassigned and 59 components remain unplaced.

Museum inspection shows observed/inferred section counts and evidence details,
highlights the assigned route with its net or component, draws the inferred
attachment dashed, and reports the remaining DRC finding. The source-photo overlay
was visually checked along the whole top section. Twelve export checks and the
native KiCad integration test pass. Connectivity and HDL wiring are unchanged;
reference co-simulation remains applicable, without claiming specimen continuity.
All seven controller tests pass in Chromium, Firefox and WebKit (21 cases), and
the production build passes. All 12 visual review views render; the three strict
regression checks pass after reviewing and updating only the controller baseline.
Its structural difference is limited to the added trace vertices/indices. CAD CI
passes for `371b017`.

## What the eighth pass closes

Native copper now requires a per-UUID record in `route-evidence.json`, with
observed/inferred/unresolved status, a review explanation, pinned source citations
and locators. Geometry hashes bind the review to the exact track/arc/via shape,
width, side and net; edits invalidate prior review. Export rejects missing or
orphaned records and stale citations. Observed tracks require their side's photo;
observed through-vias require both sides. Records survive in exported layout and
therefore the museum sidecar. These checks enforce provenance, not the correctness
of a human reading of a photograph or measured electrical continuity.

The ledger remains empty: A1's top-photo crop shows a track leaving pin 1 but does
not establish the entire path, and pins 2/4 do not reveal unambiguous output routes.
No uncertain artwork was promoted to electrical copper. Physical totals remain
294 unassigned segments, 59 unplaced components and 234 airwires.

Validation: 11 export tests pass, including moved/renetted/stale-source rejection.
The native KiCad integration test rejects unreviewed synthetic copper, accepts
explicitly documented synthetic arc/via geometry, and still rejects pad/net
mismatches. Download sources and model metadata pass validation. Geometry and
connectivity are unchanged, so the existing HDL qualification remains applicable.
All six controller browser tests and the museum production build pass; CAD CI
also passes for `f6e174d`.

## What the seventh pass closes

Co-simulation failures now retain structured first-failure signals and automatic
waveforms. Bus failures identify the first vector, signal, synthetic testbench
nanoseconds and values; exact vectors are retained and replayed into VCD.
Firmware failures identify serial/LED event indices, both CPU clocks, differing
values and missing events. A bounded real-HDL replay captures the earliest data
divergence with 32 clocks of context on each side. CPU phases are not aligned
away. Coverage-only failures without a differing event explicitly retain only
an initial waveform window; full stimulus logs and manual full-wave capture remain.

`failure.json` records counterexamples and waveform hashes. A new run removes
old reports before executing checks, preventing an aborted qualification from
leaving a stale passing result. Four diagnostics tests include actual injected
read, LED and serial faults, missing events and a bounded firmware waveform run.
They run in ordinary core CI through `make test-keyboard-controller`. The final
harness rerun passes 131,072 bus transactions, 390 serial bits and 11,971 LED
state records with the existing documented phase offsets. Source hashes were
verified against the final files before committing the reports.

## What the sixth pass established

The underside CPU rows were recounted against the original image. The earlier
lower-corner observations at y3138 picked features below the twenty-pin rows;
corrected corners are recorded in `bottom-landmarks.json`, with superseded points
preserved in its review history. Fitting anchors and the 1.25 mm tolerance are
unchanged. All six checks now show 1.41–1.70 mm PCB-relative residuals. This corrects
the previous report rather than preserving its more favourable numbers.

A separate direct photo-to-photo comparison uses the same four anchors but targets
the original top-photo observations, bypassing rigid PCB footprint placement.
A1 checks differ by 0.17/0.41 nominal mm; CPU checks span 0.89–1.28 mm. The report
retains pixel residuals as well as nominal mm and hashes both original photographs.
The museum presents both comparisons separately. The larger PCB-relative errors
show that nominal calibration and package fitting contribute to the discrepancy;
this is not solely an underside image-registration problem. Top lead/socket
surfaces can obscure board-hole centres, so neither comparison qualifies exact
physical routing. Measured dimensions and additional shared pads are still needed.

Ten fast CAD checks, canonical export/download metadata checks, six browser
checks and the production build pass. No geometry, electrical connectivity or
copper assignments changed in this pass.

## What the fifth pass established

A8 orientation is now supported by the visible package notch and pin-one dot above
the blue tape. Four corner-lead landmarks and four held-out right-side leads fit
within 1.11 mm of the nominal PCB plane. The footprint moved about 6 mm toward
the CPU, and the generated ROM body, socket, cover, ink, pads and holes follow it.
All nine DIP packages now have top-photo landmark checks. A8's socket still hides
bare PCB hole centres; the replacement EPROM identity remains unread.

The new underside audit uses four numbered A1/A8 anchor pads and six independent
A1/CPU check pads, preserving the reflection into the top-view coordinate frame.
CPU corner checks are approximately 1.0–1.1 mm; A1:7 and A1:8 exceed the 1.25 mm
tolerance at approximately 1.66 and 1.46 mm. The report and original-photo SVG
retain these failures. The museum exposes them for selected components. This is
relative registration to estimated PCB placement, not metrology, and no copper or
existing artwork was reassigned or transformed. Further cross-side registration
work is required before tracing can be promoted as electrical copper.

`bottom-landmarks.json` is the observation record;
`generated/bottom-registration.json` and `.svg` are derived outputs. Freshness
checks now include the underside photo and the registration code. A regression
check rejects reusing an anchor as a held-out check. Ten fast CAD checks and the
KiCad arc/via/net-mismatch integration test pass. Six Chromium and twelve
Firefox/WebKit controller checks pass, as do the production build and reviewed
visual regression. CAD CI is green. Connectivity is unchanged.

## What the fourth pass closed

A4's original top-photo annotation placed the two final-lead landmarks above the
actual last leads. Re-reading all ten leads on each side corrected those points
and added four held-out intermediate leads. The native 8282 footprint now follows
that reviewed fit: center (54.806, -8.970) mm, rotation -0.109 degrees, maximum
residual **0.554 mm**, including held-out points. The tolerance remains 1.25 mm.
All eight annotated DIP packages now pass with independent check landmarks.
The photo overlay was visually reviewed; this remains nominal photo alignment,
not metrology, and does not qualify A8 or underside registration.

DIP body, leads, pads, holes, solder and artwork-dependent model geometry are
regenerated from the PCB. Schematic connectivity is unchanged, so the existing
qualified HDL reference remains applicable. DRC still reports 234 airwires and
zero other violations. Nine CAD tests, five controller browser tests, the production
build and canonical metadata checks pass. Top and underside renders were reviewed;
the controller visual baseline now records the corrected footprint. Unrelated
drive and motherboard structural baselines still match.

## What the third pass closed

The independent drawing review found errors outside the earlier digital peripheral
comparison. Corrections now carried through the native schematic, PCB pad nets,
generated HDL and museum metadata are:

- Reset circuit: V3.1 collector to +5V; V3.2 collector to V4.9 base; R5 to V3.2
  base; V1.2 anode to C2 positive; C1 lower terminal to the reset output.
- BR1/BR2: explicit two-terminal components separate oscillator/CPU clock and
  reset-circuit/CPU RESET nets. Reference state is closed; physical locations and
  specimen bridge construction remain unverified.
- X1:A9 and R6.5: BUSRQ, separate from CLK and the WAIT/INT/NMI pullup net.
- Cable filtering: L1.1 is clock to XT1:B2; L1.2 is ground to XT1:A3; L1.3 is
  +5V to XT1:B4; L1.4 is data to XT1:A1. The previous clock/ground terminal
  assignment and winding references were wrong.

Generated `controller_service` wiring supports opening BR1/BR2 and injecting
clock/reset at the CPU side. Thirteen HDL checks cover source isolation, external
stimulus, floating reset, the clock pullup and conflicting drivers. The firmware
HDL CPU now receives its reproducible clock/reset through these open bridges.
This is a virtual electrical test, not a documented factory procedure or a
qualification of the analog source circuits. The museum explains the distinction
when either bridge is selected. Bridge endpoint metadata is checked against the
schematic during synchronization.

The [1985 Robotron service handbook](https://www.tiffe.de/Robotron/PC1715/PC-1715-Servicemanual.pdf#page=91),
printed pp. 89–92, independently supports WR-based serial synchronization and
specifies an approximately 100 ms power-on reset and a 700 kHz ±10% clock. The
emulator's 683 kHz setting is within that reference range. Oscillator gate pins,
component references and capacitance differ from Zander, so the handbook is not
silently merged into the reconstructed circuit. It strengthens the WR reference;
physical continuity must still establish the specimen's wiring.

Photo-fit application now rejects failing held-out landmarks and unknown component
references before writing the PCB. Nine fast CAD tests cover these guards, reset
and bridge topology, cable pin assignments and existing export checks. The KiCad
integration test still checks curved copper/vias and deliberate pin/net mismatch.

The rerun retains **131,072 bus transactions with zero differences**, **390 serial
bits** and **11,971 LED state records** in agreement. CPU phase offsets remain
unchanged; the production runtime was not changed in this pass.

The reviewed controller image is unchanged. KiCad save rounding moved two pad
coordinates by one nanometre; regenerated mesh deduplication removed one vertex
without changing triangles or bounds. The strict structural baseline was updated
after inspection.

The inventory is now **70 components, 59 unplaced, 234 airwires and zero assigned
copper segments**. The extra two unplaced components are the newly explicit
bridges. ERC retains only the two documented isolated labels; other DRC violations
remain zero. Those counts expose remaining work rather than claiming that an
unrouted board has become complete.

## What the second pass closed

### Reference digital comparison

The previous 57,101 bus mismatches were emulator differences from the reference
circuit, not grounds for changing the schematic to match the emulator. Corrections:

- Every I/O access clocks the LED latches; A15 controls the 8282 output enable.
- A15-high addresses read the matrix; active contacts combine with OR.
- WR clocks serial output for memory writes as well as I/O writes.
- Repeated callback ticks do not generate duplicate serial strobes.

The expanded audit passes **131,072 transactions with zero differences**: 65,536
I/O reads, 32,768 I/O writes and 32,768 memory writes. A15-high writes remain outside
the model because CPU and latch drivers can contend on the physical data bus.

Independent TV80 and C CPU runs produce identical **390 serial bits and 11,971
raw LED state records** over 4.6 million CPU clocks. Coverage requires normal,
Shift, Ctrl, REP repeats, quiet after REP release, and typing after reset. Coarse
LED samples also agree. Full bus auditing is now an ordinary CI check.

This is scoped logical equivalence. Serial timestamps differ by two clocks;
LED transition offsets depend on CPU callback phase, with separate initialization
and reset settling offsets. The report retains their histogram and explicitly
marks cycle equivalence false. Oscillator, analog front-end thresholds, reset
transients, contact resistance and propagation delay are not qualified.

The production latch value is raw electrical state. Display indicators use a
separate **2 ms peak hold**, explicitly a visualization approximation. It prevents
short scan-time lows from becoming frame-rate flicker and never feeds the circuit.
The museum review shows both values separately. Snapshot layout 15 preserves the
hold state; core 0.16.0 is archived for older sessions.

### Physical alignment and model synchronization

Numbered top-photo lead landmarks now cover eight DIP packages, with held-out
check points for seven. Seven placements meet a **1.25 mm photo-review tolerance**
after rigid fitting. This is a nominal photo registration, not dimensional
metrology. A4 (8282) still fails; its inherited placement was retained. A8 and
discrete pin orientation remain unqualified. Reference designators do not by
themselves establish specimen electrical identity.

The native PCB now drives the museum's DIP positions, orientations and pin counts,
CPU/ROM socket transforms, associated ink, DIP pads/holes, outline and controller
artwork. A1/A6 are correctly represented as DIP-14 rather than DIP-16. Existing
pinned KiCad body/lead meshes are reused. Generic procedural fanouts were removed.
The 294 photo-artwork segments remain unassigned graphics, not verified copper.
Other discrete and mechanical visuals remain estimates pending reconstruction.

Reference labels now belong to F.Fab; evidence fields are hidden metadata rather
than invented historical silkscreen. DRC has **zero other violations but 233
unconnected items**. There are still **57 unplaced reference components and zero
assigned copper segments**. This is not a fabrication-ready board.

The export checks every numbered PCB pad/net against the schematic. Source hashes
bind the photo evidence, native PCB, generated geometry, HDL and qualification
reports. Browser metadata additionally binds the consumed SCAD sources; a partial
export cannot silently bless stale controller meshes with new source hashes.

## Validation

Third pass: nine fast CAD checks, the KiCad integration check, 13 bridge isolation
checks, common/full bus audits and the complete TV80/S600 comparison pass. Seven
focused Chromium/CI-selection checks and ten Firefox/WebKit controller checks
pass. The production build and reviewed visual regression pass. Production C/WASM
behavior is unchanged; earlier runtime validation below remains source-bound to
core 0.17.0. CAD CI also passes for the new revision.


- Native device/runtime tests, Python verification, AddressSanitizer and
  UndefinedBehaviorSanitizer pass.
- WASM lifecycle, snapshot, clock and peripheral fixtures pass.
- Optional S600 keyboard and mixed DMA/printer/V24 snapshot workloads pass.
- Common subset and full bus/firmware co-simulation pass within the scope above.
- Six fast CAD checks and the KiCad arc/via/pad-mismatch integration test pass.
- Detailed OpenSCAD review renders with the Manifold backend without errors.
- Canonical model/download metadata checks pass; CAD and core CI pass.
- 26 focused Chromium checks, eight controller checks across Firefox/WebKit,
  and preserved 0.16.0 snapshot restoration pass. The panel tests distinguish
  raw latch values from display persistence. Controller checks are included in
  model-only CI selection as well as the full suite.
- Eight historical browser checks pass, including S600 DIR input, mid-write
  snapshot continuation, file editing/checkpoint recovery and WordStar save/reopen.
- Visual review confirms the controller migration; unrelated drive and motherboard
  views retain their geometry. Unassigned artwork is clipped at the board edge
  only for museum rendering; native review preserves registration overshoot.

## Review and reproduce

Open **Keyboard controller circuit review** in the museum. Select a component or
net for numbered pins, estimated pad positions, unplaced components and available
photo-alignment residuals. Cyan lines have no net assignment. Both board sides use
one top-view coordinate frame. Links identify exact pinned source revisions.

From the canonical CAD controller directory:

```sh
python3 tools/export.py --check
python3 tools/test_export.py
python3 tools/photo_registration.py
# The following require KiCad's Python/pcbnew:
python3 tools/export.py
python3 tools/test_kicad.py
openscad --backend=Manifold -o /tmp/controller.stl review.scad
```

`generated/photo-registration.svg` overlays PCB pads (red) and observed landmarks
(green) on the original photo. `photo_registration.py --apply --refs A1 ...` applies
explicitly selected acceptable fits to the native PCB; regenerate afterward.

From `dac-emulation`:

```sh
make test-keyboard-controller audit-keyboard-controller
make qualify-keyboard-controller S600_ROM=/path/to/s600.bin
make test-s600-workload S600_ROM=/path/to/s600.bin
```

Logs, vectors and optional VCD waveforms remain under `build/keyboard-controller/`;
committed qualification reports live in `verification/robotron-keyboard/reports/`.
After a schematic change, use `sync_reference.py`, rerun comparisons and commit
reports. A geometry-only change does not require a different connectivity hash.

After committing compatible sources, refresh museum assets with:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
python3 scripts/sync-keyboard-controller.py ../3d-models ../dac-emulation
npx playwright test tests/keyboard-controller.spec.js --workers=1
```

These checks reject dirty source repositories, stale exports, inconsistent
connectivity and reports whose implementation/CPU/header hashes have changed.

## Completion criteria

| Requirement | Current result |
| --- | --- |
| Schematic/PCB pin agreement and export freshness | Passing |
| Reference digital bus and firmware comparison | Passing within documented scope |
| Bridge isolation and external clock/reset stimulus | Passing digital tests |
| First-failure signals, clocks, stimulus and waveform | Implemented with fault-injection checks |
| KiCad geometry propagated to OpenSCAD and museum | Nine DIPs, twenty-one resistors and BR1 implemented; other discrete parts remain |
| Both photo sides registered to numbered pads | Incomplete; corrected underside checks and nominal calibration remain unresolved |
| Visible copper reconciled with named nets | Partial A1:1 route, local reset/A4 supply connections and inferred BR1 clock link assigned (17 observed sections, 8 inferred sections); CPU CLK candidate withdrawn; 294 artwork segments remain unassigned |
| First data/clock path traced through actual copper | Incomplete |
| Specimen ROM identity and timing | Awaiting planned dumps and measurements |

The plan cannot be marked complete while physical copper remains unassigned.
Passing reference tests and a synchronized model are substantial milestones, but
are not evidence of historical trace accuracy.

## Remaining work against the plan

| Phase | Remaining requirement |
| --- | --- |
| Identity/evidence | Resolve specimen clock wiring and ROM identity; identify remaining physical parts |
| Schematic | Reset topology and BR1/BR2 are explicit; review physical discrete pin maps, specimen substitutions and bridge state |
| PCB | Resolve underside registration and A8 socket-to-hole alignment, place 37 components, trace and assign actual copper, reconcile 229 airwires |
| OpenSCAD | Migrate remaining discrete parts and qualify pad/lead interfaces and physical dimensions |
| Co-simulation | Resolve CPU phase timing if cycle equivalence is required; qualify analog and contention boundaries |
| Museum/sync | Extend verified net geometry and signal mappings as physical reconstruction progresses |

The data/clock path now has passing reference logic and synchronized geometry,
but its physical copper continuity remains unresolved. Specimen ROM dumps and
timing measurements remain planned. Software consistency cannot substitute for
those measurements or for reviewing the remaining visible/hidden routes.

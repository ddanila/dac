# Keyboard controller requirement audit

The [plan](keyboard-controller-plan.md) is **not complete**. This maps requirements
to current artifacts and missing proof. Compatible source revisions are pinned in
the museum manifests linked by the [status guide](keyboard-controller-progress.md).
The linked investigations may be newer than the museum's pinned assets. Paths
below are relative to the CAD controller directory unless stated otherwise.

| Requirement | Evidence | Remaining proof |
| --- | --- | --- |
| Identify board, parts and source variants | `evidence.json`, `component-evidence.json`, native schematic | Specimen substitutions, discrete terminal mapping and ROM contents |
| Inventory photographs and occlusions | Source hashes, photo landmarks, comparison-specimen records | Hidden joints and independent cross-side correspondence |
| Transcribe connectivity and review pins | Native schematic, `generated/connectivity.json`, qualification report | Specimen WR/RD disagreement; transcription is not continuity proof |
| Separate reference and historical PCB variants | CAD `reference/`, variant-specific manifests and museum views | Historical promotion still requires independent evidence |
| Complete reference routing | Reference native pad/net checks, connectivity audit and passing DRC | Routing gate satisfied; package adapters, mechanical fit and electrical qualification remain separate |
| Register and place the historical board | Native PCB, generated layout and registration reports | Unplaced parts, measured scale and global underside fit |
| Trace copper with evidence | Native tracks, `route-evidence.json`, unassigned artwork | Complete physical data/clock paths and unresolved attachments |
| Check connectivity and clearances | Variant-specific native pad-net checks and ERC/DRC reports | Historical DRC findings; specimen fit and electrical qualification |
| Generate geometry and reuse component shapes | Historical exporter and proposed `reference/assembly-generated/` with shared DIP bodies, package mappings and formed leads | Remaining package assumptions, installed package orientation and measured mechanical fit |
| Preserve orientation, lead alignment and repeatability | Asymmetric landmark tests, native integration test, mesh receipts and visual baselines | Estimated lead interfaces and actual specimen dimensions; historical solid-clearance scope is CAD `../checks/assembly.json`; reference body, lead/body envelope and nominal lead-to-lead checks live in `reference/assembly-generated/assembly.json`, nominal and proposed allowance enclosure checks are retained in `reference/enclosure-review.json`; measured forming tolerances and enclosure fit remain open |
| Generate structural HDL with reviewed chip behavior | Core `generated/controller.v`, chip models and source review | Qualified analog device parameters and unsupported device states |
| Couple electrical circuits and HDL | Core analog harness, generated decks, interface and load checks | Full-board clock-phase convergence, remaining firmware scenarios, model calibration, supply/brownout behavior and bus timing qualification |
| Compare transactions and firmware behavior | [Production digital acceptance][cpu-bus], retained edge comparisons and complete standard-S600 captures | Declared reference digital scope passes; exhaustive opcode conformance, U880 specimen timing and analog qualification remain separate |
| Retain diagnostics and replay | First-difference traces, stimulus, waveform and fault-injection tests | Instrumented specimen comparison |
| Preserve IDs and expose evidence in the museum | Export sidecars, component/net inspector and browser tests | Visual-only bodies do not establish native pads |
| Connect runtime diagnostics | Latch samples, labelled display persistence and a pinned recorded bus waveform | Live frame samples are not full waveforms; recorded simulation does not establish specimen behavior |
| Reject stale or mismatched exports | Source hashes, mesh receipts, sync checks and CI | Consistency checks cannot validate photo interpretations |
| Separate fast checks and longer qualification | CAD native/export CI, core workflows and core qualification target | Longer firmware and mixed-signal qualification remain separate gates |
| Complete reference data/clock integration | Connected reference PCB, SCAD/museum exports and unchanged schematic contract used by HDL comparisons | Coupled electrical qualification; proposed copper does not close historical continuations |
| Complete historical data/clock integration | Partial evidenced geometry | Driver/cable/filter copper continuations remain incomplete; proposed routing cannot close this gate |

## Current findings and their consequences

The [native scope referent controls][scope-referents] show that the existing
hierarchy/thread-membership image misses changes to scope time units, source-line
metadata and internal object membership. Injected mutations change scaled VPI
time, line queries and named signal lookup without changing that image. All
fields restore before HDL continuation; baseline, disabled and observed runs
agree. This demonstrates an observation gap, not ordinary runtime writes in the
compiled board. Applicability, initialization-only invariants and any reachable
mutations still need explicit coverage; complete scope state is not qualified.
The [source ownership audit][scope-metadata] retains initialization and consumer
paths and identifies an additional admission requirement: the current walker
casts intern entries without an independent allocation registry. Register and
validate those identities before dereferencing corrupted pointers in a later
observer revision; textual call-site inspection is not a whole-program proof
that fields remain unchanged.

The [native scope admission revision][scope-admission] now registers completed
scope declarations and native internal-object handoffs before traversal. Eight
native checks reject foreign roots, intern entries and parents, plus omitted
registered children, with negative status and zero output. Restoration preserves
the scope image and original-runtime continuation. Existing scope membership,
lifecycle, automatic-refusal and signal-scope comparisons also pass on the new
runtime. The running campaigns remain pinned. Operational integration, metadata
payload coverage and deletion/address-reuse admission remain open.

The [native scope metadata revision][scope-metadata-native] captures source/cell/
timescale fields, bounded name bytes, function subtype/width/initial value,
lazy time backreferences and ordered internal-object identities/types. Two rounds
distinguish fourteen metadata changes and refuse eight invalid states without
output; every mutation restores exactly before original-runtime HDL continuation.
Automatic scopes also refuse without output. Existing admission, membership and
signal controls pass. Function fields are observed but not mutated; internal
payloads, deletion/address reuse, exhaustive initialization-only proof and board
integration/cost remain open. Existing campaigns retain their pinned runtimes.
The [metadata record controls][scope-metadata-records] now parse all 32 native
images losslessly and check the specific field mutations and restoration. Five
tests cover malformed/truncated records, reference/range/count checks, retained
bytes/order and rejection of unrelated changes. The [native identity binding controls][scope-metadata-bindings] now join scope
metadata to traversal/address identities and two admitted signal handles. They
reject omitted signal ownership while the other observer images remain unchanged,
with exact restoration and original continuation in two rounds. Four tests cover
retained replay and mismatched/truncated/aliased bindings. Other internal-object
payload bindings, lifecycle and operational board integration/cost remain open.
The [initialized board metadata scan][scope-metadata-budget] binds 32 scopes,
1,932 registered objects and all 18 admitted bridge signals before coroutine
execution. The remaining 1,884 identities are 437 nets, 191 registers, 5 integers,
3 memories, 56 parameters, 317 ports and 875 port bits; identity is not payload
coverage. Metadata/reference images repeat exactly and total 101,985 bytes.
Initial-state dense repetition over 110,312 prior snapshot calls projects to
11,250,169,320 logical bytes and about 102.1 seconds for these scans alone.
Changing-state cost, other observers and review are excluded; five retained
evidence tests pass.
The [compact metadata native controls][scope-metadata-compact] reconstruct all
74 dense image pairs exactly through field mutations, restoration and tick changes.
Every compact call performs a complete scan; only exact previous-body equality
permits reuse. Sequence and byte-count checks reject lost or malformed records.
Sixteen invalid-state calls plus the automatic-scope control refuse before output.
The fixture emits 38,585 compact versus 64,944 dense bytes; five tests pass.
The [initialized compact board budget][scope-compact-budget] subsequently
reconstructs all 128 board images exactly: 106,546 compact versus 6,527,040
dense bytes. Local repeated scans average about 0.428/0.507 ms for metadata/
references, including serialization and flush. With unchanged bodies and maximum
future timestamp width, 110,312 calls project to 12,896,524 bytes; changed bodies
still emit in full. Cached content is 101,956 bytes, excluding allocator capacity,
transient buffers and peak RSS. Five tests pass. Changing-state cost, peak memory
and operational integration remain unqualified.
The [combined metadata startup preflight][scope-metadata-combined] adds dense
metadata to native equality/restoration checks and compacts only serialized log
output. All ten existing callback/typed-signal faults pass complete prior-layer
review plus reconstructed metadata ownership joins: 22 snapshots bind 32 scopes
and 18 signals. Native sequence-dependent compact output is kept outside dense
equality checks. The [scope-specific startup controls][scope-metadata-faults]
subsequently detect time-unit/source-line changes and all three function fields,
plus invalid intern-pointer refusal. Exact selected-field changes and complete
restoration pass, as do the ten prior callback/typed-signal regressions on the new
runtime. Full capture/review entry points are now prepared and the local queue
step waits for the typed-signal campaign to pass, with source identities pinned.
Two prerequisite tests reject incomplete predecessors and startup-only evidence.
No full scope-metadata assessment has passed yet; later-boundary and normal
transient/firmware qualification remain open.
The [native port-bit counterexamples][port-referents] demonstrate another payload
gap: ordered bit-vector changes alter VPI iteration but leave full scope metadata/
reference images unchanged. Two rounds restore exact state and original HDL
continuation; an injected foreign bit pointer is restored without dereference.
The retained source contract also identifies deferred port net-reference
initialization and unsafe malformed-vector iteration. Port field/ownership
coverage remained open at that revision; two counterexample tests and source-contract
replay pass. The [guarded port payload revision][port-payload] now captures port
fields and ordered bits with constructor registration and deferred-resolution
readiness tracking. Two rounds distinguish order/name mutations, refuse four
malformed vectors without output, restore exactly and preserve original HDL
continuation. Two nonnull net bindings and three tests pass. Further field faults,
early-resolution/subclass/lifecycle cases and operational board coverage remain
open. The [initialized board port budget][port-payload-budget] binds all 317 ports
and 875 bits to compiled names/directions/widths/indices/order and independent
scope ownership. Complete images remain unchanged. All board port net references
are null, leaving nonnull coverage to the native fixture. The 43,756-byte image
and 0.6085-ms local mean scan project to 4.83 GB and 67.1 seconds over the earlier
snapshot count, excluding changing state and other observers. Three tests pass;
the [combined compact port startup controls][port-payload-combined] subsequently
reconstruct port log bodies while preserving dense native comparisons. All ten
scope/callback and ten typed-signal/callback controls pass with 317 ports and
875 bits bound in every snapshot. Port-specific board faults, changing-state cost
and normal transient qualification remain open. The subsequent
[native port field faults][port-payload-faults] distinguish port index, direction
and bit index, and refuse width, port parent, name pointer, net reference, bit
parent and readiness mutations with negative status and zero output. Two rounds
restore all 18 mutations exactly before original/disabled/enabled HDL
continuation; both nonnull fixture bindings remain covered. Earlier vector/name
controls pass on the new runtime, and three evidence/rejection tests pass.
Readiness is an injected false guard, not actual early-resolution execution;
subclass and lifecycle qualification remain open. The subsequent
[port-specific board startup controls][port-payload-fault-board] pass all nine
fields and four callback faults. Three fields produce exact isolated payload
changes; six return negative status and zero bytes. Complete dense native state
restores before controlled termination. The reviewer binds all 317 ports and
875 bits in every decoded snapshot, allowing only the selected diagnostic change.
Ten earlier scope/callback controls also pass on this runtime and bridge. Five
evidence/rejection tests pass, including unrelated changed-stage payload faults.
The full port capture/reviewer is prepared and queued after the scope-metadata
campaign. Its gate rejects startup-only predecessors and incomplete metadata
reconstruction; two gate tests pass. The queue retains the already reviewed
scope artifacts with exact file identities before capture. This is not a second
semantic replay. Normal transient port execution, later-boundary faults and
lifecycle coverage remain unqualified until the corresponding evidence passes.

The [remaining scope payload counterexamples][scope-payload-gaps] demonstrate
three additional omissions: signedness on an unadmitted signal, binary parameter
bits and memory names. Each changes native VPI results while complete scope,
scope-reference, admitted-signal, port and array images stay byte-identical.
Two rounds restore all mutations and preserve original/disabled/enabled HDL
continuation; four tests pass. This compares five observer families, not the
entire combined state, and does not establish ordinary board mutation. The
[source contract][scope-payload-contract] identifies allocation, union-arm,
bounded-name, parameter-value and memory-binding requirements. The earlier board
census leaves 633 signal handles, 56 parameters and three memories outside the
bridge-signal and port bindings. Existing array value coverage remains useful;
these counters do not imply that all their payloads were wholly unobserved.

The [complete registered vector-signal revision][scope-signals] now observes all
initialized native vector handles independently of bridge admission. Two native
rounds capture unadmitted signedness/range changes and lazy bit creation; ten
invalid pointer/union/cache/ownership cases per round refuse with zero output.
Restoration and original HDL continuation pass. On the initialized board, all
651 handles join scope object identities and allocated nets; the 18 bridge
handles form an exact unchanged subset. The additional 633 are now covered at
this initial boundary. The 78,840-byte image scans in a local mean 0.869 ms,
projecting to 8.70 GB and 95.8 seconds over 110,312 snapshots. Four tests pass,
including the earlier gap regression. These are initial-state measurements;
compiled declaration metadata, unsupported families, lifetime changes, compact
logging and normal transient qualification remain open. Parameter values and
memory-name coverage were unresolved at this stage; subsequent controls follow.

The subsequent [complete signal declaration binding][scope-signal-declarations]
checks all 651 visible native handles against independent compiled scope paths,
names, classes, signedness and declared ranges. All match. The pinned compiler
grammar and creation routines explain the 1,192 local `*` declarations: they
create no VPI handles and are excluded from this handle inventory. Five tests
pass, including altered metadata/declarations, omitted signals, duplicate names,
scope recall and signed bounds. Existing ownership/net/population checks remain
in force. This closes the initial declaration check; unsupported families,
lifecycle changes, compact logging and normal transient qualification remain open.

The [combined compact all-signal startup controls][scope-signals-combined] now
preserve dense native comparisons while encoding complete signal log bodies
with independent sequence and exact reuse. All 13 port/callback and ten
scope/callback startup controls pass; all 651 signals bind to independent
compiled metadata, native owners and nets at every snapshot. The exact C logger
extracted from the built bridge also reconstructs retained changing native
signal images byte for byte, including range/signedness changes, restoration
and lazy cache creation: eight full and four reused records reconstruct all 12
images exactly. Six tests pass. This logger replay is not another HDL execution.
All-signal board faults, operational changed-state cost, full transient execution
and lifecycle qualification remain open.

The subsequent [non-bridge signal fault controls][scope-signal-faults] pass six
signal and four callback startup controls. Native selection chooses the first
registered signal outside bridge admission. Signedness/range faults change only
that payload; node/name/cache/scope faults return negative status and zero bytes.
Bridge-admitted payloads remain unchanged, and complete native state restores
before termination. All 651 signal declarations and ownership/net bindings are
checked in every reconstructed snapshot. A separate native fixture exercises all
six exported toggles twice, verifies 12 exact restorations, and preserves
original/disabled/enabled HDL continuation. Four evidence/rejection tests pass.
The full all-signal capture/reviewer is prepared and queued after port-payload
validation, with two gate tests rejecting startup-only or incomplete predecessors.
The queue retains the reviewed port artifacts with exact file identities before
capture; no redundant semantic replay is implied. Full transient and lifecycle
qualification remain open.

The [native parameter payload observer][parameter-payload] adds constructor-time
registration for binary, string and real parameters, exact scope ownership,
bounded names/string storage and binary width/storage-pointer checks before
reading. It records raw binary words and signed/sized flags, embedded-null string
bytes including the terminator, real representation bytes and local/source
metadata. Two rounds capture five isolated value/flag mutations and refuse width
and missing/duplicate ownership with negative status and zero output. Restoration
and original/disabled/enabled HDL continuation pass; three evidence tests pass.
The previous scope-payload counterexamples still reproduce on the new runtime,
showing that the new observer adds coverage independently. Remaining pointer and
family faults, lifetime changes, actual board bindings and operational cost are
not yet qualified at this stage; subsequent parameter and memory controls follow.

The [initialized board parameter binding and budget][parameter-budget] now joins
all 56 parameter IDs and owning scopes to compiled names, local/signed/sized
flags, source-file/line metadata and 1,386 logical binary bits. All match.
Retained raw word pairs include unused high bits, whose values are not specified
by the compiled declarations. All board parameters are binary; string/real
coverage remains in the native fixture. Repeated full images stay unchanged.
The 8,851-byte image and local 0.218-ms mean scan project to 976 MB and 24.0
seconds over 110,312 snapshots, excluding growth, other observers and review.
Four tests pass. Compact logging, changed-state cost, pointer/lifecycle controls
and normal transient integration remain unqualified.

The [native parameter field/pointer faults][parameter-faults] subsequently cover
16 diagnostic fields twice. Binary raw words, signed/sized/local flags, file/line,
name bytes, real bytes and string bytes produce exact isolated changes. Binary
width, scope/name pointers, wide A/B storage pointers and string pointer/length
faults refuse with negative status and zero bytes. All 32 mutations restore
exactly before original/disabled/enabled HDL continuation. Earlier parameter
payload controls pass on the new runtime, and three evidence/rejection tests
pass. Unsupported subclasses, lifetime changes and operational board faults
remain unqualified.

The [initialized board parameter fault controls][parameter-board-faults] apply
seven isolated binary value/flag/source/name changes to the actual 56-parameter
population. Every changed image rejects independent compiled bindings. Width,
scope-pointer and name-pointer faults refuse with zero output. Two rounds give
20 exact restorations of the complete parameter image; six absent-family
controls per round return unavailable and leave it unchanged. Three retained
evidence/rejection tests pass. These controls stop at tick zero before HDL
advance, so operational transient faults and continuation remain unqualified.

The [combined compact parameter preflight][parameter-combined] adds parameter
payloads to complete dense native snapshots and independent compact log records.
All 56 parameters bind to native owners and compiled metadata/values in 51
snapshots across 13 port/callback and ten signal/callback startup controls.
Every preceding state layer and exact restoration remains checked. The built
C logger also replays 52 retained native binary/real/string images through
value, flag, source and name changes: 37 full records and 15 reuses reconstruct
all bytes exactly, using 22,102 versus 29,328 dense bytes. This replay does not
measure operational memory or transient cost. Integrated parameter-specific
faults, later boundaries and lifecycle coverage remain unqualified.

The [integrated parameter startup faults][parameter-fault-preflight] detect
seven isolated raw-word, flag, source and name changes in both direct parameter
and complete native snapshots. Width, scope-pointer and name-pointer faults
refuse before output. Complete snapshots restore exactly before controlled
termination, preserving all prior state layers and 56 compiled parameter
bindings. Four callback controls and 13 port/callback regressions pass on the
same bridge. The rejection suite also checks unrelated parameter changes and
raw storage bits outside the declared width. Later-boundary faults, normal
waveforms and firmware continuation remain unqualified for this layer.

The [native bounded memory-name controls][memory-metadata] independently register
memory handles, concrete array pointers and name allocations before observation,
then join them to guarded native scope-object identities. The distinction between
handle and concrete array pointers is retained for the multiple-inheritance layout.
Two name-byte changes alter VPI results and the new image while earlier array
payloads remain identical. Changed/foreign name pointers and missing, duplicate
or foreign intern membership give ten zero-output refusals across two rounds.
Every control restores, and original/disabled/enabled HDL continuation agrees.
The parameter fault regression also passes on the new runtime; three evidence
and malformed-input tests pass. This does not repair the older array collector's
traversal or storage-pointer guards, qualify memory lifecycle/subclasses, or
establish board-memory bindings; those are checked separately below.

The [initialized board memory binding and budget][memory-board-budget] joins
all three scope-owned memories to complete array payload identities and compiled
hierarchical names, address/word ranges, widths and read-port counts. The ROM
has 2,048 eight-bit words and one read port; RegsH and RegsL each have eight
eight-bit words and eleven read ports: 16,512 bits and 23 ports in total.
A retained native fixture using the same runtime and header independently checks
the handle-to-concrete-array offset, rejecting cross-linked register-bank pointers.
Complete names and array value/cache images remain unchanged through 64 scans
before HDL advance. The 283-byte metadata image scans in a local mean 0.159 ms,
projecting to 31.2 MB and 17.6 seconds for 110,312 snapshots, excluding growth,
other observers and review. Four tests pass. Older array traversal/storage-pointer
safety, unsupported families, lifetime changes and operational integration remain
unqualified.

The [array traversal/storage admission controls][array-admission] subsequently
check guarded scope membership before the older array collector performs casts.
An independent registry admits exact static four-state storage allocations and
checks width, word count, cell-buffer identity and wide A/B pointers before
observer reads. Native constructors, destructors and valid writes maintain it.
Nine faults in each of two rounds produce 36 zero-output refusals across dense
and compact images; all 18 mutations restore exactly. Unallocated wide words
can receive valid HDL writes, and dense/compact reconstruction and original
continuation remain exact. Storage destruction and same-address reconstruction
update admission, while subclasses and foreign storage refuse. Existing compact
array and memory-name regressions pass on the new runtime; three evidence and
rejection tests pass. Lazy word-cache pointers, read-port heads, broader lifecycle
and operational board integration remain unqualified.

The [lazy array-cache admission controls][array-cache-admission] record each
word-cache allocation pointer and length, then validate both before reading the
cache's parent and word links. Read-port head validation now precedes dense and
compact output headers. Foreign, shifted and missing cache bases and foreign
heads give 16 zero-output refusals and eight exact restorations across two
rounds. Explicit VPI indexing creates the cache once, while observer scans leave
its allocation unchanged. Complete reconstruction, original HDL continuation,
existing compact-array controls and storage-admission regressions pass; three
evidence/rejection tests pass. Raw cache-parent and word-link mutations remain
observable through the earlier controls. Cache-owner deletion/address reuse,
alias/subclass coverage and operational integration remain unqualified.

The [base cache-owner lifecycle controls][array-cache-lifecycle] exercise the
native base constructor, lazy allocator and destructor through test-owned concrete
adapters. Four constructions include two same-address reconstructions with fresh
unallocated state. Retained old caches refuse twice; wrong lengths, foreign
buffers and cross-owner cache aliases refuse twelve times. Native parent/word
links initialize correctly, and original HDL continuation agrees. Three tests
pass. This isolates base-class bookkeeping; deletion or reuse of scope-registered
memory objects and operational allocation behavior remain unqualified.

The [guarded initialized board regression][guarded-memory-board] repeats the
complete three-memory binding and unchanged-array checks on the exact library,
header and array sources used by the scope/storage/cache guard fixtures. The
56 parameters and preceding initialized signal/port/scope bindings also pass.
The same-runtime native memory layout witness and retained guard controls are
checked independently; mismatched runtime sources and missing fault evidence
reject. Three tests pass. This integrates the guards at tick zero, without
claiming later-boundary faults, ordinary memory lifecycle or full transient
qualification.

The [combined memory snapshot preflight][memory-combined] includes memory names
and registered handle/concrete-array identities in complete dense snapshots.
An independent compact stream reconstructs those fields for native scope,
compiled declaration and full array-payload bindings at every snapshot. Across
14 parameter/callback and 13 port/callback startup controls, all three memories
and 23 read ports bind in 64 snapshots and whole-state restoration remains exact.
The built logger reconstructs six native name-change/restoration images exactly:
five full images and one reuse use 689 bytes versus 684 dense bytes, so this
small fixture does not demonstrate storage savings. Eight evidence/rejection
tests pass. Later boundaries, full memory lifecycle and transient qualification
remain open.

The [integrated memory fault preflight][memory-faults] adds five native faults
to complete startup snapshots. A name-byte change affects the memory inventory
and full state while leaving the direct array inventory unchanged. A changed
name pointer refuses memory observation; changed cache/storage pointers and
read-port heads refuse array observation. Each refusal emits zero direct
inventory bytes and rejects the complete snapshot. All five faults restore
the exact complete dense state before controlled termination. Nine memory/
callback controls and 14 parameter/callback regression controls pass on the
same runtime, with independent native-layout evidence and all three compiled
memory bindings. Six retained-evidence and tamper-rejection tests pass. These
are startup controls; later-boundary faults and normal firmware continuation
with this complete observer remain unqualified.

The [native memory fault continuation][memory-fault-continue] exercises all five
paired toggles in two rounds, before and after HDL writes, read-port address
changes and explicit lazy word-cache allocation. Ten faults restore both direct
inventories exactly; eight invalid-pointer observations refuse with zero output.
Wrong-field and unknown-field calls also refuse. Subsequent HDL writes and
read-port output match the original and candidate-disabled runtimes. The
reviewer checks stable memory/array identities across rounds, the expected
payload and cache transitions, and isolated name changes. Three evidence and
tamper-rejection tests pass. This covers the static native fixture; registered
memory deletion/reuse and later complete board boundaries remain unqualified.

The [exact read-port class controls][array-port-class] close an admission gap:
the prior dynamic cast accepted subclasses with uncaptured state. The new
runtime requires the exact supported static read-port class before either
array inventory writes its header. Paused diagnostic replacements preserve
the owner, destination net, address, next link and registered ID. Two exact
base-class replacements pass with only the allocation address changed; two
subclass replacements produce four zero-output dense/compact refusals. All
four replacements restore exactly before execution. The rounds span HDL writes,
read-address changes and lazy cache creation, and original/disabled/enabled
continuation agrees. Temporary diagnostic objects are destroyed and unregistered;
the native functor arena retains their allocations. Three evidence/rejection
tests, the ten-fault memory continuation regression, and existing alias/net/real/
string family refusals pass on this runtime.
Ordinary port allocation/deletion and operational board integration remain open.

The [exact-class initialized board regression][port-class-board] checks the
new read-port guard against all three real board memories, 16,512 logical bits
and 23 read ports. Memory names, native handles, concrete arrays, scope owners,
ranges and per-memory port counts retain their independent compiled bindings.
All preceding initialized parameter/signal/port checks pass. Every runtime
output identity must match the retained exact-class, memory-continuation and
unsupported-family controls; the independent layout witness uses the same
runtime. Three tests cover retained semantic replay, mismatched runtime sources
and missing subclass refusal evidence. These scans stop at tick zero and do
not establish operational fault coverage or full transient cost.

The [selected later memory fault controls][memory-late] extend all five memory
faults to actual execution at 5 us. The bridge observes paused startup and the
first before-step hook at or after that threshold; it increments the native hook
serial while omitting intermediate observations. All five runs reach hook
37,918. Name bytes change only the selected memory field; name/cache/storage
pointers and the read-port head refuse the affected direct inventory and the
complete snapshot. Every fault restores the complete dense state before
controlled termination. The 21 logged snapshots reconstruct exactly and retain
all three memories, 23 read ports and preceding metadata/payload bindings.
Each run retains 18,959 samples through 4.995344691183904 us; every byte of
all 31 signals matches the reviewed normal reference prefix. The sample count
matches half the fault hook serial. The startup callback has finished at the
fault boundary. Four retained-evidence
and rejection tests cover full replay, early/wrong-phase/startup-index faults,
missing refusal/restoration evidence, and truncated/altered waveform prefixes.
These are selected-boundary controls,
not complete trajectory or ordinary post-fault firmware continuation evidence;
unobserved intermediate lifetimes and full transient cost remain open.

The [restored memory fault continuation][memory-continuation] resumes execution
after each selected 5-us memory fault restores the exact complete snapshot.
Further private-state observation is disabled after restoration. All five runs
finish normally at 20 us: all 27,578 samples across 31 signals match the reviewed
reference exactly, as do initialized-model diagnostics and complete firmware
records. Four firmware bus edges occur after each fault, from 7.50128 through
19.50128 us, matching the reference and proving post-fault activity. Five tests
cover retained semantic replay, invalid selected boundaries, missing refusal/
restoration evidence, incomplete termination or summary counts, and absent or
non-monotonic post-fault bus activity. These results qualify the observed
restored-fault outcomes; intermediate and post-fault private-state lifetimes,
continuous full-observer integration and broader rollback acceptance remain open.

The [parameter class admission controls][parameter-class] check exact native
classes before registration reads concrete parameter fields. The observer already
rejected unknown classes during inventory; this guard moves admission ahead of
the registration-time metadata reads as well. Opt-in native factory subclasses
carry extra state while retaining binary/string/real VPI behavior. They remain
in scope ownership but are excluded from the admitted payload registry, so the
complete inventory refuses before its header. Two rounds per unsupported family
produce six zero-output refusals; exact supported classes retain all four fixture
parameters. VPI values and HDL continuation agree with original and candidate-
disabled controls. The string API's embedded-NUL-to-space conversion is preserved;
the existing raw payload fault suite separately covers the underlying bytes.
That 16-field suite passes with 32 exact restorations on the new runtime. Three
retained-evidence/rejection tests pass. Ordinary parameter lifetime changes and
operational board integration of this registration guard remain open.

The [initialized parameter-class board regression][parameter-class-board] binds
all 56 actual board parameters, 1,386 logical bits and 56 raw word pairs on the
new registration-guard runtime. Native scope owners and independent compiled
names, flags, source metadata and values agree. The three memory/array bindings,
23 read ports and preceding initial signal/port checks also pass. Every runtime
output matches the retained parameter class and 16-field fault fixtures; the
memory handle-layout witness uses the same runtime. Three tests verify retained
semantic replay and reject mismatched native source or missing subclass refusal
evidence. This is tick-zero integration, not full transient qualification.

The [complete cached net-board review][cached-net-board-full] now reproduces
the original full assessment exactly, including normal waveform/firmware
comparisons, all faults and state-lifetime checks. It caches only exactly
identical parser inputs and module identities, returning isolated result copies.
The completed review took 3,869 seconds with 310,107 hits and 103,567 misses.
Four cache-behavior tests and one retained receipt/reference test pass; the latter
verifies evidence identity and does not rerun the complete review. This is an
observed review cost, not a general runtime bound or broader rollback acceptance.

The [combined net/fanout controls][net-board] pass the complete 20-us service
fixture, checking 55,156 normal boundaries and up to 1,820 allocated nodes.
Code operands, array ports and queued assignment/primitive destinations bind
to allocated graph identities. Six graph faults restore before controlled
termination: head/foreign-target faults at startup and link/tag/functor/filter
faults at 5 us. Normal controls preserve every waveform sample and firmware
record exactly. The observed capture took 1,272.63 seconds, with 3.832 GB of
logical logs compressed to 4.663 MB under explicit caps. Full evidence is retained
and its manifest verifies; a second semantic review of the retained copy now
reproduces the assessment exactly. The subsequent wire-board capture stopped at its logical log budget; its
incomplete run does not qualify the added wire layer or downstream campaigns.
The [retained failure measurement][wire-budget-failure] records exactly 4 GiB
of logical output after 24,226 complete boundaries, versus 2,659,976 compressed
bytes. Extrapolation to the earlier 55,156 boundaries gives 9.78 GB and can fail
if state growth changes output size. A bounded retry is running with a 12-GiB
logical limit, unchanged 256-MiB compressed limit and 3,000-second per-run timeout.
Three tests verify the isolated capture-limit change and rejection of changed,
exceeded or incomplete budget receipts. Circuit, observers, simulation window,
fault cases and full semantic acceptance checks remain unchanged. The downstream
jobs stopped on their failed predecessor; their campaigns await reviewed recovery.
The signal recovery job now waits for the exact wire process identity and a full
passing assessment. Its gate checks both 31-signal sample comparisons, firmware,
wire-family/population observations, all six startup/later faults and bounded
receipts; actual failed wire evidence and net-only evidence are rejected. After
success it copies and hashes the reviewed artifacts exactly, without claiming a
second semantic replay. The signal capture raises only the logical cap to 16 GiB
and adds the predecessor gate; its original 256-MiB compressed cap, 3,060-second
timeout and full semantic reviewer remain. The initial dense signal projection
adds 1.27 GB to wire output but does not bound changing-state cost. Four tests
pass. Signal capture has not started.

The mux recovery job is queued behind the exact live signal process identity.
Its predecessor gate requires full normal sample/firmware comparisons, complete
wire and signal observations, all three startup/later signal faults and bounded
receipts. Failed and partial evidence cannot start the capture. Retention uses
exact file hashes of the fully reviewed signal result, without claiming a second
semantic replay. The mux producer adds only this gate and a 20-GiB logical cap;
its 256-MiB compressed cap, 3,180-second timeout, modes and full semantic reviewer
remain unchanged. Four tests check the gate, rejection of insufficient evidence,
producer equivalence outside the gate/cap, and bounded receipts. The initial
mux projections are 1.81 GB dense or 4.56 MB unchanged compact, not a bound on
operational growth. Mux capture has not started; stages beyond mux remain stopped.

The [native parameter growth controls][parameter-growth] add six exact
binary/real/string parameters after the first complete inventory, in two rounds.
Registration and normal scope attachment produce fresh increasing IDs and
distinct live pointers; every earlier row stays exact. Eighty-bit unknown/value
storage, real representation and embedded-null string bytes are checked.
Original/disabled/enabled HDL continuation and the existing subclass-refusal
regression pass on the new runtime, with three evidence/tamper tests. This
does not qualify compact growth, late unsupported classes, destruction/reuse
or operational board admission. The running board campaign uses its prior runtime.

The [compact parameter growth replay][parameter-growth-log] runs the unchanged
built C logger on all eight retained native growing inventories. Seven full
frames and one reuse frame reconstruct every byte. Each full frame is larger
than its dense image; reuse reduces total output to 7,669 bytes from 8,548.
Three tests pass, including rejection of stale reuse concealing an allocation
and changed logger/native identities. This closes the retained-fixture logger
replay case, not operational growth/cost or another HDL execution.

The [late parameter subclass controls][parameter-late-class] allocate native
binary/real/string hidden-state subclasses after a successful initial inventory.
Exact class admission rejects registration; normal scope attachment exposes
the unsupported population, so immediate and later observations refuse with
negative status and zero output. Base VPI values and original/disabled/enabled
HDL continuation remain intact. Supported allocation growth passes on the same
runtime, with three retained-evidence tests. Destruction/reuse, compact refusal
transport and operational board integration remain open.

The [public parameter handle-release controls][parameter-handle-release] cover
`vpi_free_object` and `vpi_release_handle` on four binary/wide/real/string
parameters, twice. All 16 calls per run preserve handle identity, scope, size
and VPI value; enabled observation also preserves the entire native parameter
inventory. Original, disabled and enabled HDL continuation matches, and three
retained-evidence/tamper tests pass. Public release suppresses deletion for these
classes. This does not qualify native destruction, teardown or address reuse.

The [complete parameter continuation controls][parameter-continuation] pass all
10 faults at the selected 5-us boundary. Forty-seven snapshots cover all six
compact streams, with complete state restoration and compiled ownership bindings.
Normal execution then resumes through 20 us: all 27,578 samples across 31 signals,
all firmware records and four post-fault bus edges match the original reference.
The last observed bus edge is at 19.50128 us. All six campaign/tamper tests pass;
exact retention and file/source identity checks also pass. These controls observe
private state at startup and the fault boundary only. Continuous private state,
unobserved lifetimes, ordinary deletion/reuse and general rollback remain open.

The 12.5-ns and 6.25-ns drain captures completed in 8,291 and 8,504 seconds,
respectively; the original driver is capturing the 25-ns forced-retry control.
The [complete drain refinement diagnostic][drain-refinement-diagnostic] fails the
unchanged non-growth gate over the full 1.16-ms window. Firmware records match
and every voltage error remains below 10 mV, but errors grow on D1, D2, D3, D5
and WR. D3 grows from 0.548 to 0.621 mV; the WR maximum is about 28 nV. Do not
waive the non-growth requirement. Metadata, receipts and local archive identities
are retained; full waveform/log archives remain local and hashes do not replace
replay. Five metadata/witness/tamper tests pass. Retained neighboring samples
exactly reproduce all ten maxima; brackets span 0.46–11.47 ps, with the data-line
witnesses on falling edges. These witnesses do not establish a cause or justify
waiving the gate. The original full disabled/timing/retry review remains
pending; full-repeat, supply recovery and rollback qualification remain open.

All eight bounded wire captures completed. The [receipt-backed cost report][wire-capture-cost]
records 9,799,026,287 logical bytes and 5,891,260 compressed bytes for enabled
observation, with 1,430 seconds of producer time and 1,887 seconds including
capture/checks. It retains receipts and compressed-log identities, not log
contents or semantic acceptance. Three tests reject incomplete/over-budget
receipts, invalid durations and size mismatches. Original and cached complete
semantic reviews remain in progress; memory peaks and broader bounds stay open.

The independent `cached_wire_board_review.py` candidate reuses parsing only for
identical record sequences and identities, returning isolated copies. It calls
the unchanged complete bounded wire reviewer and checks source, producer and
capture-file hashes before accepting exact JSON assessment equality with the
original review. Four wrapper tests cover isolation, exception restoration,
scalar-type mismatch and evidence tampering. The queued full comparison remains
pending; these tests establish no full wire equivalence or timing bound.

The gate recovery job is queued behind the exact mux process identity. Its
predecessor gate requires complete normal comparisons, firmware equality,
wire/signal/mux observations at every sample boundary, all four mux faults and
bounded receipts. After passing, mux evidence is copied exactly to
`mux-board-reviewed`. Gate capture preserves the 3,300-second timeout and
256-MiB compressed cap, with a 24-GiB logical cap. Four recovery/budget tests
pass, including rejection of incomplete evidence and an AST comparison showing
that only the predecessor gate and logical limit change in capture. The native
gate build outputs match their receipts. Capture and complete review remain
pending; the 665-MB initialized output estimate is not a growth bound.

Arithmetic recovery is queued behind the exact gate process identity. Its
predecessor check requires complete comparisons, firmware equality, every gate
observation, all five gate faults and bounded receipts. Reviewed gate evidence
uses the separate `gate-board-reviewed` destination. Arithmetic preserves the
3,300-second timeout and 256-MiB compressed cap with a 28-GiB logical cap. Four
recovery/budget tests pass; native bridge/runtime outputs match build receipts.
The 1.31-GB initial-state estimate is not a growth bound, and complete arithmetic
capture/review remains pending.

Reduction recovery is queued behind the exact arithmetic process identity.
Its predecessor gate requires full comparisons, firmware equality, every
arithmetic boundary observation, all four faults and bounded receipts. Reviewed
arithmetic evidence uses `arithmetic-board-reviewed`. Reduction keeps its
3,300-second timeout and 256-MiB compressed cap with a 32-GiB logical cap. Four
recovery/budget tests pass, and build outputs match their receipts. The 186-MB
initialized output estimate is not a growth bound; capture/review remain pending.

Raw-wire recovery now waits behind the exact reduction process identity. Its
predecessor gate requires complete comparisons, firmware equality, all reduction
boundary observations, both faults and bounded receipts. Reviewed reduction
evidence uses `reduction-board-reviewed`. Raw-wire capture preserves both
corruption controls, the 3,300-second timeout and 256-MiB compressed cap with
a 36-GiB logical cap. Four tests pass; native build outputs match receipts.
The 159-MB initialized output estimate is not a growth bound. Full raw-byte
capture/review and operational closure of strength-encoding loss remain pending.

Concatenation recovery waits behind the exact raw-wire process identity. Its
predecessor gate requires complete comparisons, firmware equality, every raw-wire
boundary observation, both faults and bounded receipts. Reviewed raw-wire evidence
uses `raw-wire-board-reviewed`. Concatenation preserves all three faults, its
3,300-second timeout and 256-MiB compressed cap, with a 40-GiB logical cap. Four
tests pass, and build files match receipts. The 529-MB initialized output
estimate is not a growth bound; full capture/review remains pending.

Resolver recovery waits behind the exact concatenation process identity. Its
predecessor gate requires full comparisons, firmware equality, all concatenation
boundary observations, all three faults and bounded receipts. Reviewed evidence
uses `concat-board-reviewed`. Resolver capture preserves all three faults, its
3,300-second timeout and 256-MiB compressed cap, with a 44-GiB logical cap. Four
tests pass; build files match receipts. The 261-MB initialized output estimate
is not a growth bound, and complete capture/review remains pending.

The waiting recovery jobs were replaced before capture to avoid a retention-path
collision: existing `wire-board-budget`, `signal-board-budget` and
`mux-board-budget` directories contain initialized-state evidence. Full reviewed
campaigns now use separate `*-board-reviewed` destinations. The common retainer
requires passing full-review flags, unchanged capture receipts and source pins,
and exact source/copied file hashes; existing destinations are rejected without
overwrite. Three tests preserve prior budget reports, reject incomplete evidence
before copying, and prevent a changed copy from receiving a manifest. The active
wire and post-reset captures were not restarted; replacement signal and mux
waiters retain their predecessor gates. Retention still proves identity rather
than a second semantic replay.
These measured costs do not bound additional payload integration. Wire/functor
state, general rollback and startup/supply-recovery qualification remain open.

The [complete coarse drain comparison][drain-coarse] now binds matched 25-ns
exact-tick-only and drain-enabled captures and verifies all 1,427,676 electrical
samples across the full 1.16-ms window as exactly equal. Draining leaves this
coarse trajectory unchanged. This finding does not establish internal scheduler
identity, finer-level convergence or full campaign acceptance; finer captures
and the complete campaign reviewer remain necessary.

The [retained streaming revision][retained-stream] now archives complete raw
waveforms under aggregate logical/compressed byte caps while preserving online
sample comparisons. The [keyboard retention control][keyboard-retention] replays
all three complete 20-us refinements and exactly preserves the earlier results,
including their failed numerical gate. It retained 21.4 MB of raw data in 10.1 MB
of compressed waveforms, plus 1.3 MB of compressed logs, in a 188-second capture
and replay. Capture memory sampling reached about 159 MiB; replay memory and
between-sample peaks are excluded. This closes bounded replayability proof, not
longer-capture capacity, full-repeat execution or numerical convergence.

The [full-window retention benchmark][postreset-retention] extends this to all
three complete 1.16-ms exact-tick captures. Retention and subsequent all-sample
replay preserve the original comparisons and failed gate exactly. Transport took
522 seconds and archive replay 444 seconds. Sampled process-tree RSS reached
about 814 MiB across both stages; preflight hashing and between-sample peaks are
excluded. Raw waveforms and authentic logs occupy 628.5 MB and 120.0 MB compressed,
respectively, within explicit aggregate caps. An independent audit decompresses
all six archives and verifies their original logical identities. Full archives
remain local at explicitly recorded paths. This establishes measured replay
cost for this window; simulator runtime, full-repeat capacity and an exact
memory bound remain unqualified.

The [finite-drive-ramp I8282 controls][i8282-slew] add 144 analytic/SPICE
comparisons under the industrial switching load. Zero-ramp controls reproduce
the earlier edge and propagation results. The 250-ohm/0-pF alternative fails
an edge limit with a 10-ns drive ramp; 125-ohm alternatives fail at 30 ns even
with positive propagation headroom. At 125 ohms, 12 pF and a 10-ns ramp, joint
data/strobe pure-delay maxima fall to 22.2592/42.2592 ns. Resistance switches
instantaneously before the assumed source ramp; this is a conditional driver
model, not measured internal behavior. Actual drive shape, finite disconnect,
Intel enable interpretation and complete device admission remain open.

The [later Intel handbook review][intel-1986-enable] adds a separately inspected
1986 source. Its enable waveform still lacks a distinct measurement threshold;
commercial/EXPRESS and plastic-package conditions cannot resolve the industrial
I8282 convention by substitution. The existing electrical contracts remain
unchanged. Further source work must supply a distinguishing convention or qualify
an explicitly different reference family.

The [U880 output screen][u880-output] rejects both endpoint-only CPU resistance
hypotheses against an independent loaded data-valid condition: even the favorable
0.8-to-2-V portion takes about 340 ns with 100 pF at 4.75 V, beyond the 260-ns
budget before internal delay. Explicit 3-kohm and 4-kohm alternatives pass the
retained RC/DC screens, with bounded remaining internal delay. They do not yet
establish nonlinear I/V, temperature behavior, supply dependence, release timing
or operational admission. The added-capacitance experiment is explicitly a
sensitivity case because the source's capacitance and delay temperatures differ.
ROM alternatives remain open.
The [finite-slew extension][u880-slew] checks both output polarities and retains
joint internal-delay intervals for explicit drive-ramp assumptions. The
4-kohm/10-pF combination is rejected with a 60-ns ramp despite passing the
instantaneous-drive screen. Its 32 SPICE cases agree with the analytic ramp
solution; actual internal slew and release behavior remain unqualified.

The [joint I8282 constraints][i8282-joint] now combine the retained DC, edge,
capacitance, propagation and release checks, with source-evidence replay and
limiting-case indices. For the 125-ohm/12-pF hypothesis, constant internal data,
strobe and disconnect delays must not exceed approximately 26.909, 46.909 and
21.718 ns respectively (use the exact report values for checks). The
250-ohm/12-pF and 250-ohm/30-pF combinations remain rejected regardless of delay.
These intervals assume instantaneous drive switching after a pure transport
delay and cover the retained supply/polarity/leakage cases. They do not resolve
Intel enable thresholds, finite internal slew, untested capacitances, temperature
behavior or device admission.

The requirement table owns physical and integration gaps. Electrical conclusions
below are scoped to the inputs in the linked reports; the core's
[evidence index](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/README.md#qualification-and-retained-evidence)
owns scenario coverage and experiment details.

| Gate | Current evidence | Remaining proof |
| --- | --- | --- |
| Numerical convergence | [Transient-error refinements][transient-error] pass the unchanged full-window reset-release voltage gate with identical observed bus events. The explicit-default control reproduces all baseline waveforms. This is a bounded comparison with ideal external clock/reset. | A [complete no-spool replay][online-stream] preserves the retained absolute-time comparison; a [live three-level RC control][live-stream] also matches stored-waveform comparisons. The [bounded keyboard retention control][keyboard-retention] now establishes replayability and measured cost for the 20-us fixture; the [full-window retention benchmark][postreset-retention] extends measured replay cost to 1.16 ms. Exact resource bounds and simulator/full-repeat capacity remain open. Full-repeat numerical coverage and coupled rollback remain open under the unchanged [numerical gate](keyboard-controller-plan.md#numerical-convergence). Keep the candidate opt-in until those controls pass; physical model admission remains separate. |
| HDL/electrical scheduling | [Combined board controls][net-board] preserve exact normal waveforms/firmware with restored faults across allocated net/fanout graphs, destination cross-references, compact array storage, read-port addresses/links, word-handle caches, typed code operands, scope membership, PC allocation bindings, wait-event heads/history, live threads/scheduler bindings, startup/output callbacks, ports, assignment/primitive payloads, island queues and wire filters. [Standalone force/release controls][island-filter] exercise active masks and links; [thread controls][thread-payload] cover initialized registers/stacks, event waiting, automatic functions and fork/join; [lifecycle controls][thread-lifecycle] cover detached children, wait-fork, cancelled pending threads and deferred deletion. [Wait-event controls][wait-event] bind event heads to waiting threads and cover initialized histories in static and automatic contexts. [Native operand controls][code-operands] reconstruct complete allocated code images from fixed-reference differences with restored faults and unknown-family refusal. [Native scope controls][scope-membership] distinguish actual membership from live-thread lifetime through deferred deletion and disabled pending threads, with automatic-profile refusal. [Native array controls][array-state] cover static four-state storage, read-port state and existing word-handle ownership with restored faults and unchanged continuation; automatic, two-state and callback-bearing profiles are refused. [Board wire observations][wire-board-budget] bind every allocated filter to its graph identity and native class before execution; [lossless wire differences][wire-delta] preserve the dense fixture oracle and restored faults. The [unchanged-board budget][wire-delta-budget] does not establish operational storage or combined runtime. [Native strength-encoding controls][strength-encoding] demonstrate that raw bytes 0x00 and 0x88 share the same high-impedance/zero-strength triplet while native scalar/vector equality distinguishes them. Existing triplet-based wire/filter evidence does not establish exact raw-state coverage; [Native raw wire-cache controls][wire-raw-state] distinguish the collision in driven and forced vec8 storage, with exact restoration and original-runtime output agreement across inline/heap widths. [Native raw-filter growth controls][wire-raw-growth] reconstruct supported allocations after reference initialization through constructor, driven/forced and restored collision states, preserving original-runtime continuation. New rows remain full records and can exceed dense storage. [Compact filter-admission controls][wire-raw-delta-families] reject unsupported allocations after a valid reference without partial output or altered continuation. [Raw-byte differences][wire-raw-delta] reconstruct native cache bytes and hidden collision faults exactly; [full-scan preflight][wire-raw-delta-budget] measures initial board encoding cost without bounding operational growth. [Raw filter admission controls][wire-raw-families] reject real filters and vec4/vec8 subclasses before partial output at startup or after admission, preserving native continuation after refusal. [Initial raw-wire board bindings][wire-raw-budget] match allocated graph/class identities and legacy views while preserving exact cache bytes; scan measurements exclude operational growth and other observers. [Source-extracted switch-helper controls][strength-switch] cover both strength maps and enabled/unknown control states over the native constructor/resolution closure; they do not establish island dispatch or queue coverage. The combined raw-wire observer/reviewer preserves prior views and checks restored hidden-byte faults; operational board validation and other strength-bearing payloads remain open. [The signal ownership contract][signal-contract] separates unfiltered storage, procedural-assignment masks/source links and wire output; [native signal controls][signal-state] preserve constructor state, partial assignment masks, source relinking and unfiltered values through force/release with restored faults. [Family controls][signal-families] refuse automatic/real/string/object storage without partial inventory; [board signal controls][signal-budget] bind static signal storage before time advances. [Lossless signal deltas][signal-delta] reconstruct dense native controls, with [initial-state board measurements][signal-delta-budget]. Operational integration and combined budgets remain open. [The logic ownership contract][logic-contract] distinguishes stateless BUFZ/BUFT forwarding from cached logic and its scheduler ownership; [native mux controls][mux-state] cover idle/queued/executing caches with restored faults and exact continuation. [Direct partial-vector controls][mux-partial] explicitly exercise native data/select dispatch against an independent four-state oracle, including silent cache writes. [Board mux measurements][mux-budget] bind allocated native classes and compiled width totals before time advances; [Lossless mux differences][mux-delta] preserve dense cache/wrapper images and restored faults, with [full-scan board measurements][mux-delta-budget]. [Native allocation controls][mux-growth] reconstruct muxes created after reference initialization through queued/executing states, preserving continuation and restored pending-target faults. Changed-state output and operational integration still need measurement. [Native gate controls][gate-state] cover AND/OR/XOR inversion variants and BUF/NOT input caches with restored faults and queued/executing ownership. [Native family controls][gate-families] reject equivalence/implication and subclasses with extra private state before partial output. [Native gate board measurements][gate-budget] bind allocated classes and compiled family/inversion/width totals before time advances. [Input-path controls][gate-inputs] preserve finite real conversion, nonfinite-to-X behavior and width changes. They reproduce an inherited unequal-width AND/OR discontinuity; board admission requires equal cached widths. [Lossless gate differences][gate-delta] and [input-path replay][gate-input-delta] preserve full snapshots and restored faults; [late-family controls][gate-delta-families] refuse unsupported allocations after reference initialization. [Initial-state budgets][gate-delta-budget] do not bound changing-state output. [Native allocation controls][gate-growth] reconstruct admitted variants created after reference initialization through constructor, queued/executing and drained states with restored faults. Combined cost, board integration and deletion/freed-storage equivalence remain open. [Expression ownership evidence][expression-contract] identifies retained arithmetic operands, reduction partial-write history and strength-bearing concatenation caches. [Native arithmetic controls][arithmetic-state] observe operands, configured widths and fallback X vectors through full/partial writes and restored faults, with original-runtime and independent output agreement. [Arithmetic family controls][arithmetic-families] refuse division, real arithmetic and subclasses with extra private state before partial output. [Initial board arithmetic measurements][arithmetic-budget] bind allocated classes and cache widths to the compiled family/width totals; [lossless differences][arithmetic-delta] reconstruct dense fixture snapshots including restored faults, with [full-scan initial-state measurements][arithmetic-delta-budget]. [Late-family controls][arithmetic-delta-families] reject unsupported allocations after a valid reference without partial dense/difference output. [Native arithmetic allocation controls][arithmetic-growth] reconstruct admitted objects created after reference initialization, including constructor state and restored faults with unchanged continuation. Newly allocated rows can make differences larger than dense images. [Width controls][arithmetic-widths] cover the compiled board widths and both sides of a 64-bit storage boundary with original-runtime output and dense/difference agreement. Operational class/allocation changes, combined cost and integration remain unqualified. [Native reduction controls][reduction-state] observe all six operator caches through partial-first initialization, retained partial writes, resizing and empty-vector reuse, with restored faults and independent/original-runtime output agreement. [Reduction family controls][reduction-families] reject NOR and direct-base subclasses with extra private state before partial inventory. [Initial board reduction measurements][reduction-budget] bind allocated caches to graph/native classes and compiled family totals. Some caches are empty before execution; their initial sizes cannot define operational admission. [Reduction differences][reduction-delta] reconstruct empty/resized caches and restored faults exactly, with [full-scan initial-state budgets][reduction-delta-budget] and [late-family refusals][reduction-delta-families]. Changed-state difference logs can exceed dense images. [Native reduction growth controls][reduction-growth] reconstruct admitted objects allocated after reference initialization through empty/full/partial/resized states and restored faults with unchanged continuation. [Native concatenation controls][concat-state] preserve original-runtime output and independent cache expectations for all input ports, full/partial writes and raw-byte collisions. Restored faults cover caches, each port width and pending output nodes; queued/executing wrapper bindings and distinct unchanged-write scheduling are checked. [Concatenation family controls][concat-families] reject subclasses with additional private state before partial output at startup and after a valid inventory, preserving original-runtime continuation. [Initial concatenation board controls][concat-budget] bind native cache allocations to graph/class records and independently compare compiled family/port-width totals. Pending output nodes and event keys are checked; full-scan timings exclude operational state growth and other observers. [Native concat growth controls][concat-growth] observe newly allocated concat4/concat8 objects before input arrives and preserve existing identities through partial updates, restored faults and queued/executing states, with original-runtime continuation. [Concat differences][concat-delta] reconstruct dense images exactly, including raw collision faults and complete queued/executing records. [Compact growth controls][concat-delta-growth] require full rows for new objects against the immutable reference; their output can exceed dense encoding. The [initial compact budget][concat-delta-budget] measures full scans and unchanged-state output, excluding operational changes. [Compact concat admission controls][concat-delta-families] reject unsupported subclasses before reference output and after a valid reference without partial deltas or altered native continuation. The combined concat capture/reviewer preserves earlier layers and adds class/graph, port-width, pending-node and wrapper checks with restored cache/width/raw-byte faults. Operational board qualification and measured combined cost remain open. The [resolver ownership audit][resolver-contract] identifies retained leaf/branch/root caches, pull state and extension routing, and checks compiled family/port counts against native classes. [Native resolver controls][resolver-state] check tri/tri0/tri1 cache trees and extended input routing against independent cache/output expectations and original-runtime continuation. Restored faults cover raw leaf/branch/root values, pull/port/output/allocation fields and extension links; independent allocation bounds survive pointer/count corruption. [Resolver-family controls][resolver-families] reject tri/extension subclasses and wired-AND/OR families before partial output at startup or after admission, preserving native continuation. [Resolver growth controls][resolver-growth] observe later cores/extensions before input and preserve earlier allocation identity through native propagation and restored faults. [Initial board controls][resolver-budget] bind resolver allocations, cache bounds, pulls and output links to native graph/classes and independently check compiled port/pull totals. [Compact resolver controls][resolver-delta] reconstruct every dense cache/allocation field through callbacks and restored faults; [growth controls][resolver-delta-growth] retain full records for later cores/extensions. The [compact board budget][resolver-delta-budget] includes complete native scans and exact graph-bound reconstruction. Unchanged-state output shrinks, but changing-state fixtures can exceed dense storage. [Compact admission controls][resolver-delta-families] reject unsupported tri/extension subclasses and wired-logic families before partial output, including after valid reference initialization, with original-runtime continuation agreement. [Width controls][resolver-widths] check single-input pull/root aliasing, vector-storage boundaries, clipped partial writes and repeated-write behavior against independent cache/output expectations and original continuation. [Compact width controls][resolver-width-delta] reconstruct the same full native fields and preserve the single-input pull behavior across faults and callbacks. Wider changed-state records can exceed dense storage. [Native strength-input controls][resolver-strength-inputs] cover partial-first clipped initialization, weak/pull/strong/supply inputs and real 0x00/0x88 high-impedance transitions. An independent symmetric-strength oracle agrees with original-runtime scalar resolution; full caches, callbacks and continuation remain exact through restored faults. The combined resolver bridge/reviewer preserves preceding layers and checks graph/class identities, cache bounds and restored cache/allocation-pointer/raw-byte faults; cache widths may change after initialization. [Compact strength controls][resolver-strength-delta] reconstruct the complete dense images through partial-first initialization, competing strengths and real raw high-impedance transitions. [Asymmetric-strength controls][resolver-asymmetric-inputs] check native caches and outputs with a separate raw-scalar oracle validated against the retained original constructor/resolution domain. [Compact asymmetric controls][resolver-asymmetric-delta] preserve those images and continuation through restored faults. Operational campaign qualification and coverage of other raw-producing families remain open. The [raw island ownership audit][island-raw-contract] distinguishes port input/output/scratch storage from scheduled vector-8 payloads and pointer-only island wrappers. Output dispatch precedes scratch clearing, so idle-only evidence cannot qualify temporary vectors; [Native raw island controls][island-raw-state] now observe live scratch during output callbacks and detect restored byte, width and hidden raw collisions in all port vectors, preserving legacy bindings and original continuation. [Raw island admission controls][island-raw-families] reject island, branch and port subclasses before partial output, including after valid admission, with private behavior and original continuation preserved. [Raw growth controls][island-raw-growth] preserve earlier identities through later native allocations, constructor observations and independent idle-cache/output checks with restored first-eligible faults. [Growth callback controls][island-raw-growth-callbacks] observe live scratch before native clearing and restore fixture-owned faults targeted at each allocated port; complete inventories detect unrelated changes. [Native input controls][island-raw-inputs] check partial-first expansion, later merging, clipped writes, weak raw strengths and full replacement across vector-storage widths against independent cache/output expectations and original continuation. [Native strength-input controls][island-raw-strengths] preserve asymmetric and hidden-HiZ input bytes while checking resolved caches and original output against an independent endpoint model, including supply-strength reduction and repeated-output suppression. [Competing-driver controls][island-raw-competing] check ordinary and resistive branches against independent endpoint propagation, including opposite strong drivers, asymmetric strengths and HiZ transitions with restored targeted faults. [Conditional-switch controls][island-raw-conditional] check both enable polarities and resistive variants under 0/1/X/Z imported controls, including independent branch-state expectations and enable-port faults. [Part-select controls][island-raw-partselect] check unequal-width endpoints, low/high offsets and a slice crossing a storage boundary against independent cache/output expectations, with supply strengths preserved and restored targeted faults. [Feedback-enable controls][island-raw-feedback] check history-dependent branch reevaluation and intermediate output emissions for both polarities and resistive variants against original execution and independent expectations. [Compact raw-island controls][island-raw-delta] reconstruct full native images through these inputs, growth, callbacks and restored faults against an immutable reference. New allocations use complete rows; changing-state fixture differences exceed dense storage. [Compact admission controls][island-raw-delta-families] reject island/branch/port subclasses before partial output, initially or after a valid reference, and refuse premature deltas or reference resets. [Initial board controls][island-raw-board-budget] bind every raw port to native graph/classes and legacy topology, independently compare compiled branch/port signatures, and measure full-scan differences with exact reconstruction. Initialization already queues islands; snapshots preserve those flags. Initial-state savings do not bound operational growth or combined cost. The combined raw-island bridge/reviewer retains preceding layers, binds raw vectors to legacy mesh and graph identities, and checks restored input-byte/output-width/raw-collision faults; normal cache widths may change. Operational raw-island campaign qualification remains open. [Raw-assignment controls][assignment-raw] preserve exact pending and synchronously executing vector-8 payloads, lifetime identities and destination ports through initialization and active scheduling. Raw-collision, byte, width and port faults restore before original-equivalent continuation. [Native admission controls][assignment-raw-native] refuse subclasses in initial/later queues and during execution, including virtual overrides that bypass base dispatch. Scheduler-entry tracking closes the retained failing override case. Exact nested dispatch preserves child/parent depth, identities and parent continuation through child deletion. Original and candidate use the same test adapter; production-runtime controls remain separate. [Initial board controls][assignment-raw-board-budget] bind raw assignments to exact queue positions/classes, legacy payloads and allocated receiving nodes, with repeatable full scans. Initial weak-high payloads contain no raw-collision target. The combined capture/reviewer adds byte/width/port controls while preserving earlier layers; operational qualification and combined cost remain open. [Callback ownership evidence][callback-ownership] demonstrates that middle-callback cancellation changes native continuation while complete wire/filter images and list heads remain equal. The pinned source audit identifies ordered lists, deferred deletion, array-word associations, subclass history and executing traversal cursors as separate state; bridge handle referents and optional-field initialization require explicit admission. [Native list controls][callback-lists] observe all admitted owners and ordered exact-base callbacks, including deferred-cancellation nodes, after explicit caller-initialization handoff. User/object/function faults restore; invalid links refuse before output. Active value traversal is refused because stack cursors are outside this observer. [Native family controls][callback-list-families] reject stateful part-select, array-word, whole-array and array-part callbacks until native deletion, including registration after an admitted observation. Unknown wire-owner subclasses refuse even with empty lists. Independent callback-history, array-index and subclass-output expectations preserve original continuation; a known callback survives cancellation and deletion of the unsupported objects. [Native array-word controls][callback-words] bind buffered net-array associations to independently obtained word owners and concrete array identities, preserving dynamic selection and X/Z output against original execution. Word-index and array-pointer faults change only their target fields; invalid next links refuse before output and all faults restore before continuation. VPI base-subobject addresses require native pointer adjustment. [Shared-owner controls][callback-word-shared] exercise native multi-node association lists through an explicit VVP adapter applied equally to original and candidate execution. The compiler artifact and exact rewiring are retained; independent owner bindings, native insertion order and restored faults cover every node. This is native-runtime evidence, not a compiler-generated board aliasing claim. [Registration controls][callback-registration] observe empty lists before allocation, then cover callback-created registration, deferred caller admission after dispatch, ordered growth, cancellation/deletion and fresh lifetime IDs after the list empties. Original callback order and values remain exact; registration during dispatch does not make the new callback run in that traversal. [Nested-dispatch controls][callback-nested] exercise cross-owner and same-owner no-delay writes through three native callback levels. Inventory refuses until the outermost callback returns. Entry/exit values preserve the original shared VPI vector-result overwrite, while independent HDL checks retain each signal value. Quiescent callback identities remain unchanged. [Real-bridge startup controls][callback-board-budget] bind every registered output callback to fully initialized port, signal, function and prior lifetime records, after output seeding. Inventory refuses before admission and complete full scans leave lists unchanged. The dense initial-state output projection exceeds the capture log cap. [Compact-list controls][callback-delta] reconstruct complete native owner/list images from an immutable reference through callback growth, deferred deletion, nested refusal and restored callback/array-word faults. Full native admission scans precede output; repeated reference initialization and premature differences refuse. [Compact family controls][callback-delta-families] reject stateful callback subclasses and unknown owners before reference creation or after admission, until native deletion/destruction, with exact original continuation. [Native owner lifecycle controls][callback-owner-lifecycle] reconstruct additions and removals before/after reference creation, including reference-owner destruction and same-address reconstruction with fresh lifetime IDs. Exact native constructors and filter continuation agree with the original runtime. Placement construction uses test-owned storage; it does not establish board allocation behavior or array-word association removal. Registration from an empty reference exceeds dense encoding in the fixture. [Real-bridge compact budgets][callback-delta-board-budget] preserve initialized callback bindings and exact dense reconstruction while measuring full admission scans and encoding. The unchanged-state projection fits the capture log cap, including reference and timestamp growth. The combined callback bridge/reader preserves all preceding observers, binds every callback to initialized port and prior lifetime identities, and tracks native owner retirement. [Real-board startup preflight][callback-list-preflight] independently rejects callback-only and full inventories for user/object/function/link faults, restores full snapshots, and replays every preceding layer. Normal transient equivalence and changing-state combined cost remain unqualified; the full campaign follows reviewed raw-assignment controls. Capturing suspended traversal and shared result storage, association lifecycle, deep VPI signal metadata/graph bindings and operational integration remain open. Settling fixtures do not qualify oscillating feedback or arbitrary meshes. Wired-logic families are not admitted. [The board thread contract][board-thread-contract] checks absent context/object/event-control state under the compiled profile. Complete post-reset [output-state][postreset-output-state] and [instance-queue controls][postreset-instance-state] preserve waveforms/firmware. [ADC-enabled refinements][postreset-adc] fail non-growing error; [timing localization][adc-timing] and [direct bridge controls][input-tick] isolate history-dependent input-tick truncation. The opt-in absolute-tick candidate passes [bounded board/retry controls][absolute-tick-board]. Its [full post-reset review][postreset-tick] preserves the disabled baseline and firmware across refinements/retry, but still fails non-growing voltage error. Retained firmware comparison isolates changed baseline bus-edge timestamps; peak/output-event excerpts localize timestep-dependent output-time shifts. [Native drain controls][output-drain] reproduce autonomous same-tick work left pending by timed stops; opt-in read/write-phase deferral preserves native autonomous times and input-causality clamping. [Bounded drain controls][output-drain-board] preserve exact normal waveforms and firmware while separating exact-tick arithmetic from output draining; forced retry preserves firmware with sub-microvolt waveform differences. Full post-reset convergence, ADC interaction and full scheduler quiescence remain unqualified. | Callback/fanout and reachable net/payload state integration; reachable detached/deferred-deletion paths; freed-storage equivalence. Resolve remaining full exact-tick error growth and explicitly accept or correct changed baseline timing. Bounded service controls do not qualify electrical power-on, supply recovery or full repeat. Ordering and monotonic time do not prove general rollback; device admission remains separate. |
| Onboard clock | [Reference oscillator screens][clock-acceptance] fail U880 level or timing requirements. | Independently constrained intended-family dynamics and startup-inclusive board qualification. Preserve separate primary К555ЛА3, comparison D100D and reference DL000 conditions. |
| Reset | [C4 source-alternative studies][reset-alternatives] cover isolated exploratory reset behavior. The [full startup setup screen][reset-setup] cannot establish RESET timing because the reference clock lacks qualifying voltage rises. | Installed component identity and coupled reset/recovery qualification; retain the reference default. |
| Device and load admission | [Static endpoint screens][device-endpoints] pass selected conditions; [driver/recovery evidence][serial-path] retains non-unique dynamics and load sensitivity. [Linear bus drivers][bus-device] fail a minimum-supply guarantee. [DC-only alternatives][bus-endpoints] satisfy the tested endpoints; both I8282 candidates fail the independent [loaded switching test][bus-switching]. [Enabled-output replacements][bus-enabled] satisfy DC and loaded edge constraints; [joint capacitance checks][bus-capacitance] reject the weaker candidate with the existing fixture capacitance. [Propagation][bus-propagation] and [release][bus-release] studies bound permissible internal delays within those hypotheses; they do not measure device delays. Intel enable thresholds, internal dynamics and physical capacitance remain open. CPU/ROM alternatives remain unconstrained dynamically; none is admitted. | Independent driver/CPU I/V, switching and reverse-recovery behavior, plus filter/cable/host impedance. Endpoint fitting and firmware agreement cannot admit these models. |
| Independent solver agreement | [Recorded-boundary bus replay][bus-read] reproduces the isolated excess across solvers. | Physical applicability and live coupled behavior; replay agreement cannot identify a specimen fault. |
| Host reception | [Receive-edge][receive-edge] and [service timing][receiver-timing] evidence support the reference's logical reception. | Onboard clock/reset and U856 device conditions remain separate. |
| Evaluator caching | Complete paired [startup][eval-cache] and [recorded bus-read][eval-cache-bus-read] captures are byte-identical. The [live post-reset comparison][postreset-cache] preserves every waveform sample, firmware event and solver/HDL timing record. | Full-repeat live firmware/service controls and paired equivalence. Keep caching opt-in. |

### Physical evidence

Global underside registration remains unqualified. The
[distributed X1/CPU fit](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/distributed-registration/assessment.json)
supports longitudinal scale but leaves transverse scale ambiguous; the
[mounting-hole review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/mount-hole-registration/assessment.json)
cannot distinguish the retained alternatives. Use the
[measurement targets](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/registration-measurements/assessment.json)
for independent constraints, then recheck held-out placement and cross-side correspondence.
A dimension alone does not establish terminal identities or authorize pad moves.

The [EFS drawings](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/efs-form-constraints.json)
provide a shared hole pattern without selecting installed housing form. The
[chamber review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/efs-chambers/assessment.json)
narrows only the comparison specimen. Historical R1 placement and hole mapping
remain unresolved. Alternative package and registration fits live in CAD
`reference/package-reviews/`; preserve them when assessing new evidence.

### Simulator and capture prerequisites

The [input-barrier source argument](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/barrier-state-source/assessment.json)
removes private HDL-queue traversal as a prerequisite for the successful early-return
branch only. The [combined startup-fix controls](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/startup-fixes/assessment.json)
cover a bounded fixture. A [targeted output-recovery control](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-breakpoint-sampled/assessment.json)
exercises a failed breakpoint after HDL advancement while preserving delayed
outputs and the sampled waveform. Neither establishes full startup, supply
recovery, keyboard input perturbations or general rollback. The core's analog
guide owns fault-control evidence and reproduction commands.

The [streaming benchmark](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/keyboard-stream-benchmark/assessment.json)
does not establish full-repeat resource bounds and fails the strict non-growing-error
gate despite voltage differences below the limit. Log-budget enforcement protects
captures from unbounded logs; it does not establish numerical acceptance or bound
total process memory. These software investigations do not depend on resolving
physical board dimensions or installed connector identity.

## Resolve at the desk first

Physical uncertainty and model qualification are open investigations. Follow the
[plan's next-work priorities](keyboard-controller-plan.md#next-work-and-acceptance)
before treating either as a specimen dependency. Exact photo locators, pin-map
candidates and superseded interpretations belong in the CAD evidence manifests,
not a second inventory here.

| Open question | Desk-work route | Residual observation if still ambiguous |
| --- | --- | --- |
| BR1 clock link (schematic: A5 pin 6); remaining physical attachments | Follow overlapping photos; independently check pin numbering and cross-side correspondence | Close-ups showing complete joints; distinguishable continuity readings |
| BR2 reset link (schematic: A5 pin 26); physical end identification | Retain schematic connectivity and the photographed bridge location; constrain only the correspondence between photographed ends and schematic pins | Visible joints or observations that distinguish the two ends; a closed bridge alone cannot do so |
| Output-clock WR/RD discrepancy | Compare complete trace paths and keep published revisions separate | Distinguishable physical connection to the CPU pins |
| Serial output to XT1 host cable | Follow the R10.1/R10.2 output branches through the L1 windings; use `review/connection-review.html` for annotated stops and reference endpoints | Complete joint/trace observations identifying winding ends and cable contacts |
| Discrete pads and underside registration | Resolve R1/R2 terminal correspondence and other discrete leads with independent landmarks; body ends are not hole centres | Hidden lead-entry close-ups and measured dimensions |
| Device models and full-board electrical behavior | Constrain transition-region characteristics and circuit assumptions using independent device evidence; retain separate device condition sets before coupled qualification | Targeted captures only for behavior not constrained by published evidence |
| Specimen ROM and timing | Continue reference qualification with standard S600; keep replacement-ROM identity separate | Repeated ROM reads and raw clock/reset/serial captures with setup details |

Comparison photographs depict another specimen. Register and compare them before
transferring geometry. Named body observations can support a visual model without
establishing electrical pads; do not restore a withdrawn net assignment merely
because nearby traces align.

For eventual specimen observations, record board marking, pin-one orientation and
unmodified bridge state first. Use an unpowered, disconnected board for resistance
or continuity checks, retaining readings and probe locations: populated-circuit
paths can mislead a continuity buzzer. Virtual BR isolation tests establish no
manufacturer procedure for opening physical links. Closed-link baseline evidence
comes before any separately justified opening or injection procedure.

## Recording new evidence

Retain board identity, orientation and pin-numbering basis, bridge/power/cable
state, instrument settings, probe locations, original files and hashes, repeated
readings and unresolved alternatives. Unknown fields remain unknown; ambiguous
continuity does not establish a connection.

Import observations into the CAD evidence manifest and component/route review.
Resolve terminal identity before changing electrical pads or nets; unassigned
visual geometry can remain separate. Regenerate, review both sides, run the
relevant checks and pin compatible museum assets. Preserve superseded evidence
and the reason for changing its interpretation.

[receiver-timing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receiver-timing-review/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[serial-path]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/serial-path/assessment.json
[cpu-bus]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/digital/reports/cpu-bus/summary.json
[device-endpoints]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/device-endpoints/assessment.json
[bus-read]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-read-replay/assessment.json
[eval-cache]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/eval-cache-startup-2ms/assessment.json
[eval-cache-bus-read]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/eval-cache-bus-read/assessment.json
[bus-device]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-device-admission/assessment.json
[clock-acceptance]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-acceptance/assessment.json
[reset-alternatives]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reset-capacitance/generic/assessment.json

[transient-error]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/transient-error-refinement/assessment.json


[postreset-cache]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-cache/assessment.json

[online-stream]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/online-stream-replay/assessment.json

[live-stream]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/live-stream-transport/assessment.json

[live-cosim-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/live-cosim-state/assessment.json

[bus-endpoints]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-endpoint-candidates/assessment.json

[circuit-output]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/circuit-output-state/assessment.json

[bus-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-switching-candidates/assessment.json

[instance-queue]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/instance-queue-state/assessment.json

[postreset-startup]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-startup-fixes/assessment.json

[bus-enabled]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-enabled-candidates/assessment.json

[bus-capacitance]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-capacitance-candidates/assessment.json

[reset-setup]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-host-rising-full-startup/reset-setup-review.json

[postreset-output-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-output-state/assessment.json

[postreset-refinement]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-combined-refinement/assessment.json

[private-hdl-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/private-hdl-board/assessment.json
[private-hdl-sync]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/private-hdl-sync/assessment.json

[private-sync-discovery]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/private-sync-discovery/assessment.json

[postreset-instance-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-instance-state/assessment.json

[private-sync-family-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/private-sync-family-board/assessment.json
[display-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/display-payload/assessment.json

[display-association]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/display-association/assessment.json

[display-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/display-board/assessment.json

[executing-wrapper]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/executing-wrapper/assessment.json

[stop-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/stop-board/assessment.json

[wrapper-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wrapper-board/assessment.json
[postreset-adc]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-adc/assessment.json

[port-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-board/assessment.json
[adc-timing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-adc/timing-localization.json

[input-tick]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/input-tick/assessment.json

[absolute-tick-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/absolute-tick-board/assessment.json

[value-callback]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/value-callback/assessment.json

[startup-callback]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/startup-callback/assessment.json

[output-callback-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-callback-board/assessment.json

[bus-propagation]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-propagation-candidates/assessment.json
[bus-release]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-release-candidates/assessment.json

[startup-callback-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/startup-callback-board/assessment.json

[assignment-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/assignment-payload/assessment.json

[assignment-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/assignment-board/assessment.json
[primitive-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/primitive-payload/assessment.json

[primitive-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/primitive-board/assessment.json

[island-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-payload/assessment.json

[island-filter]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-filter/assessment.json

[island-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-board/assessment.json

[island-filter-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-filter-board/assessment.json
[thread-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/thread-payload/assessment.json

[wait-event]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wait-event/assessment.json

[thread-lifecycle]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/thread-lifecycle/assessment.json

[thread-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/thread-board/assessment.json

[board-thread-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-thread-contract/assessment.json

[scope-membership]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-membership/assessment.json

[wait-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wait-board/assessment.json

[code-operands]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-operands/assessment.json

[array-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-state/assessment.json

[code-binding-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-binding-board/assessment.json

[wire-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-board-budget/assessment.json

[wire-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-delta/assessment.json
[wire-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-delta-budget/assessment.json

[signal-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-source-contract/assessment.json

[scope-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-board/assessment.json

[signal-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-state/assessment.json

[signal-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-families/assessment.json
[signal-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-board-budget/assessment.json

[signal-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta/assessment.json
[signal-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta-budget/assessment.json

[logic-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/logic-source-contract/assessment.json

[mux-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-state/assessment.json

[mux-partial]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-partial/assessment.json

[mux-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-board-budget/assessment.json

[mux-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-delta/assessment.json

[mux-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-delta-budget/assessment.json

[mux-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-growth/assessment.json

[gate-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-state/assessment.json

[gate-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-families/assessment.json

[gate-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-board-budget/assessment.json

[gate-inputs]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-inputs/assessment.json

[gate-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta/assessment.json

[gate-input-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-input-delta/assessment.json

[gate-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta-budget/assessment.json

[gate-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta-families/assessment.json

[gate-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-growth/assessment.json

[expression-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/expression-source-contract/assessment.json

[arithmetic-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-state/assessment.json
[arithmetic-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-families/assessment.json

[arithmetic-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-board-budget/assessment.json

[arithmetic-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta/assessment.json
[arithmetic-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta-budget/assessment.json

[arithmetic-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta-families/assessment.json

[arithmetic-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-growth/assessment.json

[arithmetic-widths]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-widths/assessment.json

[reduction-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-state/assessment.json

[reduction-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-families/assessment.json

[reduction-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-board-budget/assessment.json

[reduction-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta/assessment.json
[reduction-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta-budget/assessment.json
[reduction-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta-families/assessment.json

[reduction-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-growth/assessment.json

[strength-encoding]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/strength-encoding/assessment.json

[wire-raw-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-state/assessment.json

[strength-switch]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/strength-switch/assessment.json

[wire-raw-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-board-budget/assessment.json

[wire-raw-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-families/assessment.json

[wire-raw-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta/assessment.json
[wire-raw-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta-budget/assessment.json

[postreset-tick]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-tick/assessment.json

[output-drain]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-drain/assessment.json

[wire-raw-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta-families/assessment.json

[wire-raw-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-growth/assessment.json

[output-drain-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-drain-board/assessment.json

[code-operand-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-operand-board/assessment.json

[concat-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-state/assessment.json

[concat-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-families/assessment.json

[concat-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-board-budget/assessment.json

[concat-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-growth/assessment.json

[concat-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta/assessment.json
[concat-delta-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-growth/assessment.json
[concat-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-budget/assessment.json

[concat-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-families/assessment.json

[resolver-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-source-contract/assessment.json

[resolver-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-state/assessment.json

[resolver-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-families/assessment.json

[resolver-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-growth/assessment.json

[resolver-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-board-budget/assessment.json

[resolver-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta/assessment.json

[resolver-delta-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-growth/assessment.json

[resolver-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-budget/assessment.json

[resolver-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-families/assessment.json

[resolver-widths]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-widths/assessment.json

[resolver-width-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-width-delta/assessment.json

[resolver-strength-inputs]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-strength-inputs/assessment.json

[resolver-strength-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-strength-delta/assessment.json

[resolver-asymmetric-inputs]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-asymmetric-inputs/assessment.json

[resolver-asymmetric-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-asymmetric-delta/assessment.json

[island-raw-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-contract/assessment.json

[island-raw-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-state/assessment.json

[island-raw-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-families/assessment.json

[island-raw-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-growth/assessment.json

[island-raw-growth-callbacks]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-growth-callbacks/assessment.json

[island-raw-inputs]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-inputs/assessment.json

[island-raw-strengths]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-strengths/assessment.json

[island-raw-competing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-competing/assessment.json

[island-raw-conditional]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-conditional/assessment.json

[island-raw-partselect]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-partselect/assessment.json

[island-raw-feedback]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-feedback/assessment.json

[island-raw-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-delta/assessment.json

[island-raw-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-delta-families/assessment.json

[island-raw-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-board-budget/assessment.json

[assignment-raw]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/assignment-raw/assessment.json

[assignment-raw-native]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/assignment-raw-native/assessment.json

[assignment-raw-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/assignment-raw-board-budget/assessment.json

[callback-ownership]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-ownership/assessment.json

[callback-lists]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-lists/assessment.json

[callback-list-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-list-families/assessment.json

[callback-words]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-words/assessment.json

[array-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-board/assessment.json

[callback-word-shared]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-word-shared/assessment.json

[callback-registration]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-registration/assessment.json

[callback-nested]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-nested/assessment.json

[callback-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-board-budget/assessment.json

[callback-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-delta/assessment.json

[callback-delta-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-delta-board-budget/assessment.json

[callback-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-delta-families/assessment.json

[callback-owner-lifecycle]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-owner-lifecycle/assessment.json

[callback-list-preflight]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-list-preflight/assessment.json

[i8282-joint]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-joint-constraints/assessment.json

[u880-output]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/u880-output-candidates/assessment.json

[u880-slew]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/u880-slew-candidates/assessment.json

[intel-1986-enable]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/intel-1986-enable-review/assessment.json

[retained-stream]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/retained-stream-control/assessment.json
[keyboard-retention]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/keyboard-retained-stream/review.json

[drain-coarse]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-drain-coarse-effect/assessment.json

[postreset-retention]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-retained-stream/review.json

[i8282-slew]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-slew-candidates/assessment.json

[net-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/net-board/assessment.json

[scope-referents]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-referents/assessment.json

[scope-metadata]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-contract/assessment.json

[scope-admission]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-admission/assessment.json

[scope-metadata-native]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata/assessment.json

[scope-metadata-records]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-records/assessment.json

[scope-metadata-bindings]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-bindings/assessment.json

[scope-metadata-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-board-budget/assessment.json

[scope-metadata-compact]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-compact/assessment.json

[scope-compact-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-compact-board-budget/assessment.json

[scope-metadata-combined]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-combined-preflight/assessment.json

[scope-metadata-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-metadata-fault-preflight/assessment.json

[port-referents]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-referents/assessment.json

[port-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-payload/assessment.json

[port-payload-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-payload-board-budget/assessment.json

[port-payload-combined]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-payload-combined-preflight/assessment.json

[port-payload-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-payload-faults/assessment.json

[port-payload-fault-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-payload-fault-preflight/assessment.json

[scope-payload-gaps]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-payload-gaps/assessment.json
[scope-payload-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-payload-gaps/source-contract.json

[scope-signals]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-signals/board-budget/assessment.json

[scope-signal-declarations]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-signal-declarations/assessment.json

[scope-signals-combined]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-signals-combined-preflight/assessment.json

[scope-signal-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-signal-fault-preflight/assessment.json

[parameter-payload]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-payload/assessment.json

[parameter-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-board-budget/assessment.json

[parameter-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-faults/assessment.json

[parameter-board-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-board-faults/assessment.json

[parameter-combined]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-combined-preflight/assessment.json

[parameter-fault-preflight]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-fault-preflight/assessment.json

[cached-net-board-full]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/cached-net-board-full/assessment.json

[wire-budget-failure]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-budget-failure/assessment.json

[memory-metadata]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-metadata/assessment.json

[memory-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-board-budget/assessment.json

[array-admission]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-admission/assessment.json

[array-cache-admission]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-cache-admission/assessment.json

[array-cache-lifecycle]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-cache-lifecycle/assessment.json

[guarded-memory-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/guarded-memory-board/assessment.json

[memory-combined]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-combined-preflight/assessment.json

[memory-faults]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-fault-preflight/assessment.json

[memory-fault-continue]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-fault-continue/assessment.json

[array-port-class]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-port-class/assessment.json

[port-class-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/port-class-board/assessment.json

[memory-late]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-late-controls/assessment.json

[memory-continuation]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/memory-continue-controls/assessment.json

[parameter-class]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-class/assessment.json

[parameter-class-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-class-board/assessment.json

[parameter-handle-release]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-handle-release/assessment.json

[wire-capture-cost]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-capture-cost/assessment.json

[parameter-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-growth/assessment.json

[parameter-growth-log]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-growth-log/assessment.json

[parameter-late-class]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-late-class/assessment.json

[parameter-continuation]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/parameter-continue-controls/assessment.json

[drain-refinement-diagnostic]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-drain-refinements/assessment.json

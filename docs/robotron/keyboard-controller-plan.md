# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes.

## Next work and acceptance

### Desk work — no physical device required

Physical registration, installed connector identity and the museum ROM dump are
not prerequisites for reference emulation. Use standard S600 and explicit model
assumptions. Advance numerical correctness, model applicability and specimen
agreement as separate claims; an unresolved specimen claim must not stop the
other tracks.

| Priority | Work and acceptance |
| --- | --- |
| 1. Combined simulator fixes | Complete private-HDL state coverage and validate the integrated fixes under the acceptance checks below. Native fixtures and pre-execution budgets do not qualify operational board boundaries. |
| 2. Numerical convergence | Resolve the remaining growth in the [full exact-tick refinements][postreset-tick]. Qualify the [same-tick drain candidate][output-drain] with ADC and full post-reset controls, preserving the [bounded board/retry controls][output-drain-board]. Native tests reproduce autonomous HDL events left pending by timed stops; deferring the return to read/write synchronization preserves their native times while retaining input-causality clamping. Preserve no-time-reversal and input/output ordering; native cases do not establish full scheduler quiescence or board convergence. Preserve the [complete coarse drain comparison][drain-coarse]: the 25-ns drain-enabled and exact-tick-only waveforms are exactly equal, so draining leaves that coarse trajectory unchanged. Separate trajectory shifts from interpolation effects, review changed baseline bus-edge timing explicitly, then rerun matched full post-reset refinements under the unchanged gate below. Matching serial output alone is insufficient. |
| 3. CPU/bus and device models | Replace candidates that fail published operating guarantees with explicitly constrained alternatives. Resolve the Intel I8282 enable-measurement convention and preserve the [joint delay constraints][i8282-joint] when choosing internal switching/disconnect delays. The retained intersection rejects incompatible resistance/capacitance pairs and bounds pure transport delays; preserve the [finite-drive-ramp controls][i8282-slew], which reject combinations that passed instantaneous-drive screens. Actual internal drive shape, finite disconnect and enable dynamics remain open. Do not transfer the NEC comparison thresholds to Intel. Preserve the [U880 switching rejection and constrained alternatives][u880-output]; the old endpoint-only CPU drivers fail the independent data-valid screen. Preserve the [finite-slew CPU delay limits][u880-slew], including rejected ramp/capacitance combinations; qualify actual internal drive shape, supply law and release behavior, and distinguish ROM alternatives using independent I/V and switching constraints before integration. Preserve source test conditions and validate independent conditions where available; static endpoint agreement does not establish dynamics or specimen calibration. |
| 4. Longer capture qualification | Establish runtime, memory and retained-evidence budgets for longer streaming captures, using explicit log caps. Preserve every sample comparison and enough evidence to review failures. Use the [capped retention transport][retained-stream] and preserve its [bounded keyboard replay and cost controls][keyboard-retention]. Preserve the [complete 1.16-ms retained replay and cost audit][postreset-retention], which exactly reproduces the original comparisons and failed gate. Its measured costs cover replay of existing captures; preflight hashing, exact peaks, simulator runtime and full-repeat capacity remain separate. Raw hashes alone do not provide waveform replay. |

Use the core's `analog/postreset_drain_capture.py` and
`analog/postreset_drain_review.py` for full post-reset drain qualification.
Keep the exact-tick-only control separate from the drain-enabled refinements;
the producer requires the retained bounded drain assessment and preserves the
complete ADC-enabled window. A completed capture is not a passing convergence gate.

### Combined simulator acceptance

1. **Finish combined board validation.** Integrate lossless wire payloads with the [passing combined net/fanout controls][net-board],
   preserving the [passing compact-array board controls][array-board]
   and [combined code-operand controls][code-operand-board]
   and [scope membership controls][scope-board] alongside PC-binding, wait-event, thread/scheduler,
   island/filter/queue, primitive/assignment, callback, port and wrapper/stop/display
   controls. Validate complete scope hierarchy, empty scopes and actual membership;
   live-thread identity alone does not establish membership. Preserve the [native
   scope metadata/referent counterexamples][scope-referents]: membership images
   miss time units, source-line metadata and internal object membership even when
   those fields affect VPI results. Establish their applicability and coverage
   under the admitted profile; distinguish injected corruption from ordinary
   runtime writes. Use the [scope metadata ownership contract][scope-metadata]
   to register initialized scopes and internal objects before observation; refuse
   foreign pointers before casts or dereferences. Preserve the [native scope
   admission controls][scope-admission] and their zero-output root/intern/parent
   and missing-child refusals, restored continuation and existing membership/
   signal controls. Preserve the [native scope metadata controls][scope-metadata-native]:
   fourteen field/ordering mutations and eight zero-output refusals per round,
   exact restoration, automatic-scope refusal and original HDL continuation.
   Preserve the [lossless metadata record controls][scope-metadata-records] and
   their strict malformed-image/semantic checks. Preserve the [native metadata
   identity bindings][scope-metadata-bindings] to scope traversal and admitted
   signal handles, including omitted-ownership rejection and exact restoration;
   extend binding to the remaining internal objects during operational integration.
   Use the [initialized board metadata inventory and budget][scope-metadata-budget]:
   32 scopes, 1,932 registered objects and 18 admitted bridge signals bind, but
   1,884 other object identities still require payload/ownership qualification.
   Dense metadata/reference repetition projects to 11.25 GB for the earlier
   boundary count. Preserve the [native compact metadata controls][scope-metadata-compact]:
   complete scans, exact byte comparison, explicit sequence/time records and
   exact dense reconstruction through faults and restoration. Preserve the
   [initialized compact board budget][scope-compact-budget]: all 128 images
   reconstruct exactly, with 106,546 compact versus 6,527,040 dense bytes.
   The 12.90-MB longer-window projection assumes unchanged bodies; qualify
   native peak memory and changing-state cost. Preserve the [combined metadata
   startup preflight][scope-metadata-combined]: dense native comparisons, compact
   logging and reconstructed scope/signal ownership across the ten preceding
   startup faults. Preserve the [scope-specific startup faults][scope-metadata-faults]
   for time units, source line, function type/width/initial value and foreign
   intern-pointer refusal, including exact field changes, complete restoration
   and the ten prior regressions. Qualify later boundaries and normal transient
   integration after the pinned campaigns. The prepared
   `analog/scope_metadata_board_capture.py` and `scope_metadata_board_review.py`
   are queued after full typed-signal validation; require their complete normal
   sample/firmware comparisons and all prior-layer reviews before accepting them.
   Qualify operational integration and static ownership lifetime; scope
   deletion/address reuse, internal-object payloads and later function-field
   execution coverage remain open. Close the [native port-bit payload gap][port-referents]:
   VPI bit order changes while scope identity images remain identical. Guard
   port/bit ownership and vector size before dereference, capture their fields,
   and establish deferred net-reference initialization before reading it. Preserve
   the [guarded port payload controls][port-payload]: native allocation/readiness
   tracking, bounded names, ordered bits, nonnull net bindings and zero-output
   malformed-vector refusals. Qualify remaining field/subclass/lifecycle cases
   and actual board coverage/cost before integration. Preserve the
   [initialized board port bindings and budget][port-payload-budget]: all 317
   ports and 875 bits match compiled declarations and independent scope owners.
   Dense repetition projects to 4.83 GB; qualify compact storage and changing
   state before adding this layer to the operational campaign. Preserve the
   [combined compact port startup controls][port-payload-combined], including
   dense native equality, decoded declaration/ownership checks and both prior
   scope and typed-signal regression suites. Preserve the
   [native port field faults][port-payload-faults]: index/direction/bit-index
   changes and zero-output width/parent/name/net/readiness refusals, with 18
   exact restorations and original continuation. The injected readiness guard
   does not cover actual early-resolution execution. Preserve the
   [port-specific board startup controls][port-payload-fault-board]: all nine
   native fields, four callback controls and ten scope/callback regressions pass,
   with complete-state restoration and all 317 ports/875 bits bound in every
   snapshot. The prepared `analog/port_payload_board_capture.py` and
   `port_payload_board_review.py` are queued after complete scope-metadata
   validation; the predecessor must include both normal comparisons, all faults
   and complete compact reconstruction at every boundary. Require the port
   campaign's own full waveform/firmware comparisons and semantic replay before
   accepting operational qualification. Close the remaining
   [scope-owned payload gaps][scope-payload-gaps]: unadmitted signal signedness,
   binary parameter bits and memory names change VPI results while the five
   tested scope/reference/signal/port/array images remain identical. The earlier
   initialized board census leaves 633 signal handles, 56 parameters and three
   memories outside the bridge-signal and port bindings; existing array contents
   coverage does not cover every memory field. Follow the
   [remaining payload source contract][scope-payload-contract]: register exact
   initialized families before dereference, join all scope objects to native
   payloads, capture bounded names/values/metadata, and qualify lazy caches and
   lifetime changes. Preserve the [native bounded memory-name controls][memory-metadata]:
   independently registered memory handles, concrete array pointers and name
   allocations join guarded scope-object identities. Two name changes become
   visible while earlier array payloads remain equal; changed/foreign name
   pointers and missing/duplicate/foreign intern ownership refuse before output.
   Restoration and original continuation pass. Preserve the
   [initialized board memory binding and budget][memory-board-budget]: all three
   memories join native scope object handles, concrete array pointers and compiled
   names/ranges/widths/read-port counts, covering 16,512 bits and 23 read ports.
   A same-runtime native layout witness prevents cross-linking the identically
   shaped register banks. Names and complete array images remain unchanged.
   The 283-byte metadata image projects to 31.2 MB and 17.6 seconds over the
   earlier snapshot count; this excludes growth, other observers and review.
   Preserve the [array traversal/storage admission controls][array-admission]:
   guarded scope membership precedes traversal casts, and registered exact static
   four-state storage validates dimensions, cell buffers and wide-word pointers
   before observation. Two rounds give 36 zero-output dense/compact refusals and
   18 exact restorations, preserving valid wide writes and original continuation.
   Destruction/address reuse and subclass refusal are exercised for storage.
   Preserve the [lazy array-cache admission controls][array-cache-admission]:
   register allocation pointers/lengths and validate them before cache reads;
   validate read-port heads before output headers. Foreign, shifted and missing
   cache bases and foreign heads give 16 zero-output dense/compact refusals
   across two rounds, with eight exact restorations. Explicit VPI indexing
   allocates once; observation does not. Existing cache-parent/word-link fault
   images remain observable. Preserve the [base cache-owner lifecycle controls][array-cache-lifecycle]:
   native base allocation/destruction with test-owned adapters, two same-address
   reconstructions, two stale-cache refusals and twelve wrong-length/foreign/
   cross-owner refusals. This does not qualify scope-registered memory deletion.
   Preserve the [guarded initialized board regression][guarded-memory-board]:
   all three memory/array bindings and prior initialized controls pass on the
   exact runtime used by scope/storage/cache guard fixtures. Preserve the
   [combined memory snapshot preflight][memory-combined]: memory names and native
   identities participate in dense full-state equality and exact compact log
   reconstruction. All three memories and 23 read ports bind in 64 snapshots
   across 14 parameter/callback and 13 port/callback controls, with complete
   restoration. Six changing native memory images reconstruct byte-for-byte;
   compact framing is 689 bytes versus 684 dense bytes in that small fixture.
   Preserve the [integrated memory fault preflight][memory-faults]: five native
   memory faults check direct inventories and complete startup snapshots. Name
   bytes change the snapshot; name/cache/storage pointers and the read-port head
   refuse observation. All restore exactly, and 14 parameter/callback regression
   controls pass on the same runtime. Preserve the [native memory fault continuation][memory-fault-continue]:
   ten paired faults restore across HDL writes, read-port address changes and lazy
   cache allocation; subsequent writes and output match original and disabled
   runtimes. These native rounds do not qualify later board boundaries.
   Preserve the [exact read-port class controls][array-port-class]: base-class
   replacements preserve all visible fields except allocation address; subclasses
   carrying additional state refuse dense and compact observation before output.
   Both restore before continuation across writes and lazy cache allocation.
   Preserve the [exact-class initialized board regression][port-class-board]:
   all three memories and 23 read ports bind on the exact runtime outputs used
   by class, continuation and unsupported-family fixtures. This remains tick-zero
   integration; qualify operational observations separately. Preserve the
   [selected later memory fault controls][memory-late]: complete snapshots at
   startup and the first before-step boundary at or after 5 us, with all five
   memory faults detected/refused and exactly restored at hook 37,918. The
   21 snapshots retain all memory/parameter/signal/port bindings. Every retained
   pre-fault sample (18,959 per run, 31 signals) matches the normal reference
   prefix byte-for-byte and its count agrees with the hook serial. Intermediate
   boundaries are omitted, so full transient and lifetime qualification remain
   required. Preserve the [restored memory fault continuation][memory-continuation]:
   all five selected faults resume after exact restoration and complete the
   20-us window. All 27,578 samples across 31 signals and all firmware records
   match the reviewed reference; four bus edges after each fault prove continued
   firmware activity. Five evidence/rejection tests pass. This qualifies these
   restored-fault outcomes, not continuous private-state observation.
   Qualify continuous operational observation, full memory lifecycle, unsupported
   families and operational transient integration before acceptance. Preserve the [complete registered vector-signal controls][scope-signals]:
   all 651 initialized board signals bind to scope objects and allocated nets,
   including the 633 beyond bridge admission. Unadmitted signedness/range changes,
   lazy cache creation and ten zero-output refusals per native round restore
   exactly. The 78,840-byte dense image projects to 8.70 GB; qualify unsupported
   families, lifetime behavior and compact logging before operational integration. Preserve the subsequent
   [complete signal declaration binding][scope-signal-declarations]: all 651
   visible native names/classes/signedness/ranges match the compiled scope paths;
   1,192 compiler-local declarations have no VPI handles under the pinned native
   creation rules. This initial binding does not establish later immutability. Preserve
   the [combined compact all-signal startup controls][scope-signals-combined]:
   dense native comparisons and independent compact decoding retain full
   declaration/owner/net checks for all 651 signals across port and scope fault
   suites. The exact built C logger reconstructs changing native images byte for
   byte. Preserve the [non-bridge signal board faults][scope-signal-faults]:
   signedness/range changes and node/name/cache/scope refusals target a registered
   signal outside bridge admission, leave admitted payloads unchanged, and
   restore complete state. Native paired toggles also preserve original HDL
   continuation. The prepared `analog/scope_signals_board_capture.py` and
   `scope_signals_board_review.py` are queued after the full port-payload stage.
   Require the predecessor's exact normal comparisons, complete port fault suite
   and per-boundary compact reconstruction. Measure the all-signal campaign's
   own full transient cost and require its complete waveform/firmware comparisons
   and semantic review before extending operational acceptance. Preserve the
   [native parameter payload controls][parameter-payload]: initialized binary,
   string and real families, bounded names/string bytes, exact binary storage
   words and real representation bytes. Two rounds capture value/flag changes,
   refuse width and missing/duplicate ownership, restore exactly and preserve
   original HDL continuation. Qualify remaining pointer/family/lifetime faults and integrated operational
   cost before acceptance.
   Preserve the [initialized board parameter binding and budget][parameter-budget]:
   all 56 scope-owned binary parameters match compiled names, flags, source
   metadata and 1,386 logical value bits. The unchanged 8,851-byte image projects
   to 976 MB and 24.0 seconds for the earlier snapshot count; compact/changed-state
   cost and full transient integration remain open. Preserve the
   [native parameter field/pointer faults][parameter-faults]: nine isolated
   value/metadata changes and seven zero-output width/scope/name/wide-storage/
   string-bound refusals per round, with 32 exact restorations and original HDL
   continuation. Preserve the [parameter class admission controls][parameter-class]:
   exact native classes are checked before registration reads concrete fields.
   Diagnostic binary/string/real factory subclasses retain base VPI behavior but
   refuse complete parameter observation before output, twice per family.
   Original/disabled/enabled continuation and the 16-field regression pass.
   Preserve the [native parameter growth controls][parameter-growth]: after an
   initial inventory, two rounds add six exact binary/real/string objects through
   registration and normal scope attachment, growing four parameters to ten.
   Fresh IDs/pointers, unchanged earlier rows, full payloads and original HDL
   continuation pass, as does the subclass-refusal regression on that runtime.
   Three evidence/tamper tests pass. Preserve the [compact growth logger replay][parameter-growth-log]:
   the unchanged built C logger reconstructs all eight native images exactly,
   using seven full frames and one reuse frame. Every full frame exceeds its
   dense image in bytes; the whole stream is 7,669 versus 8,548 bytes because
   of reuse. Three replay/tamper tests pass, including stale reuse hiding a new
   object. Preserve the [late parameter subclass refusals][parameter-late-class]:
   binary/real/string hidden-state subclasses added after a successful inventory
   cause immediate and later negative, zero-output refusals. Base VPI values
   and original HDL continuation remain intact; supported allocation growth
   regresses successfully on the same runtime. Three evidence tests pass.
   Destruction/reuse, compact refusal transport and operational board admission/
   cost remain separate.
   Preserve the [public parameter handle-release controls][parameter-handle-release]:
   both VPI release APIs retain handle identity, scope, size, value and exact
   inventory for binary/wide/real/string parameters in two rounds. All 16 calls
   per run preserve original/disabled/enabled HDL continuation. Three retained
   evidence/tamper tests pass. These APIs suppress deletion for these classes;
   native destruction, teardown and address reuse remain unqualified.
   Preserve the [initialized parameter-class board regression][parameter-class-board]:
   all 56 parameters and their compiled values/owners match on the exact runtime
   used by class and field-fault fixtures; memory and preceding initial bindings
   remain intact. Three evidence/rejection tests pass. Qualify lifecycle changes
   and full transient integration of this guard. Preserve the
   [initialized board parameter fault controls][parameter-board-faults]: seven
   isolated changes reject compiled bindings and three invalid fields refuse
   before output, twice, with 20 exact restorations across all 56 parameters.
   Six absent-family toggles leave the image unchanged in both rounds. These
   controls stop before HDL advance; qualify integrated transient faults and
   continuation separately. Preserve the
   [combined compact parameter preflight][parameter-combined]: all 56 parameters
   bind to native scope owners and compiled declarations in 51 complete snapshots
   across 13 port/callback and ten signal/callback startup controls. Exact native
   comparisons include parameter payloads; compact reuse is log-only. The built
   logger reconstructs 52 retained changing binary/real/string images byte-for-byte.
   Qualify integrated parameter-specific faults, later boundaries, lifecycle and
   full transient cost before acceptance. Preserve the
   [integrated parameter startup faults][parameter-fault-preflight]: seven exact
   isolated raw-value/flag/source/name mutations and three direct/full snapshot
   refusals, each restoring complete state before termination. Four callback
   controls and 13 port/callback regressions pass on that bridge. Qualify later
   boundaries, normal transient comparison and firmware continuation separately.
   The separate parameter continuation campaign is now running all ten faults
   at a selected 5-us boundary on the exact-class runtime. Its prepared reviewer
   checks six compact state streams, exact restoration, complete 20-us waveform
   and firmware equality, and nonempty post-fault bus activity. The bridge builds;
   full capture, semantic review and tamper tests remain pending.
   Independently qualify the prepared `analog/cached_wire_board_review.py`
   against the unchanged original bounded wire assessment. Four wrapper tests
   pass; the queued full review still must establish exact complete assessment
   equality with unchanged captured files, producer and reviewer sources.
   Preserve the [complete cached net-board review][cached-net-board-full], which
   reproduces the original complete assessment with exact-input parsing reuse
   and isolated result copies. Its 3,869-second duration is an observed cost, not
   a general runtime bound. The subsequent wire-board capture exceeded its
   logical log budget. Preserve the [measured wire capture failure][wire-budget-failure]:
   4 GiB at 24,226 complete boundaries, compressed to 2.66 MB. The boundary-count
   projection is 9.78 GB, not a growth bound. The bounded retry uses a 12-GiB
   logical cap with unchanged 256-MiB compressed cap, 3,000-second per-run timeout,
   circuit/window/faults and complete acceptance checks. Its three budget tests
   pass. All eight wire captures have now completed within their caps. Preserve
   the [receipt-backed capture costs][wire-capture-cost]: enabled observation
   produced 9,799,026,287 logical bytes and 5,891,260 compressed bytes, taking
   1,430 seconds in the producer and 1,887 seconds including capture/checks.
   Three cost-evidence tests pass. Original and cached full semantic reviews
   remain running; measured costs do not establish acceptance or growth bounds.
   Re-establish reviewed predecessor
   gates before restarting the downstream campaigns, which stopped after failure.
   The prepared `analog/wire_recovery_gate.py` requires both complete normal
   comparisons, firmware equality, wire observations and all six startup/later
   faults plus bounded receipts. The signal recovery job is queued behind the
   exact live wire process identity. Only a full passing result permits exact
   retained-file copying and the signal capture/review. Its 16-GiB logical limit,
   unchanged 256-MiB compressed cap and 3,060-second timeout remain explicit;
   the additional initial dense signal projection is 1.27 GB, not a growth bound.
   Four recovery/budget tests pass. The mux recovery job now waits behind the
   exact signal process identity. `analog/signal_recovery_gate.py` requires both
   full normal comparisons, firmware equality, wire and signal observations at
   every sample boundary, all three signal faults and bounded receipts. Only a
   passing result permits exact retained-file copying and mux capture/review.
   The mux retry preserves its 3,180-second timeout and 256-MiB compressed cap;
   its logical cap is 20 GiB. Initial mux output projections (1.81 GB dense,
   4.56 MB unchanged compact) do not bound changing-state cost. Four mux recovery/
   budget tests pass; its capture has not started. Preserve existing initialized
   `*-board-budget` reports: fully reviewed campaigns use separate
   `wire-board-reviewed` and `signal-board-reviewed` destinations. The tested
   `analog/reviewed_campaign_retention.py` requires complete passing review flags,
   matching capture receipts/source identities and an exact file copy; it refuses
   existing destinations. Three retention tests pass. The replacement signal/mux
   waiters use these destinations while keeping their exact predecessor gates.
   The gate recovery job now waits behind the exact mux process identity.
   `analog/mux_recovery_gate.py` requires full normal/firmware comparisons,
   wire/signal/mux observations at every sample boundary, all four mux faults
   and bounded receipts. A passing mux campaign is retained separately in
   `mux-board-reviewed` before gate capture. Gate limits are 24 GiB logical,
   256 MiB compressed and the unchanged 3,300-second per-run timeout; the
   665-MB initialized gate-output projection is not a growth bound. Four
   recovery/budget tests pass. Gate capture remains pending. Arithmetic recovery
   is now queued behind the exact gate process identity: `gate_recovery_gate.py`
   requires complete comparisons, firmware equality, every gate observation,
   all five gate faults and bounded receipts before retaining `gate-board-reviewed`.
   Arithmetic uses a 28-GiB logical cap with unchanged 256-MiB compressed cap and
   3,300-second timeout. Its 1.31-GB initial-state output estimate is not a growth
   bound. Four recovery/budget tests pass; capture and review remain pending.
   Reduction recovery is queued behind the exact arithmetic process identity.
   `arithmetic_recovery_gate.py` requires full comparisons and firmware equality,
   arithmetic observations at every boundary, all four arithmetic faults and
   bounded receipts. Reviewed arithmetic evidence uses `arithmetic-board-reviewed`.
   Reduction preserves the 3,300-second timeout and 256-MiB compressed cap, with
   a 32-GiB logical cap. Its 186-MB initialized output estimate is not a growth
   bound. Four recovery/budget tests pass; capture and complete review are pending.
   Raw-wire recovery is queued behind the exact reduction process identity.
   `reduction_recovery_gate.py` requires complete comparisons, firmware equality,
   all reduction boundary observations, both reduction faults and bounded
   receipts before retaining `reduction-board-reviewed`. Raw-wire capture keeps
   both corruption controls, the 3,300-second timeout and 256-MiB compressed cap,
   with a 36-GiB logical cap. Its 159-MB initialized output estimate is not a
   growth bound. Four tests pass; full raw-byte capture/review remains pending.
   Stages beyond raw wire remain stopped pending reviewed predecessors. Audit admitted modules before relying
   on initialization-only invariants. Keep the running campaigns pinned
   while adding later controls.
2. **Close reachable payload gaps.** Correct the
   [strength-encoding loss][strength-encoding]: logical-value/strength triplets
   merge reachable raw bytes that native scalar/vector equality distinguishes.
   Qualify the combined raw-wire capture/reviewer with the [native raw wire-cache controls][wire-raw-state], checking
   operational class/allocation admission and combined cost. Use the
   [raw-byte differences][wire-raw-delta] and [full-scan preflight][wire-raw-delta-budget],
   preserving exact reconstruction of collision faults. Preserve [native post-reference growth][wire-raw-growth]
   and [late unsupported-filter refusals][wire-raw-delta-families] through the
   compact API. New allocations require full rows and can exceed dense storage.
   Preserve the [raw board bindings and initial scan budget][wire-raw-budget];
   initial-state output estimates do not bound changing-state storage. Preserve
   [raw filter admission refusals][wire-raw-families] for both initial and later
   allocations; base-class cache coverage does not admit subclasses.
   Qualify the combined raw-island capture/reviewer (`analog/raw_island_board_capture.py`
   and `analog/raw_island_board_review.py`) after reviewed resolver controls, using
   [initial graph/class bindings and full-scan budgets][island-raw-board-budget]
   and [exact dense/difference reconstruction][island-raw-delta]. Preserve native growth,
   live scratch, raw strength, partial-input, switch and feedback continuation controls;
   retain [compact early/late subclass refusals][island-raw-delta-families], including
   reference-initialization guards and original continuation.
   New allocations need full rows. Changed-state fixture differences exceed dense
   images, so measure operational cost before setting capture limits. Preserve
   legacy topology/filter checks and queued/executing wrapper lifetime bindings.
   Integrate scheduled vector-8 payloads under the
   [source ownership contract][island-raw-contract], preserving the
   [native raw-assignment controls][assignment-raw] for pending and executing
   ownership, raw-collision faults, destination ports and original continuation.
   Qualify `analog/raw_assignment_board_capture.py` and
   `analog/raw_assignment_board_review.py` after reviewed raw-island controls,
   preserving [native subclass-refusal and nested-execution controls][assignment-raw-native].
   Use scheduler-entry tracking: a virtual override can bypass the base method.
   Preserve the [initial queue/graph bindings and scan budget][assignment-raw-board-budget];
   measure operational populations and combined cost. Startup byte/width/port
   faults must restore before termination. Native raw-collision controls remain
   separate unless operational captures demonstrate a collision-eligible payload. Preserve the
   [source-extracted switch-helper controls][strength-switch] while qualifying
   actual island dispatch and other producers; helper closure alone does not
   establish complete state coverage. Keep running
   campaigns pinned; add a subsequent runtime/reviewer revision. Integrate the [native signal controls][signal-state]
   under the [signal ownership contract][signal-contract], preserving the tested
   [unsupported-family refusals][signal-families]. Use the [validated signal deltas][signal-delta]
   and [measured delta budget][signal-delta-budget], then validate operational bindings,
   state growth and actual combined capture/review cost.
   Integrate the [lossless mux differences][mux-delta] and
   [direct partial-vector controls][mux-partial-delta], using the
   [full-scan budget][mux-delta-budget]. Measure actual changed-state output and
   combined cost: changed fixture images can exceed dense encoding. Preserve
   full native scans, queued/executing wrapper identities and the
   [native post-reference allocation controls][mux-growth]. Validate operational
   class/allocation changes against the admitted board profile. Use the [native gate controls][gate-state] and [input-path controls][gate-inputs],
   preserve [native post-reference allocation controls][gate-growth], and integrate
   the [lossless gate differences][gate-delta] and [input-path differences][gate-input-delta] under the
   [logic ownership contract][logic-contract], using the [full-scan budget][gate-delta-budget].
   Preserve [late unsupported-allocation refusals][gate-delta-families]. Measure actual combined output
   and runtime before changing capture limits. Keep the demonstrated unequal-width
   AND/OR discontinuity outside board admission until corrected; current cached
   widths must remain equal. Preserve the [native subclass refusals][gate-families]
   when admitting board classes; retain class/graph bindings for
   stateless BUFZ/BUFT without inventing payload fields. Bind the
   [native arithmetic/comparison controls][arithmetic-state] at operational board boundaries,
   preserving the [initial class/width bindings][arithmetic-budget] and
   [unsupported-family refusals][arithmetic-families]. Integrate the
   [lossless arithmetic differences][arithmetic-delta] under the
   [measured full-scan budget][arithmetic-delta-budget], preserving
   [late unsupported-family refusals][arithmetic-delta-families] and
   [native allocation-growth controls][arithmetic-growth]. Measure operational
   class/allocation changes and changing-state output; new objects can make
   fixed-reference differences larger than dense images, and the
   unchanged-board projection is not an operational storage bound. Preserve the [board-width and storage-boundary controls][arithmetic-widths];
   re-audit width admission when the compiled profile changes.
   Integrate the [native reduction controls][reduction-state] using the
   [initial class bindings and full-scan budget][reduction-budget], preserving
   [native subclass refusals][reduction-families]. Use the [lossless differences][reduction-delta]
   and [full-scan budget][reduction-delta-budget], preserving
   [late unsupported-allocation refusals][reduction-delta-families] and
   [native allocation-growth controls][reduction-growth]. Validate operational
   class/allocation changes and measure changing-state output and combined cost.
   Initial empty caches may acquire widths after input arrives; preserve
   empty/full/partial operand history without freezing initial vector sizes. Preserve the [compact early/late concat subclass refusals][concat-delta-families].
   Qualify the combined concat capture/reviewer with [exact concat differences][concat-delta], preserving
   [compact native allocation growth][concat-delta-growth] and complete event rows,
   then validate the [native concatenation controls][concat-state] at operational
   boundaries using the [initial board bindings and scan budget][concat-budget]
   under the [expression ownership contract][expression-contract].
   Preserve exact concat8 bytes, port widths, assembled caches and queued/executing
   output-node bindings. Use the [full-scan compact budget][concat-delta-budget] to preflight capture
   limits, then measure combined changing-state cost. New allocations require full
   records and can exceed dense storage.
   Qualify resolver state at operational boundaries using the core's
   `analog/resolver_board_capture.py` and `analog/resolver_board_review.py`
   after reviewed concat controls. Preserve [exact compact reconstruction][resolver-delta],
   [allocation growth][resolver-delta-growth], [family refusal][resolver-delta-families],
   and [asymmetric input/continuation controls][resolver-asymmetric-delta]. Bind
   cache allocations, pulls, output/extension links and native classes to the graph;
   permit cache widths to change. Restore cache, allocation-pointer and raw-byte
   faults before termination. Measure changing-state output and combined cost:
   [initial-state budgets][resolver-delta-budget] are not operational bounds.
   New allocations need full records and compact output can exceed dense storage.
   Integrate [complete admitted callback lists][callback-lists] under the
   [ownership contract][callback-ownership]. Preserve explicit caller handoff,
   ordered membership, cancelled nodes until native deletion and refusal during
   active value traversal. Preserve [native callback-family refusals][callback-list-families]
   before and after registration, through cancellation and native deletion;
   unknown owners must refuse even with empty lists. Preserve [native array-word bindings][callback-words]
   and restored index/pointer/link controls, including the concrete array pointer
   adjustment from VPI handles. Preserve [shared-owner native lists][callback-word-shared]
   with an explicitly recorded test adapter; those controls do not establish
   compiler-generated aliasing on this board. Preserve [native registration growth][callback-registration],
   including callback-created registration, deferred handoff, native callback order
   and fresh lifetime IDs after deletion. Preserve [nested-dispatch refusals][callback-nested]
   through complete unwinding and native shared-result overwriting. Suspended
   traversal and shared VPI result storage are not captured. Qualify association
   lifecycle and actual board cost before integration. Preserve [initialized bridge bindings and scan budgets][callback-board-budget].
   The dense initial-state projection exceeds the current capture log cap. Use
   [lossless compact lists][callback-delta] with full-scan preflight, preserving
   [compact early/late family refusals][callback-delta-families] and
   [real-bridge compact budgets][callback-delta-board-budget]. Preserve
   [native owner lifecycle controls][callback-owner-lifecycle], including
   pre/post-reference allocation, destruction and fresh IDs at reused addresses.
   Qualify `analog/callback_list_board_capture.py` and
   `analog/callback_list_board_review.py` after reviewed raw-assignment controls,
   preserving the [real-board startup fault preflight][callback-list-preflight].
   Measure changing-state combined cost and normal waveform/firmware agreement;
   startup-only controls do not qualify a transient campaign. Preserve exact
   reconstruction through callback growth, cancellation and faults. Registration
   from an empty reference can exceed dense encoding; initial measurements do not
   bound changing-state output. Bind deep VPI signal
   metadata and native graph owners, preserving the [native referent counterexamples][callback-referents]:
   node binding, signedness, range constants and lazy bit-handle caches are not
   covered by callback-list identity. Observe existing caches without allocating
   handles, and restore metadata faults before continuation. Integrate the
   [native signal-handle observer][signal-handles] using the
   [initialized board bindings and scan budget][signal-handle-board-budget]. Integrate
   [native callback-owner links][callback-signal-links] using the [real-board
   cross-bindings and full-preflight budget][callback-signal-board-budget]. Preserve
   registered owner/filter pointer adjustment, deferred cancellation/deletion and
   zero-output refusal of foreign or mismatched referents and active traversal.
   Qualify `analog/typed_signal_fault_capture.py` and
   `analog/typed_signal_fault_review.py` after reviewed callback-list controls.
   Preserve the [combined metadata-fault preflight][typed-signal-fault-preflight]
   and [native fault-API continuation controls][typed-signal-fault-native], including
   exact restoration, wrong-target/field refusal and active-traversal refusal.
   Startup faults alone do not qualify normal transients. Use the [single-scan
   scope validation][signal-scope-scan] and [same-board budget][signal-scope-budget],
   preserving exact reference equivalence, empty admission and automatic-scope
   refusal. Measure changing-state output and combined runtime
   before setting operational limits. Preserve [native family and
   late-admission controls][signal-handle-families], range/index mappings, original
   integer index refusal and fresh IDs for new handles sharing a live node.
   Handle deletion and automatic scopes remain unqualified. Preserve zero-output
   foreign-pointer and union-arm refusals. Stateful
   part-select/array callbacks and suspended traversal remain separate. Use the
   [native class inventory][native-classes] to admit families explicitly; names
   alone do not prove field coverage. Preserve class/allocation bindings and
   validate operational class changes.
3. **Preserve ownership and meaningful state.** Include suspended and event-waiting
   threads; track writes before reading unspecified flags/registers. Enforce the
   [compiled thread contract][thread-contract] and re-audit contexts, object stacks,
   event controls and storage families when the compiled profile changes. Keep
   native lifecycle controls for paths absent from this board, including detached
   children, wait-fork and callback-driven deferred deletion. Freed-storage
   equivalence remains separate. Use the scoped continuation argument for overwritten
   callback temporaries and the input-barrier non-execution argument where applicable.
4. **Validate cross-references and storage.** Bind queued-event, code-operand and
   array destinations to handed-out net identities, preserving fanout order and
   force-helper back-references. Preserve every array word, cached read address,
   port link and existing word-handle ownership without allocating VPI handles
   during observation. Keep unsupported alias/storage/callback profiles refused
   and re-audit admission on profile changes. Distinguish procedural-assignment
   source links from force links and signal storage from filtered output.
5. **Keep compact evidence exact and affordable.** Reconstruct full state from
   compact/delta records, including inactive allocated instructions, initialized
   chunk links, newly allocated objects and corrupted snapshots. Scan every native
   word, port and admitted payload field. Use the retained [wire][wire-budget],
   [graph][graph-budget], [array][array-budget] and [operand][operand-budget] budgets
   to preflight explicit limits, then measure combined capture/review cost and
   operational growth, including later word-handle caches. Unchanged-state output
   projections are not storage bounds.
6. **Qualify continuation and recovery.** Preserve explicit XSPICE initialization.
   Require matched disabled controls, forced rejection, immediate/delayed actual
   state corruption with restoration, internal-state checks and firmware
   continuation. Extend the integrated controls to startup and supply recovery;
   bounded service controls do not establish either or general rollback.

[signal-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-source-contract/assessment.json
[native-classes]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/net-types-board/assessment.json
[thread-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-thread-contract/assessment.json
[wire-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-delta-budget/assessment.json
[graph-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/net-delta-budget/assessment.json
[array-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-compact-budget/assessment.json
[operand-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-operand-budget/assessment.json

Complete private-HDL state coverage and resolve combined-fix error growth. Preflight
resources before long captures; execution cost is a computational dependency,
not a need for specimen hardware. Supply recovery needs its own stimulus and
acceptance checks; service reset injection is not closed-board brownout evidence.
Establish a reset assertion and release under rated supply and qualified clocks
with the published RESET setup/hold limits before claiming a defined restart
after undervoltage. Firmware continuation alone
cannot substitute for an unmodeled CPU state-retention guarantee.

### Deferred — full-repeat execution

Full-repeat numerical captures remain postponed as requested. Streaming
preparation may continue, but does not authorize resuming these runs.
Full keyboard qualification and sufficient retained evidence on this route remain
open.
When resuming, preflight capacity and runtime, then run the reset-release candidate
over complete standard-S600 repeat traffic with matched timestep refinements and
a complete control. Pass the unchanged numerical gate below while preserving
firmware reads and serial behavior over the full-repeat window. Do not shorten
the scenario to fit the current machine. Validate the integrated raw-capture,
comparison and retention tooling on these complete captures; implementation tests
and bounded transport controls do not establish full-repeat acceptance. Extend
forced-retry and opt-in evaluator-cache controls over that window as well.

### Independent evidence — separate from desk qualification

| Work | Next useful evidence and acceptance |
| --- | --- |
| Historical registration | Obtain an independent transverse board-plane dimension or sharper hole-centre evidence using the [measurement targets](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/registration-measurements/assessment.json). Bound picking and PCB manufacturing tolerances, refit and test held-out placement and cross-side correspondence. Existing mounting-hole rims cannot select the retained transverse alternatives. No pad moves before the existing registration gate passes. |
| X1 package identification | Find a primary-specimen view exposing mating or termination chambers and compare it with the detailed EFS drawings. The comparison specimen supports the narrow forms, but its dimensions cannot be transferred by appearance alone. Distinguish plug/socket and mounting form; contact-span agreement cannot select them. |
| Device/load applicability | Seek published constraints that distinguish consequential oscillator, driver or load alternatives as part of desk work. Bench evidence is a fallback for ambiguities those sources cannot resolve; retain indistinguishable alternatives. |
| Other specimen-specific claims | Installed packages, hidden terminal/trace assignments, ROM contents and timing require distinguishing evidence. Request only observations that resolve an ambiguity left by existing photographs and published sources. |

Exhaust existing photographs and published sources first. Repeat an experiment
only for a changed hypothesis or new evidence; do not rerun completed ambiguity
studies as progress toward closure. Findings belong in the
[requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
and linked machine-readable reports.

### Follow-on work — internal prerequisites

| Work | Prerequisite and acceptance |
| --- | --- |
| Physical placements and copper | Accepted registration and individually supported terminal identities; follow the sequence below. |
| Coupled reference qualification | Numerical convergence, coupled rollback checks (including live internal-state and continuation evidence) and device/load admission. Check startup, reset, repeat and supply recovery while preserving firmware behavior. |

## Physical reconstruction sequence

After registration passes:

1. Correct supported placements and recheck routes, cross-side joins, lead exits,
   mating clearance and body/lead envelopes.
2. Resolve primary R1 orientation and numbered hole entries, including its unused
   lead; promote only individually supported A4–R1 SENSE paths.
3. Trace R1 common and sensing-transistor collector branches, resolving terminal
   orientation from package evidence and visible lead entries.
4. Finish remaining bus, data/strobe, supply and clock spans, including L1–XT1.
   Resolve WR/RD against specimen evidence. Resolve BR1/BR2 physical end
   correspondence and geometry.

## Electrical qualification gates

### Numerical convergence

Run three timestep levels (two successive refinements) with identical circuit,
stimulus and model assumptions. Compare absolute time over the whole required
observation window.
Every observed node voltage must differ by at most 10 mV between the two finest
completed levels, with differences not growing from the previous pair. Preserve
firmware reads and serial edges; disabled controls must complete without solver
failure. Do not align traces, exclude failing spans or relax limits to pass.

Preserve failed controls as evidence; they do not satisfy qualification. Keep
precision, state-history and scheduling candidates opt-in until their controls pass.

### Device and load admission

Keep primary К555ЛА3, comparison D100D and reference DL000 conditions separate.
Establish switching-region behavior and pullup loading before admitting an
oscillator replacement. Validate the CPU clock in the startup-inclusive coupled
board, not only an isolated oscillator fixture.

Constrain driver junction capacitance, recovery and reverse operation, CPU/bus
I/V and transitions, and filter/cable/host impedance independently of firmware
agreement. Do not tune a clamp, device or load merely to remove a solver failure.
Waveform features that do not affect receiver decisions or bus timing are
research notes rather than extra gates.

Independent solver agreement checks numerical behavior, not physical accuracy.
Use published constraints first; equivalent-device and representative-load bench
tests are possible fallbacks for consequential ambiguities.

## Constraints to preserve

- KiCad schematic owns components, numbered pins and nets; each PCB variant owns
  its placement and copper. OpenSCAD owns surrounding mechanics. HDL owns chip
  behavior, and identified firmware/emulator sources own software behavior.
- Keep the CAD/evidence authority in `3d-models`, simulation in `dac-emulation`,
  and pinned museum consumers in `dac`. Preserve stable IDs and explicit revisions.
- Keep historical, inferred and proposed geometry and primary/comparison specimens
  distinguishable. Preserve rejected fits and competing connections. Proposed
  routes, proximity and photo-only body observations cannot establish historical
  numbered pads or continuity.
- Regenerate affected KiCad checks, geometry and museum exports together. Preserve
  digital acceptance and source freshness; rerun firmware/HDL comparisons when
  their electrical or behavioral contract changes.
- Preserve the existing coordinate, handedness, package-alignment and provenance
  checks. A clean reference DRC is neither measured fit nor fabrication approval.

Source drawings and photo locators belong in the CAD evidence manifests linked
from the [workflow guide](keyboard-controller-progress.md#authoritative-artifacts).

[scope-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-board/assessment.json

[signal-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-state/assessment.json

[signal-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-families/assessment.json

[signal-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta/assessment.json
[signal-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta-budget/assessment.json

[logic-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/logic-source-contract/assessment.json

[mux-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-state/assessment.json

[mux-partial]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-partial/assessment.json

[mux-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-delta/assessment.json

[mux-partial-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-partial-delta/assessment.json

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

[resolver-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta/assessment.json

[resolver-delta-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-growth/assessment.json

[resolver-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-budget/assessment.json

[resolver-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-families/assessment.json

[resolver-asymmetric-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-asymmetric-delta/assessment.json

[island-raw-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-contract/assessment.json


[island-raw-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/island-raw-families/assessment.json









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

[callback-referents]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-referents/assessment.json

[signal-handles]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-handles/assessment.json

[signal-handle-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-handle-families/assessment.json

[signal-handle-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-handle-board-budget/assessment.json

[callback-signal-links]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-signal-links/assessment.json
[callback-signal-board-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-signal-board-budget/assessment.json

[callback-signal-preflight]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/callback-signal-preflight/assessment.json

[typed-signal-fault-preflight]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/typed-signal-fault-preflight/assessment.json
[typed-signal-fault-native]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/typed-signal-fault-native/assessment.json

[signal-scope-scan]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-scope-scan/assessment.json
[signal-scope-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-scope-budget/assessment.json

[i8282-joint]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-joint-constraints/assessment.json

[u880-output]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/u880-output-candidates/assessment.json

[u880-slew]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/u880-slew-candidates/assessment.json

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

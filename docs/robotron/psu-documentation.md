# PC 1715 PSU documentation

Published guide: [Deutsch / English / Русский](https://ddanila.github.io/dac/docs/robotron-psu/).
Editable pages and the source register live in
[`public/docs/robotron-psu/`](../../public/docs/robotron-psu/).
The museum links the guide from its interior reference area and the power-supply
component detail card. Static pages work without JavaScript and support printing.

## Scope and rights

This edition provides links to the complete German service manual, the schematic
collection, and both PSU placement drawings. It publishes original museum
commentary in three languages, not a complete translation or mirror of the
historical manuals. The originals retain their credits and rights. Age or
abandonment has not been treated as a redistribution licence.

The circuit reference is PC 1715 drawing 56-330-2770-5. Matching it to the museum's
W/M specimen remains unverified. Do not import the private inventory's PSU001
serial number, repair history or identification as evidence about this specimen.

## Source review, 2026-10-19

- Retrieved the service scan from tiffe.de and recorded its SHA-256 and size.
  The PSU chapter is printed pp.93–101, PDF pp.95–103. OCR was used for navigation,
  not as authority for component labels or values. Visually inspected the service
  check pages, including the continuation on printed p.101.
- Inspected the original schematic on PDF p.20, rotating it and enlarging the
  startup/driver sections. Verified the discrete-transistor list and the separate
  12PM/12P paths. Visually inspected PDF pp.18–19 for the two placement drawings.
  Their differences from the schematic must not be silently merged into a BOM.
- Documented the V12/V15 discrepancy in §1.9.8.1. The circuit identifies V15 as
  the switch; V12 belongs to the secondary rectifier group.
- Used INTEGRAL's manufacturer KT818 specification (2011, mirrored by Arbatex),
  ST's TIP35C/TIP36C Rev.5 datasheet and current product page, and onsemi's FJL6920
  Rev.2 datasheet. The Soviet-family candidate is КТ818Б; TIP36C is a modern
  candidate requiring rewiring/mounting review. FJL6920 is a comparison illustrating
  why voltage/current ratings alone do not establish an SU169 replacement.
- The source register distinguishes manufacturer authorship from archive hosting,
  records exact locators and checksums where files were retrieved, and retains
  Ulrich Zander / XEPb.org / Jens Müller credits for the linked supporting archive.

The three pages use the same numerical tables, connector net names, source IDs and
section IDs. Review was one AI-assisted editorial pass, not independent human
technical review. No physical measurement, insulation test, PSU repair or
substitution trial was performed. No component is described as bench-qualified.

## Maintaining the guide

Edit all three language pages together. Preserve net labels and original part
suffixes. Check each changed numerical fact against its cited source; update
`sources.json` when using a different scan or datasheet revision. Keep evidence
status identical in all languages. Do not promote a candidate to a verified
replacement without an identified assembly and attached measurement results.

For publication, build with `DAC_BASE=/dac/ npm run build`, check all three pages
at the `/dac/` prefix as well as both museum entry points, and check mobile table
scrolling, print layout and internal links. The existing Pages workflow publishes
successful main-branch builds; a pushed commit alone does not prove deployment.

## Publication checks, 2026-10-19

- Production build with `/dac/` base: passed (existing large-bundle advisory).
- Existing `ci-shards.spec.js` and `inspection.spec.js`: 8 passed.
- Browser smoke check against the production preview: all three language pages
  returned HTTP 200 with JavaScript disabled; language navigation, local links,
  fragment targets and numerical-table parity passed.
- Both the museum page link and the PSU detail-card link resolved under `/dac/`.
- Desktop, mobile replacement cards and print-media styling were visually
  reviewed. Mobile pages had no document-level horizontal overflow.

These checks establish publication behaviour, not electrical correctness or
replacement qualification. See the source and hardware-review limits above.

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

## Specimen evidence

Owner photographs of PSU002 are preserved with hashes and observations in the
[CAD source register](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/reference/owner-20261019-psu002.json).
The guide includes selected previews. The owner reports PSU002 is otherwise
identical to PSU001, with one BU126 missing. Its schematic position remains
unassigned; this observation does not revise the historical transistor table.
PSU001 comparison photographs visibly confirm the BU126 marking and the matching
heatsink position left empty on PSU002. They do not establish factory population
or qualify BU126 as a replacement for the historical drawing’s transistor.
The connector-board marking, rail labels and comparison provenance are recorded
in `sources.json`.

Use the photographs to correlate placement and visible copper with the original
schematic and placement drawings before assigning designators or transferring
geometry. Hidden connections, circuit identity with the installed museum supply,
and electrical condition remain unverified.

The source register holds scan revisions, checksums and page locators. Preserve
the distinction between schematic and placement drawings, and the service
text's V12/V15 discrepancy. No replacement candidate is bench-qualified.

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

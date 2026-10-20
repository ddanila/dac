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

The guide's [specimen table](../../public/docs/robotron-psu/en.html#specimens)
owns the PSU001/PSU002/PSU003 summary. `sources.json` links canonical CAD registers
for original photographs, identification, owner reports and layout correlations.
Keep shield identifiers separate from PCB serial numbers, and observed population
separate from the reference drawing's part list.

The SVG locators show orientation and selected positions, not production geometry.
Placement correlation does not establish continuity or replacement suitability.

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

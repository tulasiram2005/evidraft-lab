# Build status — 14 November 2026

The Cyanotype Herbarium redesign is implemented and published. This remains a local-first research workspace, not the complete multi-user PAPERLOOM platform.

## Verified release

- All 83 tests pass in GitHub Actions, including HTTP API integration, signatures, persistence, domain rules, and pure specimen geometry.
- TypeScript and production build pass. Dependency audit reports zero vulnerabilities after upgrading Vite to 8.3.5 and Zod to 4.6.6.
- Alegreya, Atkinson Hyperlegible Next, Courier Prime, and Caveat are bundled locally from Fontsource 5.3.0 with their OFL licenses. No runtime external JavaScript or font service is required by the app.
- Custom SVG icons, hash-derived leaf specimens, animated evidence threads, measured 34px line grid, determination slips, seed strip plots, claim ruler, accession seals, and proofreader marks are implemented.
- Manuscript, Specimens, Proofing, and Accessions were inspected through live browser screenshots. A mobile rail overlap discovered during inspection was fixed. A saved accession was verified successfully in the browser.
- Separate metrics from the same run now use separate thread targets and line citations.

Latest source verification: https://github.com/tulasiram2005/evidraft-lab/actions/runs/43587229650
Release build: https://github.com/tulasiram2005/evidraft-lab/actions/runs/43587229657
Live app: https://tulasiram2005.github.io/evidraft-lab/
Reference: https://tulasiram2005.github.io/evidraft-lab/reference-v2.html

## Limits and remaining acceptance work

No real-time co-editing, hosted cloud persistence, member roles, or hosted AI. Browser editions are integrity-hashed but unsigned; the local API supports Ed25519 signatures. The manuscript editor is Markdown. Browser data stays device-local and should be backed up.

Full screenshot coverage after every individual source change, all modal states, and every mobile/dark breakpoint has not been completed. No pixel-perfect equivalence or formal accessibility audit is claimed. The larger original project phase gates remain open.

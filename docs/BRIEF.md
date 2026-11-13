# PROJECT BRIEF 1: PAPERLOOM (working title, run a name-clash check first)

One line: a real-time collaborative research writing workspace where every number in the paper is bound to the immutable experiment run that produced it, and an AI checker verifies the prose against those numbers.

## Why it exists
Researchers copy numbers from notebooks into papers by hand. Runs get re-done, tables go stale, a claim like "improves F1 by 12%" silently stops being true. Co-authors edit in parallel without knowing which numbers are still valid.

## Honest prior art (verify and document in PRIOR_ART.md)
Quarto, Jupyter, knitr and Manubot embed computed values. MLflow, DVC and Weights & Biases track runs. Overleaf and Google Docs co-edit. The difference to prove, not assume: browser-native co-editing, plus an immutable content-hashed run ledger, plus live staleness detection on bound values, plus a claim checker whose arithmetic is deterministic. Do not claim to replace any of those tools.

## Users and jobs
- Student or lab researcher: write a paper with co-authors and never ship a stale number.
- Reviewer or supervisor: open a frozen manifest and see where each number came from.
- Solo builder: push results from a script with one command.

## Features (priority order)
P0
1. Workspaces, members and roles (owner, editor, commenter, viewer), share links with expiry.
2. Documents: rich text with math, citations list, figures, tables. Real-time co-editing with Yjs (TipTap/ProseMirror) over a WebSocket on the API, presence cursors, persistence as incremental updates plus periodic snapshots in MongoDB, version history with restore.
3. Experiment ledger: experiments have keys; runs are immutable, content-hashed (SHA-256 of canonical JSON), with config, seed, metrics, environment, optional git commit, artifacts. Push by REST with a scoped API token (`paperloom push results.json`, provide a tiny Node CLI) or by CSV/JSON upload in the UI.
4. Bindings: inline chips such as `{{run:<id>.metrics.f1 | 3dp}}` or a table bound to a run set. Parse with a small grammar (no eval). A chip shows value, run id, hash and age. If a newer run exists for the same experiment key, the chip turns "stale" with a one-click diff and "rebind to latest" that records who did it.
5. Freeze: creates a signed manifest (document snapshot hash plus every bound run hash), shareable read-only, verifiable from a downloadable bundle.
P1
6. Claim checker (AI): extract numeric claims from prose, match each to a binding, and compute differences deterministically with tools. The model only extracts and explains; arithmetic and comparison are done by code. Output: verified, mismatch, unbound number, ambiguous. Human accepts or dismisses each.
7. Comments and suggestions, resolve threads, reviewer mode.
8. Export: Markdown, LaTeX (generated client side), print-ready PDF via print CSS, and a reproducibility bundle (zip with manifest, runs JSON, hashes).
P2 (stretch)
9. Compare view for two runs; sparkline history of a metric across runs.
10. Atlas Vector Search over the workspace's own docs and run notes for "find where I wrote about X" (this is the MongoDB vector-search skill, keep it small).

## AI layer
Provider abstraction (Gemini free, Groq free, mock). Tools, all read-only and strictly schema-checked: `list_bindings(doc)`, `get_run(id)`, `get_metric_history(experiment_key, metric)`, `compare_values(a, b, mode)`. The model proposes claim spans; code verifies. Golden set of 40 annotated paragraphs (synthetic, labelled) for evals. Prompt-injection cases include malicious text inside run notes and imported CSV cells.

## Data model (Mongo collections)
users, workspaces, memberships, documents, doc_updates (Yjs binary, seq, size cap), doc_snapshots, experiments, runs (immutable, unique on workspace+hash), bindings (derived index per document), claims, comments, api_tokens (hashed, scoped, last-used), freezes, audit_events (hash-chained), jobs. Provide indexes and a reason for each.

## Architecture notes
- API serves REST and a WebSocket path for Yjs. Authenticate the socket on upgrade and re-check membership per document. Cap update size and rate.
- Compaction job merges doc_updates into snapshots (in-process lease, cron-triggered).
- Run payloads over a size limit go to Cloudflare R2; the ledger stores the hash and pointer.
- Rich text rendering is sanitised; binding expressions are parsed, never evaluated.

## Security focus specific to this project
Yjs update validation and size limits; WebSocket authz and origin checks; token scopes (push-only vs read); canonical JSON hashing to prevent hash ambiguity; sanitisation of imported CSV (formula injection) and of rendered HTML; zip bundle verification; share-link entropy and expiry; run immutability enforced at the DB layer (no update endpoints, tested).

## Art direction (starting point)
"A typeset journal with a lab notebook's honesty." Cool grey-white paper `#F6F7F5`, ink `#14181C`, muted ink `#5B6470`, hairline rule `#D5D9DD`, accent oxblood `#8A2B2B` used sparingly for marks and primary actions, evidence states: verified deep teal `#0F6B5C`, stale amber `#B7791F`, broken red `#A3251F`. Dark theme "blueprint night" `#101418` with warm off-white ink. Type: Source Serif 4 for documents, Instrument Sans for interface, Commit Mono for numbers and hashes with tabular figures. Layout: three columns, a narrow ledger rail on the left, a 68-character measure document in the centre, a wide right margin for comments, claim cards and evidence notes aligned to the paragraph they refer to (Tufte-style). Signature element: the "evidence thread", a thin line that connects a bound number to its run row when you hover or focus it. Corners 2px, hairline rules instead of shadows, no cards for the sake of cards. Motion: nearly none; a single soft pulse the first time a chip turns stale. Empty states written like marginal notes. What it refuses to be: a Notion clone, a gradient SaaS dashboard, or a chat UI.

## Seed data and demo story
Seed a synthetic paper ("Lightweight transfer learning for leaf disease classification", clearly labelled synthetic) with 6 experiments, 30 runs, two intentionally stale bindings, one mismatching claim, one unbound number. The demo shows: edit with a second browser, push a new run from the CLI, watch a chip go stale, run the claim checker, freeze, verify the bundle.

## Gap-bridging this project demonstrates
MongoDB and Mongoose or native driver design, indexes, aggregation, Atlas Vector Search; real-time collaboration with CRDTs; WebSocket security; content-addressed immutable data; deterministic-verification AI pattern (LLM extracts, code verifies); background jobs without a worker; CLI tooling; measured performance.

## Measurements to record (real only)
Concurrent editors tested, update latency p50/p95 over WebSocket in a local and a deployed test, compaction ratio, claim-checker precision and recall on the golden set (mock and real provider reported separately), test counts, Lighthouse scores.

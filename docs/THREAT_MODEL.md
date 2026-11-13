# Threat model

Assets: manuscripts, immutable runs, token material, provenance bundles. Actors: local author, reviewer, malicious import, malicious client, compromised hosting account.

| Threat | Boundary | Mitigation | Residual risk |
|---|---|---|---|
| Forged evidence | import → ledger | Strict finite numeric schemas, canonical SHA-256, rehash bundles | Hashes prove integrity, not scientific truth |
| Script injection | imported prose → DOM | React text rendering; no raw HTML | Rich HTML import intentionally unavailable |
| Misleading arithmetic | prose → checker | Explicit binding grammar, deterministic calculation, ambiguous outcomes | Rule extraction is deliberately narrow |
| Data loss | browser → storage | JSON export and validation; clear local-only status | Browser storage can be cleared |
| Unauthorized API write | network → local API | Scoped bearer secret, timing-safe hash comparison, strict origins, body caps | Single-owner API is not multi-tenant auth |
| Tampered bundle | download → reviewer | Recompute run, document, manifest hashes; detached signature for API freezes | Embedded public key alone cannot prove author identity |
| Dependency compromise | registry → build | Exact versions and lockfile; no install scripts | Remote vulnerability audit must run in CI |

Do not expose the development API until authentication and production configuration are verified. No claim of ASVS conformance.

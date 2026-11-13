# Security

This is an educational prototype, not a production multi-tenant service. Do not store sensitive research or personal information until the open security gates are complete. Report vulnerabilities privately through the repository owner's contact channel; do not publish tokens or private data in issues.

Controls: strict payload schema, text-only rendering, deterministic binding parser without eval, hash verification, API scopes, origin checks, request caps, serialized writes and loopback-only default. See docs/THREAT_MODEL.md and docs/REMAINING_WORK.md. No compliance certification is claimed.

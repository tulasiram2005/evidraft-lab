# ADR 001 — runnable core before unavailable infrastructure

Accepted 2026-11-13. Preserve the React/TypeScript stack. Use npm with cached pinned packages because pnpm is broken and outbound DNS is unavailable in the local executor. Keep the workspace offline-capable and the provenance domain independent of UI and storage. Use a Node single-owner API for locally testable import and signed freezes. Do not pretend local storage is MongoDB or tab synchronization is Yjs collaboration. MongoDB, Yjs, production identity and hosted persistence remain release gates until installed and tested.

Free-only: no R2 provisioning or metered API calls. Browser downloads handle bundles. Optional model integration must remain disabled without an explicitly configured free provider. Prefer fewer services over using every free platform.

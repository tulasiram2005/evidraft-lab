# Evidence ledger · 2026-11-13

Only observed results belong here.

| Command / check | Result |
|---|---|
| `node --version` | v22.19.0 |
| `npm run test:domain` | 74 tests passed, 0 failed; includes 14 domain cases, 40 arithmetic cases and 20 malicious-note isolation cases |
| `npm run build` | TypeScript strict check and Vite production build passed |
| Build output | JavaScript 302.32 kB / 89.37 kB gzip; CSS 27.10 kB / 6.47 kB gzip before final refinements |
| `node --import tsx --test tests/api.test.ts` | 1 passed; HTTP integration test blocked by sandbox `listen EPERM` |
| `npm run dev -- --port 5173` | Blocked by sandbox `listen EPERM` |
| `git fetch origin main` | Blocked by executor DNS restriction; GitHub connector writes used instead |
| Package install | Cached exact packages installed offline; install scripts disabled |

The 40 arithmetic examples use four controlled sentence patterns; they are NOT the brief's diverse, human-annotated 40-paragraph model evaluation. The 20 injection examples prove malicious notes remain inert in the deterministic path, not resistance of an LLM. No LLM calls were made.

Not measured: WebSocket concurrency or latency, compaction, real-provider precision/recall, Lighthouse, axe, k6, production restore drill, coverage, ASVS certification. No values are invented for these.

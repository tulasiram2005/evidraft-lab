# Free-only decisions · checked 2026-11-13

No paid subscription, trial, model request or payment method was enabled during this build.

| Service | Current use | Official constraints |
|---|---|---|
| GitHub public repository / Pages | Source and intended static educational demo | Pages on public repos is available with GitHub Free. Published size <=1 GB; soft bandwidth 100 GB/month; soft 10 builds/hour. Static hosting only, not commercial SaaS or sensitive transactions. |
| Render free | Not provisioned | 750 free instance hours per workspace/month; sleeps on inactivity; ephemeral filesystem. Our file-backed API must NOT be deployed there as durable storage. |
| Atlas M0 | Not provisioned | Free tier has shared limits; verify exact current storage/index quotas at setup. No claimed live database. |
| R2 | Not provisioned | Usage-based product with payment-method implications. Excluded from this no-card build; use local bundle download. |
| Gemini / Groq | Not used | No keys or remote model usage; deterministic checks have no per-call charge. |

Sources: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages ; https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ; https://render.com/docs/free ; https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ ; https://developers.cloudflare.com/billing/understand/how-billing-works/

Using every free service would add failure points without solving the central evidence problem. Provision only what a tested feature requires.

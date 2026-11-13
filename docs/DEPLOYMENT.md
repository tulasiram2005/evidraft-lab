# Deployment and local configuration

The browser prototype can be built with `npm ci && npm run build` and hosted as static files. Relative asset paths support GitHub Pages. `docs/index.html` and `docs/assets` hold the inspected build for Pages; source remains in apps/ and packages/.

The local API intentionally binds 127.0.0.1 and is NOT deployed publicly. Do not host the file adapter on an ephemeral filesystem. Migrate to a tested durable repository first.

| Variable | Purpose | Secret |
|---|---|---|
| PUSH_TOKEN | push-only bearer credential, at least 32 random characters | yes |
| READ_TOKEN | read and freeze scope, distinct from push | yes |
| WEB_ORIGIN | exact allowed browser origin | no |
| DATA_DIR | local ledger/private signing key directory | path only |
| PORT | loopback API port, default 3001 | no |
| EVIDRAFT_API | CLI destination, remote destinations require HTTPS | no |

Tokens are never bundled into the web app. Restart the API with new tokens to rotate them. Signing key is generated locally with restrictive file permissions; distribute its public key through an independent trusted channel.

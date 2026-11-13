# Runbook

- Browser data loss: export Workspace backup before clearing storage. Frozen bundles can be checked independently. Full workspace import is pending.
- Corrupt browser state: initialization stops rather than silently resetting; use Download saved data for recovery.
- Multiple tabs: external changes pause local autosave. Export the current tab, then load the saved version. This is conflict detection, not CRDT collaboration.
- API tokens: replace both environment values independently and restart. Never expose `.data` through a static web server.
- Signing keys: back up the key securely; losing it prevents signing as that identity. A new key needs a new trust distribution step.
- API ledger: atomic rename protects against partially written JSON; this is not a multi-process database. Run one API process only.
- Backup: export browser workspace and copy the API data directory while the API is stopped. A full restore drill has not been performed.
- Disable AI: no AI service is enabled in this build.

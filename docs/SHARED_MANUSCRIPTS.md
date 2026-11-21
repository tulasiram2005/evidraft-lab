# Shared manuscripts

Use **Shared manuscripts** in the research desk to sign in. Create a shared copy to publish the local manuscript source to your private cloud workspace. Evidence runs, exports and frozen bundles remain on the device. Copy a member ID from a signed-in account and use **Set role** to grant viewer or editor access. Owners can change roles or remove members.

A save creates a numbered revision. Open sessions check for new revisions every three seconds. An editor with unsaved text keeps their working copy when another editor saves. Copy those edits before opening the new revision and reconciling them.

## Deployment

Apply `supabase/migrations/202611210001_shared_manuscripts.sql` to a dedicated Supabase project. Enable email/password authentication, configure the confirmation redirect to the Pages URL, and set GitHub Actions repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and the public anon key. The release workflow reads them during the Vite build. Keep the service-role key out of the frontend.

## Verification

The visual acceptance workflow tests database roles and stale revision handling in PostgreSQL. It captures app states and the design reference at 375, 768, 1024, and 1440 pixels in light and dark app modes. Download its artifact and open each review.html to inspect the comparisons. Manual approval of visual fidelity and live account verification are separate from the automated checks.

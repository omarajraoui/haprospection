# HA Prospection on Vercel

## What the client receives

Send the client one HTTPS URL and the email and password for their private workspace. They open the URL and sign in. **Prospects** opens on the documented selection. They can review, filter and export from their browser. The client does not need Node.js, access to Vercel or Supabase, a Brave Search account, or a database on their computer.

## Set up the hosted project

1. Create a Supabase project in an EU region near the Vercel function region, which is configured as Paris. In the Supabase SQL Editor, run [the database schema](server/cloud/schema.sql). It creates the private `ha_prospection` schema.
2. Under Supabase Authentication, create and confirm the client's email/password account. Keep public signups disabled. This deployment allows one client email. Set the Supabase project URL and publishable key from the project dashboard.
3. Import the private GitHub repository into Vercel using the Vite preset. Use a Vercel plan that supports commercial use and minutely Cron Jobs. Build settings and the research worker schedule are already in [vercel.json](vercel.json).
4. Add the following **Production** variables under the Vercel project's settings. Keep them server-side. Preview environments should use a separate database and account if they are enabled.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **Transaction pooler** connection string on port 6543, with the database password and TLS enabled (`sslmode=require`). |
| `SUPABASE_URL` | Supabase project URL, for example `https://your-project.supabase.co`. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. The service-role key is unnecessary. |
| `HAPROSPECTION_CLIENT_EMAIL` | Exact email of the confirmed client user in Supabase Authentication. |
| `BRAVE_SEARCH_API_KEY` | Optional. Enables additional web searches alongside `CRON_SECRET`. |
| `CRON_SECRET` | Optional. Set a strong random value if web research is enabled. Vercel passes it to the worker. |

5. Deploy to Production. In a private browser window, confirm that the app starts at the sign-in screen and that `/api/sessions` returns 401 before signing in. Sign in as the client, open a prepared prospect, save a review and reload. Verify the Excel export. Remove the test review by changing it to the appropriate client decision if the account is already in use.
6. With optional live search enabled, launch a mission and check that its activity advances after the next scheduled worker invocation. Run through the [pilot checklist](PILOT.md) before sharing the URL.

## How storage and background research work

Postgres stores saved sessions, evidence, follow-ups and review decisions for the authenticated account. The prepared catalogue is imported when the account first opens the workspace. The hosted setup starts with this catalogue. Existing SQLite files remain local unless their records are deliberately migrated.

When web research is enabled, the app writes tasks to Postgres. The protected Vercel cron endpoint takes pending tasks about once a minute and records the page results as it goes. Work can continue after the client closes the page. Without live search credentials, the prepared catalogue and review workflow are still available.

Keep the client’s sign-in email aligned with Supabase. When revoking an account, disable it in Supabase and remove its hosted sessions in `ha_prospection.auth_sessions` using the account UUID. The application cookie is valid for up to seven days. Logging out revokes the current session.

## References

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase Postgres connection options](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel plan limits](https://vercel.com/docs/plans/hobby)

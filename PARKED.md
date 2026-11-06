# PARKED: WorldVibe

**Parked:** 2026-11-06 (operator-approved project park; see q/docs/project-park-audit-2026-11-06.md)

**Why:** The site returns 404. No visitors. Last deploy Dec 2025. Had an hourly cron. NOTE: this GitHub repo is PUBLIC (its tracked .env.production holds placeholders only).

## How to relaunch
- Vercel project `worldvibe` (`prj_avbsQGefPNsfmwdiPVsdViPUy2Pn`, team `team_pZghJEp29OpgKyuvbmvGC5WD`). Unpause it in the dashboard (Settings, then Pause), or with the Vercel MCP `unpause_project`. Git link: stackcurious/worldvibe. Root dir: repo root.
  - Crons (resume on unpause): `0 */1 * * *` /api/cron/send-reminders
  - Env var names (values in Vercel, not here): `DATABASE_URL`, `DIRECT_DATABASE_URL`, `FROM_EMAIL`, `NEXT_PUBLIC_AMPLITUDE_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_WS_URL`, `REDIS_URL`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`
- Domain: worldvibe.app (renews Oct 2027). The operator is turning auto-renew off at the registrar, so re-register or renew before relaunching.
- Code: this branch `parked-2026-11-06` holds the last working tree, including uncommitted WIP as of 2026-11-06. Every other local branch was pushed too.

## Data
- Supabase `nfbgvzqpmjfpeapxjgxh` (us-east-2) no longer exists: the hostname did not resolve on 2026-11-06. No dump was possible. Upstash Redis not dumped.

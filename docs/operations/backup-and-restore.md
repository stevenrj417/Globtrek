# Backup and restore

## What holds data
| Store | Data | Backed up by |
| --- | --- | --- |
| Supabase Postgres | accounts (auth), profiles, saved trips, saved items, recent views and searches, email subscriptions, hotel/activity catalog tables | Supabase (depends on plan, see below) plus manual dumps |
| Git repository | code, destination catalog (`app/data/*`), curated places, migrations | GitHub |
| Vercel | deploy history, env vars, logs | Vercel |
| Browsers | quiz answers, current result, checklist ticks | not backed up (user's device) |

## Supabase backups
- Check the project's plan in the Supabase dashboard → **Database → Backups**. Paid plans take daily backups and can restore from the dashboard; **the free plan does not include restorable backups**.
- **Open item:** confirm the plan and that daily backups are listed. If they aren't, take a manual dump before launch and weekly after.

### Manual dump
Needs the database password (Supabase dashboard → Project Settings → Database).

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f globtrek-schema.sql
```

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f globtrek-data.sql
```

Store dumps somewhere private (they contain user emails). Delete old dumps on the same schedule as the retention promises in the privacy policy.

### Restore
Restore into a new Supabase project first, check it, then point `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` at it in Vercel and redeploy.

```bash
psql "$NEW_DB_URL" -f globtrek-schema.sql
```

```bash
psql "$NEW_DB_URL" -f globtrek-data.sql
```

## Catalog data
Destination data lives in the repo. To recover, check out the last good commit of `app/data/`. Re-imports: `node scripts/cj/import-booking-feed.mjs --snapshot --destinations <ids>` (needs `CJ_API_TOKEN`) and `node scripts/activities/curate-places.mjs --destinations <ids>` (needs the Google key).

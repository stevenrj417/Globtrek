# Rollback

GlobTrek deploys from `main` on Vercel. Every deploy is kept, so rolling back is instant.

## Fastest: promote the previous deploy
1. Vercel dashboard → `globtrek-potr` → **Deployments**.
2. Find the last good **Production** deploy → **⋯** → **Promote to Production** (or **Instant Rollback**).
3. Check https://www.glob-trek.com/api/health and the quiz → results path.

From the CLI (in `~/Projects/globtrek`):

```bash
~/.local/bin/vercel rollback
```

## Then fix `main`
A rollback doesn't change `main`; the next push would redeploy the bad code. Revert the bad commit:

```bash
git revert <bad-commit-sha>
git push origin main
```

## Database changes
Supabase migrations in `supabase/migrations/` are applied by hand. A code rollback doesn't undo a migration. Write migrations so the previous code still works with the new schema (add columns, don't rename or drop in the same release).

## Launch release markers
- Before public launch: `1be9615` (trip-length date calendar).
- Public launch release: the merge of branch `public-launch` (see `git log`).

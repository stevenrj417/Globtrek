# Privacy requests

Requests arrive at the contact address shown on /privacy (`CONTACT_EMAIL` in Vercel).

## Self-service (signed-in users)
- **See / download:** Account → **Download my data** (`/api/account/export`, JSON of profile, saved trips, saved items, recent views and searches).
- **Correct:** Account → name, home airport, currency; trips can be renamed.
- **Delete:** Account → delete individual trips, or **Delete account** (removes the auth user; database rows cascade).

## Handled by the team
1. Verify the requester controls the email address (reply from that address, or have them sign in).
2. **Email list:** look up `email_subscribers` by email; unsubscribe or delete the row.
3. **Account data for someone who can't sign in:** Supabase dashboard → Authentication → find the user → delete (cascades), after verification.
4. **Logs:** Vercel logs expire on the plan's schedule and aren't indexed by person. Say so in the reply.
5. **Anonymous share links:** they hold no name or email and expire after 90 days; they can't be traced to a person.
6. Reply confirming what was done. Keep a short record of the request date, what was asked and what was done (not the data itself).

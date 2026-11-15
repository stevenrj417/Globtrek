// Turns the account page's Supabase query results into the /api/account response.
// Saved trips and the profile are the point of the page: if either query fails, the
// request fails, so the page never shows "no trips yet" for an account that has trips.
// Saved places, recently viewed and recent searches are extras: a failure there
// (say, a table missing in one environment) leaves that section empty instead of
// taking the whole page down.
const OPTIONAL = { saved: "saved_items", recent: "recent_views", recentSearches: "recent_searches" };

export function accountPayload(user, { profile, trips, saved, recent, recentSearches }) {
  const failures = [];
  const note = (table, result) => { if (result?.error) failures.push({ table, code: result.error.code || null, message: result.error.message || "unknown" }); };
  note("profiles", profile);
  note("saved_trips", trips);
  for (const [key, table] of Object.entries(OPTIONAL)) note(table, { saved, recent, recentSearches }[key]);

  if (profile?.error || trips?.error) return { status: 500, failures, body: { error: "Your account could not be loaded. Try again in a moment." } };
  const list = (result) => (result?.error ? [] : result?.data || []);
  return {
    status: 200,
    failures,
    body: {
      user: { email: user.email, provider: user.app_metadata?.provider || "email" },
      profile: profile?.data || null,
      trips: list(trips),
      saved: list(saved),
      recent: list(recent),
      recentSearches: list(recentSearches),
      unavailable: Object.entries(OPTIONAL).filter(([key]) => ({ saved, recent, recentSearches }[key])?.error).map(([key]) => key),
    },
  };
}

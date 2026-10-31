// /thinking runs the match while its status screen is up and hands the result
// to /results through sessionStorage, so the results page renders without a
// second loading pass.
export const PREFETCH_KEY = "globtrekPrefetchedMatch";

export function takePrefetchedMatches(quiz, destination) {
  try {
    const raw = window.sessionStorage.getItem(PREFETCH_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PREFETCH_KEY);
    const stored = JSON.parse(raw);
    if ((stored.createdAt || null) !== (quiz?.createdAt || null)) return null;
    if ((stored.destination || null) !== (destination || null)) return null;
    return Array.isArray(stored.matches) && stored.matches.length ? stored.matches : null;
  } catch {
    return null;
  }
}

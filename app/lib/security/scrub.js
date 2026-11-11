// Remove anything that looks like contact details before text reaches the logs.
export function scrubMessage(text) {
  return String(text || "")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

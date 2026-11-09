// Booking statuses, in the words the traveler sees.
export const BOOKING_STATUSES = [
  "not_started",
  "opening",
  "opened",
  "filling",
  "filled",
  "needs_attention",
  "ready_to_review",
  "ready_to_pay",
  "user_complete",
  "failed_safely",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  not_started: "Not started",
  opening: "Opening",
  opened: "Opened",
  filling: "Filling",
  filled: "Filled",
  needs_attention: "Needs attention",
  ready_to_review: "Ready to review",
  ready_to_pay: "Ready to pay",
  user_complete: "Marked complete",
  failed_safely: "Stopped safely",
};

export type StatusTone = "quiet" | "progress" | "good" | "attention";

export const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  not_started: "quiet",
  opening: "progress",
  opened: "progress",
  filling: "progress",
  filled: "good",
  needs_attention: "attention",
  ready_to_review: "good",
  ready_to_pay: "good",
  user_complete: "good",
  failed_safely: "attention",
};

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);
}

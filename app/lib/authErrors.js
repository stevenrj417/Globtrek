// Plain-words reasons for a failed email sign-in link, from Supabase Auth errors.
export function emailLinkProblem(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (error?.status === 429 || /rate limit|too many|security purposes/.test(text)) return "Too many sign-in emails were sent just now. Wait a minute, then try again, or continue with Google.";
  if (/signups? not allowed|otp_disabled|signup_disabled/.test(text)) return "New accounts by email are switched off right now. Continue with Google instead.";
  if (/not authorized|email_address_not_authorized/.test(text)) return "Email sign-in isn't available for this address yet. Continue with Google instead.";
  if (/invalid|email_address_invalid|validate email/.test(text)) return "That address doesn't look right. Check it and try again.";
  if (/sending|smtp|magic link email/.test(text) || error?.status >= 500) return "Our email service couldn't send the link just now. Continue with Google, or try again in a few minutes.";
  return "We couldn't send the link. Try again, or continue with Google.";
}

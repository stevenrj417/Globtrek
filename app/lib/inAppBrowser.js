// Social apps open links in their own built-in browser. Google refuses to sign people
// in there ("disallowed_useragent"), so the sign-in sheet steers them to email instead.
const APPS = [
  ["TikTok", /musical_ly|BytedanceWebview|TikTok/i],
  ["Instagram", /Instagram/i],
  ["Facebook", /FBAN|FBAV|FB_IAB|FBIOS/i],
  ["Snapchat", /Snapchat/i],
  ["LinkedIn", /LinkedInApp/i],
  ["Pinterest", /Pinterest/i],
];

export function inAppBrowserName(userAgent = "") {
  return APPS.find(([, pattern]) => pattern.test(userAgent))?.[0] || null;
}

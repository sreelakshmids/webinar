// ── Webinar app configuration ──────────────────────────────────────────────
//
// Deployment settings only. There is deliberately NO session data here — no
// date, title, registration form or joining link.
//
// Those used to live in this file as committed defaults, which meant that with
// nothing published the site cheerfully advertised an invented date. A wrong
// date on a public landing page is worse than no date: people put it in their
// calendar and turn up to nothing. Sessions now come from the admin panel and
// only from there; when none is published the page says so.
//
// NOTE on env vars: process.env.NEXT_PUBLIC_X must be referenced statically
// for Next to inline it into the client bundle — hence the repetition rather
// than a lookup helper.

// Static page copy. Not session-specific and not managed by admins — the
// roadmap this page teaches is the same whichever session is running.
export const PAGE = {
  headline: ["Become a job-ready", "full stack developer."],
  fallbackTitle: "Zeminent webinars",
};

// Canonical paths. This app is its own site on its own domain, so the funnel
// sits at the root — the old /webinar/full-stack-roadmap prefix only existed
// because it used to be a route inside the learner app. The previous paths are
// kept as redirects in next.config.mjs so any link already shared still works.
export const WEBINAR_PATH = "/";
export const THANK_YOU_PATH = "/thank-you";

// This app's own public origin. Social cards, the canonical URL and the
// Event JSON-LD all need absolute URLs, and only the deployment knows what
// its own hostname is.
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_WEBINAR_SITE_URL || "https://webinar.zeminent.com"
).replace(/\/+$/, "");

// The main Zeminent learner site. This app used to live inside it, so what
// were internal routes ("/", "/#curriculum") are now cross-origin links and
// have to be absolute. Never hardcode a localhost here — set
// NEXT_PUBLIC_ZEMINENT_URL per environment (http://localhost:7000 in dev).
export const ZEMINENT_SITE_URL = (
  process.env.NEXT_PUBLIC_ZEMINENT_URL || "https://learning.zeminent.com"
).replace(/\/+$/, "");

/** Absolute URL for a path on the main Zeminent site. */
export function zeminentUrl(path = "/") {
  return `${ZEMINENT_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// GA4 Measurement ID — the single place this value is written.
export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-D4XJJ21J86";

export const GA4_ENABLED = /^G-[A-Z0-9]{6,}$/.test(GA4_MEASUREMENT_ID);

// ── Google Tag Manager ─────────────────────────────────────────────────────
//
// Separate from the gtag.js tag above. GTM is a container: tags are added and
// removed in its web UI without a deploy, which is the point of having it.
//
// Both run side by side. If the GTM container is ever given a GA4
// configuration tag for G-D4XJJ21J86, that property will receive two of
// everything — one from gtag.js here, one from the container. Consolidate on
// one or the other before that happens.
export const GTM_CONTAINER_ID =
  process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || "GTM-MD93JBWX";

export const GTM_ENABLED = /^GTM-[A-Z0-9]{4,}$/.test(GTM_CONTAINER_ID);


// ── Session helpers ────────────────────────────────────────────────────────
//
// Each takes the session fetched from the admin API. They return null/"" for a
// missing session rather than throwing, so a page can render its empty state
// without every call site guarding first.

export function webinarStartDate(session) {
  if (!session?.startAt) return null;
  return new Date(session.startAt);
}

export function webinarEndDate(session) {
  const start = webinarStartDate(session);
  if (!start) return null;
  return new Date(start.getTime() + (session.durationMinutes || 0) * 60_000);
}

// Rendered in IST regardless of the visitor's device timezone — the audience
// is Indian and a Gulf-timezone visitor seeing "13:30" for an 11:00 IST
// session causes no-shows. The label says IST explicitly for the same reason.
const IST_DATE_FMT = {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Kolkata",
};
const IST_TIME_FMT = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
};

export function formattedWebinarDate(session) {
  const start = webinarStartDate(session);
  return start ? new Intl.DateTimeFormat("en-IN", IST_DATE_FMT).format(start) : "";
}

/**
 * Same date with the year — used on the thank-you page, where the value is
 * going into someone's calendar and "Sunday, 16 August" alone is ambiguous
 * once the mail has sat in an inbox for a week.
 */
export function formattedWebinarDateLong(session) {
  const start = webinarStartDate(session);
  return start
    ? new Intl.DateTimeFormat("en-IN", { ...IST_DATE_FMT, year: "numeric" }).format(start)
    : "";
}

export function formattedWebinarTime(session) {
  const start = webinarStartDate(session);
  if (!start) return "";
  return `${new Intl.DateTimeFormat("en-IN", IST_TIME_FMT).format(start).toUpperCase()} IST`;
}

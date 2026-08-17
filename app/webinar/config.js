// ── Webinar funnel configuration ───────────────────────────────────────────
//
// Single source of truth for the Full Stack Roadmap webinar funnel. The
// landing page (/webinar/full-stack-roadmap) and the thank-you page
// (/webinar/thank-you) both import from here, which is what keeps
// CONFIG.webinarStart identical across the two — the integration guide calls
// that out as a manual step because the original build was two loose HTML
// files; here it is structurally guaranteed.
//
// Every value can be overridden per-environment via NEXT_PUBLIC_* env vars
// (see .env.example). The literals below are the committed defaults, so
// editing this one file is still a valid way to change the funnel.
//
// NOTE on env vars: process.env.NEXT_PUBLIC_X must be referenced statically
// for Next to inline it into the client bundle — hence the repetition rather
// than a lookup helper.

// Zoho Forms permalink (Share → Permalink). Loaded into the registration
// modal as an iframe with the UTM fields appended as query params, which is
// how Zoho prefills its hidden fields.
//
// The form's own "On Successful Submission → Redirect to URL" must point at
// https://learning.zeminent.com/webinar/thank-you.html — see THANK_YOU_PATH.
const zohoFormUrl =
  process.env.NEXT_PUBLIC_ZOHO_FORM_URL ||
  "https://forms.zohopublic.in/prathyushazemi1/form/WebinarSignupForm/formperma/A7IfjywsvIuQlIebLy6GL6RFnqqBUYiRIyfb88u-mec";

// Session start, ISO 8601 with an explicit offset. IST is +05:30.
// Must match the session you created in Zoho Webinar.
const webinarStart =
  process.env.NEXT_PUBLIC_WEBINAR_START || "2026-08-16T11:00:00+05:30";

// Duration in minutes — drives the calendar file's end time and the
// "90 minutes" copy in the fact strip.
const webinarDurationMinutes = Number(
  process.env.NEXT_PUBLIC_WEBINAR_DURATION_MINUTES || 90,
);

// Zoho Webinar session registration / joining URL. Surfaced on the thank-you
// page as the primary action.
const webinarUrl =
  process.env.NEXT_PUBLIC_WEBINAR_URL ||
  "https://zeminent.zohowebinar.in/register/REPLACE_WITH_SESSION_ID";

// Instructor. Photo is served locally from /public/webinar/surya.png
// (copied from https://www.zeminent.com/teamImages/Img1.png) so the page
// makes no cross-origin image request.
const instructor = {
  name: "Surya",
  role: "Founder & Lead Instructor · Zeminent",
  photo: "/webinar/surya.png",
  bio: "Surya leads engineering and teaching at Zeminent. He has spent his career building and shipping production software, and now runs the cohort programme that takes people from first commit to deployed full-stack product. He teaches the way a senior engineer reviews: specification first, code second, tests and deployment in the same breath.",
  // Short factual points shown beside the portrait. Keep these verifiable.
  facts: [
    "Teaches every live cohort session personally",
    "Reviews student capstones against a real PR rubric",
    "Built the 24-week Zeminent full stack curriculum",
  ],
};

// Real students only. While this array is empty the testimonials section does
// not render at all — an absent section beats an invented one, and fabricated
// endorsements are a live risk under India's consumer protection rules.
//
// Shape: { name, role, quote }
const testimonials = [];

export const CONFIG = {
  zohoFormUrl,
  webinarStart,
  webinarDurationMinutes,
  webinarUrl,
  instructor,
  testimonials,

  // Descriptive metadata used by GA4 payloads and the calendar file.
  webinar: "full-stack-roadmap",
  title: "The Full Stack Roadmap",
  subtitle:
    "A free 90-minute session on exactly what to learn, in what order, to become a job-ready full stack developer.",
  seatCap: 300,
  priceLabel: "Free",
  location: "Online · joining link emailed on registration",
};

// Canonical paths. The .html suffix on the thank-you page is preserved as a
// rewrite in next.config.mjs because it is the URL configured inside Zoho
// Forms, and changing it there means re-testing the whole submission flow.
export const WEBINAR_PATH = "/webinar/full-stack-roadmap";
export const THANK_YOU_PATH = "/webinar/thank-you";

// This app's own public origin. Social cards, the canonical URL and the
// Event JSON-LD all need absolute URLs, and only the deployment knows what
// its own hostname is. The literal is the production fallback so a build
// without the env var still emits real URLs rather than localhost.
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_WEBINAR_SITE_URL || "https://learning.zeminent.com"
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

// GA4 Measurement ID — the single place this value is written. Everything
// else imports it from here, so pointing the funnel at a different property
// is a one-line change (or an env var, below).
//
// The literal is the live Zeminent property, so analytics works on a fresh
// clone with no .env file. Override per-environment with
// NEXT_PUBLIC_GA4_MEASUREMENT_ID — e.g. a separate staging property, or an
// empty/placeholder value to switch the tag off entirely.
export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-D4XJJ21J86";

export const GA4_ENABLED = /^G-[A-Z0-9]{6,}$/.test(GA4_MEASUREMENT_ID);

// ── Derived helpers ────────────────────────────────────────────────────────

export function webinarStartDate() {
  return new Date(CONFIG.webinarStart);
}

export function webinarEndDate() {
  return new Date(
    webinarStartDate().getTime() + CONFIG.webinarDurationMinutes * 60_000,
  );
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

export function formattedWebinarDate() {
  return new Intl.DateTimeFormat("en-IN", IST_DATE_FMT).format(
    webinarStartDate(),
  );
}

/**
 * Same date with the year — used on the thank-you page, where the value is
 * going into someone's calendar and "Sunday, 16 August" alone is ambiguous
 * once the mail has sat in an inbox for a week.
 */
export function formattedWebinarDateLong() {
  return new Intl.DateTimeFormat("en-IN", {
    ...IST_DATE_FMT,
    year: "numeric",
  }).format(webinarStartDate());
}

export function formattedWebinarTime() {
  return `${new Intl.DateTimeFormat("en-IN", IST_TIME_FMT)
    .format(webinarStartDate())
    .toUpperCase()} IST`;
}

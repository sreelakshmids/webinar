"use client";

// ── Webinar funnel attribution + analytics ─────────────────────────────────
//
// Two jobs:
//
//   1. Capture attribution once on arrival and keep it for the whole session,
//      so a visitor who lands on ?utm_source=instagram, scrolls, navigates
//      and only registers ten minutes later still gets attributed to
//      Instagram. sessionStorage (not localStorage) — a visit next week from
//      a different ad should not inherit today's UTMs.
//
//   2. Fire the GA4 events the integration guide specifies, with UTM context
//      attached so `utm_source` / `cta_location` / `webinar` work as custom
//      dimensions.
//
// Everything here no-ops safely on the server and when gtag is absent, so a
// missing/placeholder Measurement ID degrades to "page works, nothing
// reported" rather than a runtime error.

import { CONFIG } from "./config";

const STORAGE_KEY = "zem_webinar_attribution";

// Exactly the fields the Zoho Form declares as hidden fields. Order matters
// only for readability; the names must match the form field names verbatim.
export const ATTRIBUTION_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "cta_location",
  "landing_page",
  "referrer",
];

const URL_PARAM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

function emptyAttribution() {
  return ATTRIBUTION_FIELDS.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});
}

function readStored() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private mode / storage disabled / corrupt JSON. Attribution is
    // best-effort; never let it break the page.
    return null;
  }
}

function writeStored(data) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/**
 * Capture attribution on arrival and persist it for the session.
 *
 * First-touch wins for the campaign params: if the stored record already has
 * a utm_source, a later pageview without params does not blank it. But a
 * *new* set of UTM params in the URL does replace the record — that visitor
 * genuinely arrived from a different campaign.
 *
 * `landing_page` and `referrer` are recorded from the first page of the
 * session only, which is what makes them useful in reporting.
 */
export function captureAttribution() {
  if (typeof window === "undefined") return emptyAttribution();

  const params = new URLSearchParams(window.location.search);
  const incoming = {};
  let hasIncoming = false;
  for (const key of URL_PARAM_FIELDS) {
    const value = params.get(key);
    if (value) {
      incoming[key] = value;
      hasIncoming = true;
    }
  }

  const stored = readStored();
  if (stored && !hasIncoming) return { ...emptyAttribution(), ...stored };

  const next = {
    ...emptyAttribution(),
    ...(stored || {}),
    ...incoming,
    landing_page:
      stored?.landing_page || window.location.pathname + window.location.search,
    referrer: stored?.referrer || document.referrer || "direct",
  };

  writeStored(next);
  return next;
}

/** Read the stored attribution without touching the URL. */
export function getAttribution() {
  if (typeof window === "undefined") return emptyAttribution();
  return { ...emptyAttribution(), ...(readStored() || {}) };
}

/**
 * Record which CTA the visitor used. Written into the stored record so the
 * value survives into the form submission and the thank-you page, which is
 * how `cta_location` ends up on the CRM lead.
 */
export function setCtaLocation(ctaLocation) {
  if (typeof window === "undefined" || !ctaLocation) return;
  writeStored({ ...getAttribution(), cta_location: ctaLocation });
}

// ── GA4 ────────────────────────────────────────────────────────────────────

// The GA snippet defines window.gtag synchronously, before gtag.js finishes
// loading, so calling it early just queues into dataLayer. If the tag is
// absent entirely (placeholder Measurement ID) this is a no-op — deliberately
// silent, because a marketing page should not throw over analytics.
function gtag(...args) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag(...args);
}

/** Only the params GA4 should see — empty strings are noise in reports. */
function attributionParams() {
  const attribution = getAttribution();
  const out = {};
  for (const [key, value] of Object.entries(attribution)) {
    if (value) out[key] = value;
  }
  return out;
}

export function trackEvent(name, params = {}) {
  gtag("event", name, {
    webinar: CONFIG.webinar,
    ...attributionParams(),
    ...params,
  });
}

// The six events named in the integration guide. Wrapped rather than called
// as raw strings so a rename can't drift between the landing and thank-you
// pages.

export function trackViewWebinarLanding() {
  trackEvent("view_webinar_landing");
}

export function trackCtaClick(ctaLocation, ctaText) {
  setCtaLocation(ctaLocation);
  trackEvent("cta_click", { cta_location: ctaLocation, cta_text: ctaText });
}

export function trackRegistrationFormOpen(ctaLocation) {
  trackEvent("registration_form_open", { cta_location: ctaLocation });
}

export function trackScrollDepth(percent) {
  trackEvent("scroll_depth", { percent });
}

export function trackRegistrationComplete() {
  trackEvent("registration_complete");
}

export function trackAddToCalendar() {
  trackEvent("add_to_calendar");
}

/**
 * 25 / 50 / 75 / 90% scroll milestones, each fired at most once per page.
 * Returns a cleanup function for the caller's effect.
 */
export function initScrollDepthTracking() {
  if (typeof window === "undefined") return () => {};

  const milestones = [25, 50, 75, 90];
  const fired = new Set();
  let ticking = false;

  const measure = () => {
    ticking = false;
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = (window.scrollY / scrollable) * 100;
    for (const milestone of milestones) {
      if (percent >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        trackScrollDepth(milestone);
      }
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  measure();
  return () => window.removeEventListener("scroll", onScroll);
}

/**
 * Build the Zoho Form URL with the attribution appended as query params.
 * Zoho Forms prefills hidden fields from same-named query params, so the
 * hidden fields listed in the guide populate with no extra Zoho config.
 */
export function buildZohoFormUrl(baseUrl, ctaLocation) {
  const attribution = { ...getAttribution() };
  if (ctaLocation) attribution.cta_location = ctaLocation;

  try {
    const url = new URL(baseUrl);
    for (const field of ATTRIBUTION_FIELDS) {
      if (attribution[field]) url.searchParams.set(field, attribution[field]);
    }
    return url.toString();
  } catch {
    // Malformed/unset permalink — hand back what we were given rather than
    // throwing inside a render.
    return baseUrl;
  }
}

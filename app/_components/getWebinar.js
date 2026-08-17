import "server-only";

// ── The session on show ────────────────────────────────────────────────────
//
// The admin panel is the only source of session data. This returns exactly
// what it published, or null — never an invented fallback.
//
// That is a deliberate reversal of how this started. It used to fall back to
// committed defaults so the page always rendered something, but "something"
// meant a made-up date sitting on a public landing page while nothing was
// scheduled. People calendar that and turn up to nothing. Showing "no session
// scheduled" is the honest failure, and it is the one the page now renders.
//
// Two other properties still hold:
//   - The fetch is server-side only (`server-only`), so the API origin never
//     reaches the browser and there is no CORS to arrange.
//   - Pages stay static. ISR revalidates in the background on a timer rather
//     than blocking a request on the database.

const API_URL = (process.env.API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

// How long a rendered page may be stale. Short enough that an admin saving a
// date sees it on the next refresh-ish, long enough that traffic spikes don't
// turn into a database read per request.
const REVALIDATE_SECONDS = Number(process.env.WEBINAR_REVALIDATE_SECONDS || 60);

// Don't let a hung backend hold a page render open.
const FETCH_TIMEOUT_MS = 4000;

/**
 * The published session, or null when there isn't one.
 *
 * Never throws: a page that can't reach the API renders its no-session state
 * rather than a 500. Next keeps serving the last successful render until the
 * next revalidation succeeds, so a brief backend blip is usually invisible.
 */
export async function getSession() {
  try {
    const res = await fetch(`${API_URL}/webinars/current`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    const webinar = body?.data?.webinar;
    if (!webinar || !webinar.startAt) return null;

    return {
      id: webinar.id || "",
      slug: webinar.slug || "",
      title: webinar.title || "",
      subtitle: webinar.subtitle || "",
      startAt: webinar.startAt,
      durationMinutes: webinar.durationMinutes || 0,
      zohoFormUrl: webinar.zohoFormUrl || "",
      joinUrl: webinar.joinUrl || "",
      seatCap: webinar.seatCap || 0,
      priceLabel: webinar.priceLabel || "",
      location: webinar.location || "",
      instructor: webinar.instructor || null,
      // Real students only. Empty means the section does not render at all.
      testimonials: Array.isArray(webinar.testimonials) ? webinar.testimonials : [],
      hasEnded: Boolean(webinar.hasEnded),
    };
  } catch (error) {
    // Logged, not thrown. Worth seeing in server logs; not worth a 500 on a
    // page whose entire job is converting traffic.
    console.warn(`[webinar] no session available: ${error?.message || error}`);
    return null;
  }
}

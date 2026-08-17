# zeminent-webinar

Standalone Next.js app for the Zeminent webinar funnel — landing page,
registration modal and thank-you page. Split out of `zeminent-learn`, where it
originally shipped as a route subtree.

```bash
cd zeminent-webinar
npm install
npm run dev     # http://localhost:7002
```

| App | Port |
|---|---|
| Learner (`zeminent-learn`) | 7000 |
| Admin (`zeminent-admin-panel`) | 7001 |
| **Webinar (this app)** | **7002** |
| Backend (`zeminent-learn-backend`) | 4000 |

## It has no backend

This app talks to no server of its own and makes **no calls to the Zeminent
backend**. That is not an omission — it is the architecture the integration
guide specifies:

- **Registration** is a Zoho Form, framed in the modal. Zoho is the single
  write point.
- **Attendees, reminders, joining links** are Zoho Webinar's.
- **Lead records** reach Zoho CRM and a Google Sheet by subscribing to the
  form, not by anything this app posts.
- **Analytics** goes straight to GA4 from the browser.

So there is no `NEXT_PUBLIC_API_URL` here, no session handling, and no auth.
The funnel is deliberately anonymous: its whole job is capturing people who
are *not yet* Zeminent learners. See **Authentication** below.

## Routes

| URL | Serves |
|---|---|
| `/` | redirects to the landing page |
| `/webinar/full-stack-roadmap` | landing page (canonical) |
| `/webinar/thank-you` | thank-you page (`noindex`) |
| `/webinar/thank-you.html` | thank-you page — **rewrite**; this is the URL configured inside Zoho Forms |
| `/webinar`, `/full-stack-roadmap` | redirect to the landing page |
| `/webinar/index.html`, `/webinar/full-stack-roadmap.html` | rewrites, for parity with the guide's static layout |

The `/webinar/...` prefix is kept even though this app serves nothing else.
Zoho Forms' success redirect, the CRM mapping and the webhook are all
configured against those exact URLs, and the public link has been shared.
Changing the paths would mean re-testing the whole submission chain for no
gain; `/` redirects into it so `localhost:7002` still lands correctly.

## Files

```
app/
  layout.js                     fonts (Geist, Geist Mono, Fraunces) + favicons
  globals.css                   canvas + iOS input-zoom fix only
  webinar/
    config.js                   CONFIG — the only file with values to change
    tracking.js                 UTM capture (sessionStorage) + GA4 events
    Analytics.js                gtag; renders nothing without a real GA4 ID
    WebinarChrome.js            top bar (back to Zeminent), footer, section label
    RegistrationModal.js        Zoho form iframe + focus trap + scroll lock
    webinar.module.css          all styling, scoped to .page
    full-stack-roadmap/
      page.js                   metadata, OG, Event JSON-LD
      WebinarLanding.js
      content.js                page copy
    thank-you/
      page.js
      ThankYouClient.js         registration_complete, .ics, calendar links

scripts/sheets-webhook.gs       Apps Script receiver → Google Sheet → Power BI
public/webinar/surya.png        instructor photo, served locally
public/zeminent-logo-v3.png     brand wordmark, served locally
```

No Tailwind. Every class comes from `webinar.module.css`, which is why the
stylesheet moved across from the learner app unchanged.

## Configuration

Everything lives in `app/webinar/config.js`, each value overridable with a
`NEXT_PUBLIC_*` variable — see `.env.example`.

| CONFIG key | Env var |
|---|---|
| `CONFIG.zohoFormUrl` | `NEXT_PUBLIC_ZOHO_FORM_URL` |
| `CONFIG.webinarStart` | `NEXT_PUBLIC_WEBINAR_START` |
| `CONFIG.webinarUrl` | `NEXT_PUBLIC_WEBINAR_URL` |
| `CONFIG.instructor` | — |
| `CONFIG.testimonials` | — **real students only**; section hides while empty |
| `GA4_MEASUREMENT_ID` | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` |
| `ZEMINENT_SITE_URL` | `NEXT_PUBLIC_ZEMINENT_URL` — where "Back to Zeminent" goes |
| `SITE_ORIGIN` | `NEXT_PUBLIC_WEBINAR_SITE_URL` — this app's own public origin |

Both pages import `CONFIG.webinarStart` from the same module, so the guide's
"set the same value in both HTML files" step cannot drift.

## Attribution

Captured once on arrival into `sessionStorage` (`zem_webinar_attribution`),
then appended to the Zoho form URL as query params — which is how Zoho
prefills its hidden fields. Ten fields, named exactly as the guide specifies:

```
utm_source  utm_medium  utm_campaign  utm_content  utm_term
gclid       fbclid      cta_location  landing_page  referrer
```

First-touch wins: a later pageview without params does not blank an existing
record, but arriving with a fresh set of UTMs replaces it. `cta_location` is
written at click time, so it reflects which button was used.

> **Not yet live:** the hidden fields do not exist on the current Zoho form.
> Until they are added with exactly these names, GA4 attribution works but the
> CRM and sheet UTM columns stay blank. No code change needed once they exist.

## GA4 events

| Event | Fires | Parameters |
|---|---|---|
| `view_webinar_landing` | landing page load | `webinar`, `utm_*` |
| `cta_click` | every CTA | `cta_location`, `cta_text` |
| `registration_form_open` | modal opens | `cta_location` |
| `scroll_depth` | 25 / 50 / 75 / 90% | `percent` |
| `registration_complete` | thank-you page load | `webinar`, `utm_*` |
| `add_to_calendar` | .ics or Google Calendar click | `webinar` |

`cta_location` values: `topbar`, `hero`, `hero_secondary`, `session_card`,
`seat_bar`, `final_cta`, `thank_you_join`, `thank_you_curriculum`,
`thank_you_home`, `thank_you_share`.

In GA4 Admin → Events mark `registration_complete` as a Key Event, then
register `cta_location`, `utm_source` and `webinar` as custom dimensions —
without that they are collected but not reportable.

`registration_complete` is suppressed when the thank-you page renders inside
the modal's iframe. Zoho redirects the frame there on submit and the modal
promotes it to a top-level navigation, so the page mounts twice; firing in
both would double every conversion.

## Authentication

There is none, by design.

The funnel's audience is people who do not have a Zeminent account — that is
the point of a lead-generation webinar. Putting a login in front of it would
block the exact visitors it exists to capture. Nothing on either page is
user-specific, so there is nothing to protect.

If genuinely learner-only webinar features are added later (a members-only
session, a personalised dashboard), the session cookie is the thing to solve
first: the learner app seals it in `zeminent-learn/lib/session.ts` and it is
scoped to that origin, so a separate host/port cannot read it. That needs a
deliberate decision — a shared parent domain with a cookie scoped to it, or
a token handoff — rather than being bolted on here.

## Design notes

- **Accent is `#5eead4`**, not the guide's inferred `#4D9FFF`. `zeminent.com`
  serves `#5eead4`; `--wb-bg: #0d1117` matches its `theme-color` exactly, as
  the guide said. One token at the top of the stylesheet re-tints everything.
- **Fonts are Geist / Geist Mono / Fraunces** — the same trio the learner site
  uses, in the roles the guide describes for Inter Tight / JetBrains Mono /
  Instrument Serif.
- **Dark only.** The Zoho form is themed dark on Zoho's side and can't follow
  a client-side toggle, so there is no theme switcher here.
- **Logo and instructor photo are local**, not hot-linked from zeminent.com.

## Zoho-side setup

Unchanged from `INTEGRATION-GUIDE.md` sections 1–4. Two things this code
depends on:

1. **Form redirect** → `<this app's origin>/webinar/thank-you.html`
2. **Dark form theme** — background `#0d1117`, field background `#171c27`,
   border `rgba(255,255,255,.16)`, text `#E6EAF2`, button `#4F9CF9` with a
   `#08111C` label. The modal's background is `#0d1117`, so a white form
   would show a hard seam.

The live form asks a different set of questions than guide section 1
sketches; `scripts/sheets-webhook.gs` is mapped to the live form, not the
sketch.

## Before you go live

- [ ] `NEXT_PUBLIC_ZEMINENT_URL` and `NEXT_PUBLIC_WEBINAR_SITE_URL` — real origins
- [ ] `NEXT_PUBLIC_WEBINAR_START` — confirm date/time; matches Zoho Webinar
- [ ] `NEXT_PUBLIC_WEBINAR_URL` — Zoho Webinar session URL
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` — the tag does not render until this is set
- [ ] Hidden UTM fields added to the Zoho form
- [ ] Zoho form redirect points at this app's `/webinar/thank-you.html`
- [ ] `CONFIG.instructor.bio` — Surya to read once before it ships
- [ ] `CONFIG.testimonials` — real students only; leave empty until then
- [ ] `SHEET_ID` and `SHARED_SECRET` in `scripts/sheets-webhook.gs`
- [ ] Drop a 1200×630 card at `public/webinar/og-full-stack-roadmap.jpg`
- [ ] Test end to end: form → CRM lead → webinar email → sheet row → GA4 realtime
- [ ] Open the modal on an actual phone, not a narrow browser window
- [ ] Privacy policy live, consent language on the form (DPDP Act)

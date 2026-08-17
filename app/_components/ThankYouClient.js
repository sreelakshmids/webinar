"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./thankyou.module.css";
import SiteFooter from "./SiteFooter";
import {
  CONFIG,
  WEBINAR_PATH,
  formattedWebinarDateLong,
  formattedWebinarTime,
  webinarEndDate,
  webinarStartDate,
} from "./config";
import {
  captureAttribution,
  trackAddToCalendar,
  trackCtaClick,
  trackRegistrationComplete,
} from "./tracking";

// ── Calendar ──────────────────────────────────────────────────────────────
// Built in the browser from CONFIG, so there is no server round trip and the
// file can never disagree with what the page displays.

function icsStamp(date) {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escapeIcsText(value) {
  return String(value).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function buildIcs() {
  const start = webinarStartDate();
  const end = webinarEndDate();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zeminent//Webinar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${CONFIG.webinar}-${icsStamp(start)}@zeminent.com`,
    `DTSTAMP:${icsStamp(start)}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escapeIcsText(`${CONFIG.title} — Zeminent`)}`,
    `DESCRIPTION:${escapeIcsText(`${CONFIG.subtitle}\nJoin: ${CONFIG.webinarUrl}`)}`,
    `URL:${CONFIG.webinarUrl}`,
    `LOCATION:${escapeIcsText(CONFIG.location)}`,
    // Two reminders, mirroring the Zoho Webinar email cadence.
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Zeminent webinar tomorrow",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Zeminent webinar in one hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// A data: URI rather than a Blob URL — the file derives only from CONFIG, so
// it can be built during render with no effect, no state and no object-URL
// lifecycle. Paired with `download`, browsers save it as a file.
function icsHref() {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs())}`;
}

function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${CONFIG.title} — Zeminent`,
    dates: `${icsStamp(webinarStartDate())}/${icsStamp(webinarEndDate())}`,
    details: `${CONFIG.subtitle}\n\nJoin: ${CONFIG.webinarUrl}`,
    location: CONFIG.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const STEPS = [
  "Check your inbox for the mail from Zoho Webinar. If it isn't there in ten minutes, look in Promotions or Spam.",
  "Join from a laptop if you can — we'll be reading code on screen.",
  "Bring one question about where you're stuck. We answer them live at the end.",
];

export default function ThankYouClient() {
  // Zoho redirects the registration modal's iframe here on submit, so this
  // page can mount inside the modal rather than as a page in its own right.
  //
  // When that happens, break out to the top window ourselves. Doing it from
  // the child is more reliable than the parent trying to read the frame's URL
  // after it navigates, and it is always permitted here because the top window
  // is this same app. The early return also keeps registration_complete — the
  // funnel's Key Event in GA4 — from firing twice: the framed mount hands off,
  // the top-level mount that follows is the one that counts.
  useEffect(() => {
    if (window.top !== window.self) {
      // replace, not assign: the framed URL should not become a history entry
      // the back button can return to.
      window.top.location.replace(window.location.href);
      return;
    }
    // Attribution is re-read from sessionStorage first, so the conversion
    // carries the same utm_* / cta_location the landing page recorded.
    captureAttribution();
    trackRegistrationComplete();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href={WEBINAR_PATH} className={styles.brand} aria-label="Zeminent webinars">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zeminent-logo-v3.png"
              alt="Zeminent"
              width={114}
              height={25}
              className={styles.logo}
            />
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.brandLabel}>Webinars</span>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>
            <span className={styles.okDot} aria-hidden="true" />
            Seat confirmed
          </div>

          <h1 className={styles.heading}>
            You&rsquo;re{" "}
            <span className={styles.headingEm}>registered.</span>
          </h1>

          <p className={styles.lede}>
            Your <em>joining link</em> is on its way to your inbox. Add the
            session to your calendar now so it doesn&rsquo;t get buried.
          </p>

          <section className={styles.panel} aria-label="Session details">
            <div className={styles.row}>
              <span className={styles.rowKey}>Workshop</span>
              <span className={styles.rowVal}>{CONFIG.title}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowKey}>Date</span>
              <span className={styles.rowVal}>{formattedWebinarDateLong()}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowKey}>Time</span>
              <span className={styles.rowVal}>{formattedWebinarTime()}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowKey}>Where</span>
              <span className={`${styles.rowVal} ${styles.rowValAccent}`}>
                {CONFIG.location}
              </span>
            </div>
          </section>

          <div className={styles.actions}>
            <a
              href={googleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
              onClick={trackAddToCalendar}
            >
              Add to Google Calendar
              <ArrowRight size={16} className={styles.arrow} aria-hidden="true" />
            </a>

            {/* CONFIG.webinarUrl — the Zoho Webinar session joining URL. */}
            <a
              href={CONFIG.webinarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnGhost}
              onClick={() =>
                trackCtaClick("thank_you_join", "Open the webinar page")
              }
            >
              Open the webinar page
            </a>
          </div>

          <p className={styles.icsLink}>
            On Outlook or Apple Calendar?{" "}
            <a
              href={icsHref()}
              download={`zeminent-${CONFIG.webinar}.ics`}
              onClick={trackAddToCalendar}
            >
              Download the .ics file
            </a>
          </p>

          <hr className={styles.divider} />

          <h2 className={styles.stepsTitle}>Before the session</h2>
          <ol className={styles.steps}>
            {STEPS.map((text, i) => (
              <li key={text} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.stepText}>{text}</span>
              </li>
            ))}
          </ol>

          <p className={styles.fallback}>
            Didn&rsquo;t get the email?{" "}
            <a href="mailto:info@zeminent.com">Write to info@zeminent.com</a> and
            we&rsquo;ll resend it.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

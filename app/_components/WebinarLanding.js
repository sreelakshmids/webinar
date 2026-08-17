"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Minus } from "lucide-react";
import styles from "./webinar.module.css";
import RegistrationModal from "./RegistrationModal";
import { SectionLabel, WebinarTopBar } from "./WebinarChrome";
import SiteFooter from "./SiteFooter";
import {
  CONFIG,
  formattedWebinarDate,
  formattedWebinarTime,
  webinarStartDate,
} from "./config";
import {
  captureAttribution,
  initScrollDepthTracking,
  trackCtaClick,
  trackViewWebinarLanding,
} from "./tracking";
import {
  AUDIENCE_FOR,
  AUDIENCE_NOT_FOR,
  ROADMAP,
  STACK_GROUPS,
  TAKEAWAYS,
} from "./content";

const pad2 = (n) => String(n).padStart(2, "0");
const index2 = (i) => pad2(i + 1);

/**
 * Live countdown to CONFIG.webinarStart.
 *
 * Mounted-gated: the server has no idea what "now" is for this visitor, so
 * rendering a duration during SSR guarantees a hydration mismatch. Renders
 * nothing until the first client tick.
 */
function Countdown() {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const target = webinarStartDate().getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  if (remaining === 0) {
    return (
      <div className={styles.countdown}>
        <div className={styles.countdownUnit}>
          <div className={styles.countdownNum}>Live</div>
          <div className={styles.countdownLabel}>starting now</div>
        </div>
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const units = [
    { value: Math.floor(totalSeconds / 86400), label: "days" },
    { value: Math.floor((totalSeconds % 86400) / 3600), label: "hrs" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "min" },
    { value: totalSeconds % 60, label: "sec" },
  ];

  return (
    <div className={styles.countdown} aria-label="Time until the session starts">
      {units.map((u) => (
        <div key={u.label} className={styles.countdownUnit}>
          <div className={styles.countdownNum}>{pad2(u.value)}</div>
          <div className={styles.countdownLabel}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function WebinarLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [ctaLocation, setCtaLocation] = useState("hero");
  const [seatBarVisible, setSeatBarVisible] = useState(false);
  const heroCtaRef = useRef(null);

  // Attribution first, then the landing event — so utm_* are already in
  // sessionStorage when view_webinar_landing fires and carry into the payload.
  useEffect(() => {
    captureAttribution();
    trackViewWebinarLanding();
    return initScrollDepthTracking();
  }, []);

  // The seat bar appears once the hero CTA is off screen, so the primary
  // action is always reachable without duplicating it while it is visible.
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setSeatBarVisible(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const openRegistration = useCallback((location, text) => {
    trackCtaClick(location, text);
    setCtaLocation(location);
    setModalOpen(true);
  }, []);

  const closeRegistration = useCallback(() => setModalOpen(false), []);

  const date = formattedWebinarDate();
  const time = formattedWebinarTime();
  const hasTestimonials = CONFIG.testimonials.length > 0;

  return (
    <div className={styles.page}>
      <WebinarTopBar
        meta={`${date} · ${time}`}
        cta={
          <button
            type="button"
            className={`${styles.btnPrimary} ${styles.topbarCta}`}
            onClick={() => openRegistration("topbar", "Reserve my free seat")}
          >
            Reserve my free seat
            <ArrowRight size={14} className={styles.arrow} aria-hidden="true" />
          </button>
        }
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <span className={styles.gridBg} aria-hidden="true" />
        <span className={styles.heroGlow} aria-hidden="true" />

        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div>
            <span className={styles.tagAccent}>
              <span className={styles.liveDot} aria-hidden="true" />
              Free live session · {date}
            </span>

            <h1 className={`${styles.display} ${styles.heroTitle}`}>
              <span>Become a job-ready</span>
              <span className={styles.em}>full stack developer.</span>
            </h1>

            <p className={styles.heroLede}>
              Ninety minutes on exactly what to learn, in what order, and what to
              skip &mdash; the roadmap we teach inside the Zeminent cohort,
              given away in full.
            </p>

            <div className={styles.heroActions} ref={heroCtaRef}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => openRegistration("hero", "Reserve my free seat")}
              >
                Reserve my free seat
                <ArrowRight size={15} className={styles.arrow} aria-hidden="true" />
              </button>
              <a
                href="#roadmap"
                className={styles.btnGhost}
                onClick={() => trackCtaClick("hero_secondary", "See the roadmap")}
              >
                See the roadmap
              </a>
            </div>

            <p className={styles.heroNote}>
              {CONFIG.priceLabel} &middot; no recording guarantee &middot; joining
              link emailed instantly
            </p>
          </div>

          {/* Session card — the homepage's editor-panel device, holding the
              facts a registrant actually needs. */}
          <aside className={styles.sessionCard}>
            <div className={styles.sessionChrome}>
              <span className={styles.sessionDots} aria-hidden="true">
                <span className={styles.sessionDot} />
                <span className={styles.sessionDot} />
                <span className={styles.sessionDot} />
              </span>
              <span>session.json</span>
            </div>

            <div className={styles.sessionBody}>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Topic</span>
                <span className={styles.sessionVal}>{CONFIG.title}</span>
              </div>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Date</span>
                <span className={styles.sessionVal}>{date}</span>
              </div>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Time</span>
                <span className={styles.sessionVal}>{time}</span>
              </div>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Duration</span>
                <span className={styles.sessionVal}>
                  {CONFIG.webinarDurationMinutes} minutes
                </span>
              </div>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Price</span>
                <span className={styles.sessionValAccent}>
                  {CONFIG.priceLabel}
                </span>
              </div>
              <div className={styles.sessionRow}>
                <span className={styles.sessionKey}>Where</span>
                <span className={styles.sessionVal}>Online &middot; live</span>
              </div>
            </div>

            <div className={styles.sessionFoot}>
              <Countdown />
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.sessionCta}`}
                style={{ marginTop: 16 }}
                onClick={() =>
                  openRegistration("session_card", "Reserve my free seat")
                }
              >
                Reserve my free seat
                <ArrowRight size={15} className={styles.arrow} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.sessionStatus}>
              <span>registration open</span>
              <span>{CONFIG.seatCap} seats</span>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Why this exists ──────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionLabel num="01" label="Why this session" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            The problem was never
            <br />
            <span className={styles.emMuted}>a shortage of tutorials.</span>
          </h2>

          <div className={styles.lede} style={{ marginTop: 40 }}>
            <p style={{ margin: 0 }}>
              There is more free full stack material online than anyone could
              watch in a decade. What is missing is order. Which thing first,
              how deep to go before moving on, and when a topic is safe to skip
              entirely.
            </p>
            <p style={{ marginTop: 20 }}>
              Without that, learning turns into a loop: three weeks on a
              framework, a tutorial project, a gap, a restart. People arrive at
              interviews having spent a year working hard on the wrong
              sequence.
            </p>
            <p style={{ marginTop: 20, color: "var(--wb-fg)" }}>
              This session is the sequence. It is the same roadmap we teach in
              the cohort, laid out end to end, with the reasoning for the order
              rather than just the list.
            </p>
          </div>

          <div className={styles.statStrip}>
            {[
              { n: CONFIG.webinarDurationMinutes, l: "minutes, live" },
              { n: ROADMAP.length, l: "roadmap stages" },
              { n: CONFIG.priceLabel, l: "to attend" },
              { n: "Q&A", l: "at the end" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`${styles.statCell} ${i % 2 === 0 ? styles.statCellShaded : ""}`}
              >
                <div className={styles.statNum}>{s.n}</div>
                <div className={styles.statLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The roadmap ──────────────────────────────────────────────── */}
      <section className={styles.section} id="roadmap">
        <div className={styles.shell}>
          <SectionLabel num="02" label="The roadmap" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            Seven stages.
            <br />
            <span className={styles.em}>In this order.</span>
          </h2>

          <div className={styles.capGrid}>
            {ROADMAP.map((stage, i) => (
              <article key={stage.title} className={styles.capCell}>
                <div className={styles.capIndex}>
                  <span className={styles.capIndexCurrent}>{index2(i)}</span>
                  {" / "}
                  {pad2(ROADMAP.length)}
                </div>
                <h3 className={styles.capTitle}>{stage.title}</h3>
                <p className={styles.capBody}>{stage.body}</p>
                <div className={styles.capTags}>
                  {stage.tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── The stack ────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionLabel num="03" label="The stack" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            What the roadmap
            <br />
            <span className={styles.emMuted}>actually covers.</span>
          </h2>

          <div className={styles.chipRows}>
            {STACK_GROUPS.map((group) => (
              <div key={group.label} className={styles.chipRow}>
                <div className={styles.chipRowLabel}>{group.label}</div>
                <div className={styles.chipList}>
                  {group.items.map((item) => (
                    <span key={item} className={styles.chip}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionLabel num="04" label="Who it's for" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            Built for one person
            <br />
            <span className={styles.em}>at a specific point.</span>
          </h2>

          <div className={styles.audienceGrid}>
            <div className={styles.audienceCol}>
              <h3>Come if you are</h3>
              <ul className={styles.audienceList}>
                {AUDIENCE_FOR.map((a) => (
                  <li key={a.lead} className={styles.audienceItem}>
                    <Check size={16} className={styles.audienceIcon} aria-hidden="true" />
                    <span>
                      <strong>{a.lead}</strong> {a.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.audienceCol}>
              <h3>Skip it if you are</h3>
              <ul className={styles.audienceList}>
                {AUDIENCE_NOT_FOR.map((a) => (
                  <li key={a.lead} className={styles.audienceItem}>
                    <Minus size={16} className={styles.audienceIconMuted} aria-hidden="true" />
                    <span>
                      <strong>{a.lead}</strong> {a.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Instructor ───────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionLabel num="05" label="Your instructor" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            Taught by the person
            <br />
            <span className={styles.em}>who built the course.</span>
          </h2>

          <div className={styles.instructor}>
            <div className={styles.instructorPhotoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CONFIG.instructor.photo}
                alt={CONFIG.instructor.name}
                className={styles.instructorPhoto}
                width={800}
                height={800}
                loading="lazy"
              />
            </div>

            <div>
              <h3 className={styles.instructorName}>{CONFIG.instructor.name}</h3>
              <div className={styles.instructorRole}>
                {CONFIG.instructor.role}
              </div>
              <p className={styles.instructorBio}>{CONFIG.instructor.bio}</p>
              <ul className={styles.instructorFacts}>
                {CONFIG.instructor.facts.map((fact) => (
                  <li key={fact} className={styles.instructorFact}>
                    <Check size={15} className={styles.audienceIcon} aria-hidden="true" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you leave with ──────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <SectionLabel num="06" label="What you leave with" />

          <h2 className={`${styles.display} ${styles.sectionHeading}`}>
            Ninety minutes in,
            <br />
            <span className={styles.em}>you have a plan.</span>
          </h2>

          <div className={styles.takeaways}>
            {TAKEAWAYS.map((t, i) => (
              <div key={t.lead} className={styles.takeaway}>
                <div className={styles.takeawayNum}>{index2(i)}</div>
                <p className={styles.takeawayText}>
                  <strong>{t.lead}</strong> {t.rest}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials — rendered only when real ones exist ─────────── */}
      {hasTestimonials && (
        <section className={styles.section}>
          <div className={styles.shell}>
            <SectionLabel num="07" label="From students" />

            <h2 className={`${styles.display} ${styles.sectionHeading}`}>
              What they said
              <span className={styles.emMuted}> afterwards.</span>
            </h2>

            <div className={styles.quoteList}>
              {CONFIG.testimonials.map((t) => (
                <figure key={`${t.name}-${t.role}`} className={styles.quote}>
                  <div className={styles.quoteAvatar} aria-hidden="true">
                    {t.name[0]}
                  </div>
                  <blockquote className={styles.quoteText}>
                    <span className={styles.quoteMark}>&ldquo;</span>
                    {t.quote}
                    <span className={styles.quoteMark}>&rdquo;</span>
                  </blockquote>
                  <figcaption className={styles.quoteFooter}>
                    <span className={styles.quoteName}>{t.name}</span>
                    <span className={styles.quoteRole}>{t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className={styles.finalCta} id="register">
        <div className={styles.shell}>
          <span className={styles.tagAccent}>
            <span className={styles.liveDot} aria-hidden="true" />
            {date} &middot; {time}
          </span>

          <h2 className={`${styles.display} ${styles.finalHeading}`}>
            Stop guessing
            <br />
            <span className={styles.em}>the order.</span>
          </h2>

          <p className={styles.finalLede}>
            {CONFIG.seatCap} seats, one session, no cost. The joining link is
            emailed the moment you register.
          </p>

          <div className={styles.finalActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() =>
                openRegistration("final_cta", "Reserve my free seat")
              }
            >
              Reserve my free seat
              <ArrowUpRight size={16} className={styles.arrow} aria-hidden="true" />
            </button>
          </div>

          <p className={styles.finalMeta}>
            Registering also subscribes you to Zeminent cohort updates. Unsubscribe
            any time.
          </p>
        </div>
      </section>

      <SiteFooter />

      {/* Sticky seat bar — hidden while the modal is open so it can't sit on
          top of the form on a phone. */}
      <div
        className={`${styles.seatBar} ${
          seatBarVisible && !modalOpen ? styles.seatBarVisible : ""
        }`}
        aria-hidden={!seatBarVisible || modalOpen}
      >
        <div className={styles.seatBarInner}>
          <div className={styles.seatBarCopy}>
            <div className={styles.seatBarTitle}>{CONFIG.title}</div>
            <div className={styles.seatBarMeta}>
              {date} &middot; {time} &middot; {CONFIG.priceLabel}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btnPrimary} ${styles.seatBarCta}`}
            tabIndex={seatBarVisible && !modalOpen ? 0 : -1}
            onClick={() => openRegistration("seat_bar", "Reserve my free seat")}
          >
            Reserve seat
            <ArrowRight size={14} className={styles.arrow} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mounted only while open, so the Zoho iframe isn't fetched until the
          visitor asks for it and its state resets cleanly on every open. */}
      {modalOpen && (
        <RegistrationModal
          ctaLocation={ctaLocation}
          onClose={closeRegistration}
        />
      )}
    </div>
  );
}

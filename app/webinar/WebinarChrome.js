"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./webinar.module.css";
import { WEBINAR_PATH } from "./config";

/**
 * Shared top bar for both webinar routes.
 *
 * The wordmark points at this app's own landing page, not back to the learner
 * site. The two are separate products with separate deployments, and the funnel
 * is entered from ads and shared links far more often than from the learner
 * app — so a "← Back to Zeminent" aimed at a site most visitors have never
 * seen was misleading. The footer still links across for anyone who wants it.
 */
export function WebinarTopBar({ meta, cta }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${styles.topbar} ${scrolled ? styles.topbarScrolled : ""}`}
    >
      <div className={`${styles.shell} ${styles.topbarInner}`}>
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

        <span className={styles.topbarSpacer} />

        {meta ? <span className={styles.topbarMeta}>{meta}</span> : null}
        {cta}
      </div>
    </header>
  );
}

/** Monospace numbered eyebrow with a rule — `03 —— THE STACK`. */
export function SectionLabel({ num, label }) {
  return (
    <div className={styles.sectionLabel}>
      <span className={styles.sectionLabelNum}>{num}</span>
      <span className={styles.sectionLabelRule} aria-hidden="true" />
      <span className={styles.sectionLabelText}>{label}</span>
    </div>
  );
}

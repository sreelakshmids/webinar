import styles from "./webinar.module.css";
import { WebinarTopBar } from "./WebinarChrome";
import SiteFooter from "./SiteFooter";
import { zeminentUrl } from "./config";

/**
 * Shown when no session is published in the admin panel.
 *
 * The alternative — rendering a committed placeholder date — is what this
 * replaced, and it was actively harmful: a public page advertising a session
 * that does not exist gets calendared and turned up to. Saying "nothing
 * scheduled" costs a visit; a fabricated date costs trust.
 *
 * Deliberately has no registration CTA. There is nothing to register for, and
 * a button that opens an empty or stale form is worse than no button.
 */
export default function NoSession() {
  return (
    <div className={styles.page}>
      <WebinarTopBar />

      <section className={styles.hero}>
        <span className={styles.gridBg} aria-hidden="true" />
        <span className={styles.heroGlow} aria-hidden="true" />

        <div className={styles.shell} style={{ position: "relative" }}>
          <span className={styles.tag}>No session scheduled</span>

          <h1 className={`${styles.display} ${styles.heroTitle}`}>
            <span>Nothing on the</span>
            <span className={styles.em}>calendar right now.</span>
          </h1>

          <p className={styles.heroLede}>
            We run free live sessions on becoming a job-ready full stack
            developer. There isn&rsquo;t one scheduled at the moment &mdash; the
            next one will appear here as soon as it&rsquo;s announced.
          </p>

          <div className={styles.heroActions}>
            <a href={zeminentUrl("/")} className={styles.btnPrimary}>
              Explore the Zeminent cohort
            </a>
            <a href="mailto:info@zeminent.com" className={styles.btnGhost}>
              Ask to be notified
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

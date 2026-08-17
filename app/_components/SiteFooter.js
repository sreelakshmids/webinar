import Link from "next/link";
import styles from "./footer.module.css";
import { Github, Linkedin, Twitter } from "./BrandIcons";
import { WEBINAR_PATH, zeminentUrl } from "./config";

// The learner app's footer, ported so both apps end the same way.
//
// Every entry except "This webinar" points at the learner site and is
// therefore cross-origin: absolute URLs from NEXT_PUBLIC_ZEMINENT_URL,
// rendered as plain <a>. next/link would try to soft-navigate them as
// in-app routes and 404.
// Four entries in the learner footer point at nothing — /about is not a
// route, and #trailer / #partners / #press are not section ids on its
// homepage. They are dead there too; copying them would just spread broken
// links to a second app, so each is swapped for a destination that resolves.
// The learner's own footer still has them and is worth the same fix.
const COLUMNS = [
  {
    heading: "Product",
    links: [
      { name: "Curriculum", href: zeminentUrl("/#curriculum") },
     
      { name: "FAQ", href: zeminentUrl("/#faq") },
      { name: "This webinar", href: WEBINAR_PATH, internal: true },
    ],
  },
  {
    heading: "Company",
    links: [
      // The marketing site, which is where an About page actually lives.
      { name: "About", href: "https://www.zeminent.com" },
      { name: "Instructors", href: zeminentUrl("/#instructors") },
      { name: "Courses", href: zeminentUrl("/courses") },
      { name: "Placement programme", href: zeminentUrl("/placement-program") },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <a href={zeminentUrl("/")} aria-label="Zeminent home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/zeminent-logo-v3.png"
                alt="Zeminent"
                width={114}
                height={25}
                className={styles.logo}
              />
            </a>

            <p className={styles.tagline}>
              The MERN bootcamp built like the products you&rsquo;ll ship.
            </p>

            <div className={styles.socials} aria-hidden="true">
              <span className={styles.social}>
                <Twitter size={14} />
              </span>
              <span className={styles.social}>
                <Github size={14} />
              </span>
              <span className={styles.social}>
                <Linkedin size={14} />
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} className={styles.linkCol} aria-label={col.heading}>
              <h2 className={styles.colHeading}>{col.heading}</h2>
              <ul className={styles.list}>
                {col.links.map((link) => (
                  <li key={link.name}>
                    {link.internal ? (
                      <Link href={link.href} className={styles.link}>
                        {link.name}
                      </Link>
                    ) : (
                      <a href={link.href} className={styles.link}>
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className={styles.reachCol}>
            <h2 className={styles.colHeading}>Reach Us</h2>
            <div className={styles.reach}>
              <a href="mailto:info@zeminent.com" className={styles.link} style={{ fontSize: 16 }}>
                info@zeminent.com
              </a>
              <a href="tel:+919032475086" className={styles.link} style={{ fontSize: 16 }}>
                +91 90324 75086
              </a>
              <address className={styles.address}>
                2nd Floor, 213-214,
                <br />
                Welldone Tech Park,
                <br />
                Sohna Road, Sector 48,
                <br />
                Gurugram, Haryana 122101
              </address>
            </div>
          </div>
        </div>

        <div className={styles.bar}>
          <span>&copy; 2026 Zeminent Learning &middot; India</span>
          <span>Built in India</span>
        </div>
      </div>
    </footer>
  );
}

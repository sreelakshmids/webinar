"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import styles from "./webinar.module.css";
import { formattedWebinarDate, formattedWebinarTime } from "./config";
import { buildZohoFormUrl, trackRegistrationFormOpen } from "./tracking";

/**
 * Registration modal — a Zoho Form in an iframe.
 *
 * The form itself is the single write point for the whole funnel (CRM lead,
 * webinar registrant, sheet row all subscribe to it), so nothing here posts
 * anywhere: the iframe src is the session's zohoFormUrl with the captured
 * attribution appended as query params, which is how Zoho prefills its hidden
 * fields. On submit Zoho redirects the iframe to the thank-you page; the
 * `top-redirect` handling below promotes that to a full-page navigation so the
 * visitor doesn't end up with the thank-you page rendered inside a modal.
 */
export default function RegistrationModal({ session, ctaLocation, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);

  // The component is only mounted while the modal is open, so the URL can be
  // built once in a lazy initialiser. It has to be captured at mount rather
  // than on every render because cta_location differs per button and the
  // attribution record was just updated by the click that opened this.
  const [src] = useState(() =>
    buildZohoFormUrl(session.zohoFormUrl, ctaLocation),
  );

  useEffect(() => {
    trackRegistrationFormOpen(ctaLocation);
  }, [ctaLocation]);

  // Escape to close, background scroll locked while open, focus returned to
  // whatever opened the modal on close.
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap. The iframe is one stop in the tab order; inside it,
      // focus belongs to Zoho's document and the browser handles the rest.
      const focusable = dialogRef.current?.querySelectorAll(
        'button, a[href], iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [onClose]);

  // Nothing here watches for submission, deliberately.
  //
  // Zoho submits the form with fetch() and posts no message to the parent, so
  // there is no cross-origin signal this window could observe — no load event,
  // no postMessage, and its URL is unreadable. Guessing from load counts would
  // risk sending people who never registered to the thank-you page, which
  // would corrupt registration_complete, the Key Event.
  //
  // Instead the handoff is owned by the child: when Zoho's "On Successful
  // Submission → Redirect to URL" sends the frame to our thank-you page, that
  // page is same-origin and breaks itself out to the top window. See
  // thank-you/ThankYouClient.js.
  const onFrameLoad = () => setLoaded(true);

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="wb-modal-title" className={styles.modalTitle}>
              Reserve your free seat
            </h2>
            <div className={styles.modalMeta}>
              {formattedWebinarDate(session)} &middot; {formattedWebinarTime(session)}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={styles.modalClose}
            aria-label="Close registration form"
          >
            <X size={17} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {!loaded && (
            <div className={styles.modalLoading}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>Loading registration</span>
            </div>
          )}
          <iframe
            key={src}
            src={src}
            title="Full Stack Roadmap registration form"
            className={styles.modalFrame}
            onLoad={onFrameLoad}
            /* No sandbox attribute deliberately. Zoho's form needs scripts,
               forms, same-origin and storage, and `allow-scripts` plus
               `allow-same-origin` together already defeat the sandbox for the
               framed origin — so it would buy nothing while adding a real
               chance of the form failing to render. What actually constrains
               this is the frame-src CSP on /webinar/* in next.config.mjs,
               which limits framing to Zoho's own hosts. */
          />
        </div>

        <p className={styles.modalFallback}>
          Form not loading?{" "}
          <a href={src} target="_blank" rel="noopener noreferrer">
            Open it in a new tab
          </a>
        </p>
      </div>
    </div>
  );
}

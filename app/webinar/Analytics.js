"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GA4_MEASUREMENT_ID, GA4_ENABLED } from "./config";

/**
 * Sends the page_view for the initial document load.
 *
 * gtag's own `config` page_view is disabled below (`send_page_view: false`) so
 * that this app and the learner app emit page views the same way — the learner
 * has to control the emission in order to redact auth tokens from URLs, and
 * two different page_view semantics feeding one property makes the reports
 * hard to trust.
 *
 * Client-side navigation is deliberately NOT handled here: the GA4 property
 * has Enhanced Measurement's "page changes based on browser history events"
 * enabled (visible as __ccd_em_page_view / vtp_historyEvents in the container
 * config gtag.js returns for this ID), so Google already emits a page_view on
 * every soft navigation. Firing here too would count each one twice.
 *
 * If that Enhanced Measurement toggle is ever switched off, soft navigations
 * stop being recorded and this needs to watch usePathname()/useSearchParams()
 * again — behind a Suspense boundary, or both routes lose static rendering.
 */
function PageViewTracker() {
  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const { pathname, search, href } = window.location;
    window.gtag("event", "page_view", {
      // Query string kept intact — unlike the learner app this funnel has no
      // secrets in its URLs, and the utm_* params are the whole point.
      page_path: `${pathname}${search}`,
      page_location: href,
      page_title: document.title,
    });
  }, []);

  return null;
}

/**
 * GA4 tag for the whole app.
 *
 * Mounted once in app/layout.js. It used to be rendered by each page
 * component, which meant two copies of this in the tree and two `config`
 * calls on any route change between them.
 *
 * Renders nothing when the Measurement ID isn't a real one, so pointing
 * NEXT_PUBLIC_GA4_MEASUREMENT_ID at a placeholder switches analytics off
 * cleanly instead of firing requests that land nowhere.
 */
export default function Analytics() {
  if (!GA4_ENABLED) return null;

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      <PageViewTracker />
    </>
  );
}

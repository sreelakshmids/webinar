"use client";

import Script from "next/script";
import { GTM_CONTAINER_ID, GTM_ENABLED } from "./config";

/**
 * Google Tag Manager container.
 *
 * The head snippet, as next/script rather than a raw <script>. Next injects it
 * after hydration, which is later than GTM's "as high in the <head> as
 * possible" advice but is the supported way to do this in the App Router —
 * a literal <script> in the tree is stripped from the server HTML and would
 * never run.
 *
 * The <noscript> iframe is NOT here: it has to be in the server-rendered HTML
 * immediately after <body> to do its job (its whole audience has JavaScript
 * disabled, so a client-injected copy is useless). It lives in layout.js.
 *
 * Renders nothing unless the container id is a real one, so pointing
 * NEXT_PUBLIC_GTM_CONTAINER_ID at a placeholder switches GTM off cleanly.
 */
export default function GoogleTagManager() {
  if (!GTM_ENABLED) return null;

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
      `}
    </Script>
  );
}

/**
 * The <noscript> fallback. Server-rendered, first thing inside <body>.
 */
export function GoogleTagManagerNoScript() {
  if (!GTM_ENABLED) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}

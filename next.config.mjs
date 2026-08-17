/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only. Next blocks cross-origin requests to dev assets including the
  // HMR websocket, so opening the site from a phone on the LAN renders the
  // HTML but never hydrates. Same allowance the learner app makes — testing
  // the registration modal on a real phone depends on it.
  allowedDevOrigins: [
    '10.*.*.*',
    '192.168.*.*',
    '172.16.*.*',
    '172.17.*.*',
    '172.18.*.*',
    '172.19.*.*',
    '172.2*.*.*',
    '172.30.*.*',
    '172.31.*.*',
    '*.local',
  ],
  async redirects() {
    return [
      // The app's own root and the short paths people type or print on slides.
      { source: '/', destination: '/webinar/full-stack-roadmap', permanent: false },
      { source: '/webinar', destination: '/webinar/full-stack-roadmap', permanent: false },
      { source: '/full-stack-roadmap', destination: '/webinar/full-stack-roadmap', permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Zoho Forms' success redirect is configured as
      // .../webinar/thank-you.html and the CRM + webhook flow is tested
      // against that exact URL. Serving the route at that path — as a rewrite,
      // so the address bar keeps it — means the split into a standalone app
      // needs no change on the Zoho side.
      { source: '/webinar/thank-you.html', destination: '/webinar/thank-you' },
      { source: '/webinar/full-stack-roadmap.html', destination: '/webinar/full-stack-roadmap' },
      { source: '/webinar/index.html', destination: '/webinar/full-stack-roadmap' },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Next's dev server needs three things this policy would otherwise block,
    // all of which must stay out of the production policy:
    //   - eval, for the HMR runtime;
    //   - a WebSocket back to the origin, for HMR updates. CSP3 says 'self'
    //     covers ws:// on the same origin, but not every browser implements
    //     that, so it is listed explicitly rather than left to chance;
    //   - nothing extra for frames — see the frame-src note below.
    const devScript = isDev ? " 'unsafe-eval'" : '';
    const devConnect = isDev ? ' ws: wss:' : '';

    return [
      {
        // This app is nothing but the funnel, so the policy applies site-wide
        // rather than to a /webinar/* subtree as it did inside the learner app.
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // 'self' is required, not optional: Next 16's dev-tools overlay
              // renders itself in a same-origin iframe, and because frame-src
              // is specified at all, anything not listed here is blocked —
              // which shows up as a CSP violation on every page load in dev.
              // Harmless in production, where the app frames only Zoho.
              "frame-src 'self' https://forms.zohopublic.in https://*.zoho.in https://*.zoho.com https://*.zohowebinar.in",
              `script-src 'self' 'unsafe-inline'${devScript} https://www.googletagmanager.com`,
              `connect-src 'self'${devConnect} https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com`,
              "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

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
    // The funnel now lives at the root of its own domain, so every path it
    // used while nested inside the learner app is a legacy alias. Kept as
    // redirects rather than deleted: those URLs have been shared, and a 404 on
    // a webinar link costs a registration. `permanent: false` (307) because
    // the shape may still move; switch to true once the address settles.
    const LEGACY = [
      '/webinar',
      '/webinar/full-stack-roadmap',
      '/webinar/full-stack-roadmap.html',
      '/webinar/index.html',
      '/full-stack-roadmap',
      '/index.html',
    ];
    return [
      ...LEGACY.map((source) => ({ source, destination: '/', permanent: false })),
      // Thank-you aliases, including the .html form the integration guide
      // told Zoho to use.
      { source: '/webinar/thank-you', destination: '/thank-you', permanent: false },
      { source: '/webinar/thank-you.html', destination: '/thank-you', permanent: false },
      { source: '/thank-you.html', destination: '/thank-you', permanent: false },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Instructor photos are served by the API, so its origin has to be allowed
    // in img-src or the browser blocks them — the page would show a broken
    // image with only a console warning to explain it. Derived from the same
    // env var the server-side fetch uses, so there is one value to change.
    let apiOrigin = '';
    try {
      apiOrigin = new URL(process.env.API_URL || 'http://localhost:4000/api').origin;
    } catch {
      apiOrigin = '';
    }

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
              `img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com${
                apiOrigin ? ` ${apiOrigin}` : ''
              }`,
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

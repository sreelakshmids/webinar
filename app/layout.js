import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN } from "./_components/config";
import Analytics from "./_components/Analytics";

// The same three families the Zeminent learner site loads, exposed under the
// same CSS variable names. webinar.module.css reads --font-geist-sans /
// --font-geist-mono / --font-fraunces, so keeping the names identical is what
// lets the stylesheet move across untouched.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata = {
  // Set on the root so every route — including the generated social-card
  // route — resolves relative asset URLs against the real origin instead of
  // Next's localhost:3000 fallback.
  metadataBase: new URL(SITE_ORIGIN),
  title: "Zeminent Webinars",
  description: "Free live sessions from the Zeminent engineering team.",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicons/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      {
        url: "/favicons/android-icon-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    shortcut: "/favicons/favicon.ico",
    apple: [
      { url: "/favicons/apple-icon-180x180.png", sizes: "180x180" },
      { url: "/favicons/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/favicons/apple-icon-120x120.png", sizes: "120x120" },
    ],
  },
  manifest: "/favicons/manifest.json",
};

export const viewport = {
  themeColor: "#0d1117",
};

// The funnel is dark-only — the Zoho form embedded in the registration modal
// is themed dark on Zoho's side and cannot follow a client-side toggle. Unlike
// the learner app there is no ThemeProvider here, so colorScheme is fixed.
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}

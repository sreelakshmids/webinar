import WebinarLanding from "./_components/WebinarLanding";
import NoSession from "./_components/NoSession";
import { getSession } from "./_components/getWebinar";
import {
  PAGE,
  WEBINAR_PATH,
  SITE_ORIGIN,
  formattedWebinarDate,
  formattedWebinarTime,
  webinarEndDate,
  webinarStartDate,
} from "./_components/config";

// Metadata is generated, not static: every word of it comes from the session
// an admin published. getSession() is a cached fetch, so this and the page
// body share one request.
export async function generateMetadata() {
  const session = await getSession();

  if (!session) {
    return {
      metadataBase: new URL(SITE_ORIGIN),
      title: `${PAGE.fallbackTitle} | Zeminent`,
      description: "Free live sessions from the Zeminent engineering team.",
      // Nothing to index while there is no session — an empty page ranking for
      // "Zeminent webinar" is worse than not ranking at all.
      robots: { index: false, follow: true },
    };
  }

  const title = `${session.title} — free live webinar | Zeminent`;
  const description = `${session.subtitle} ${formattedWebinarDate(session)} at ${formattedWebinarTime(session)}.`;

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    alternates: { canonical: WEBINAR_PATH },
    openGraph: {
      type: "website",
      title,
      description,
      url: WEBINAR_PATH,
      siteName: "Zeminent Learning",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport = { themeColor: "#0d1117" };

// Event structured data — lets the session surface as a rich result and gives
// the date, price and registration URL to anything that reads schema.org.
function eventJsonLd(session) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: session.title,
    description: session.subtitle,
    startDate: webinarStartDate(session).toISOString(),
    endDate: webinarEndDate(session).toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "VirtualLocation",
      url: `${SITE_ORIGIN}${WEBINAR_PATH}`,
    },
    organizer: {
      "@type": "Organization",
      name: "Zeminent",
      url: "https://www.zeminent.com",
    },
    ...(session.instructor?.name
      ? { performer: { "@type": "Person", name: session.instructor.name } }
      : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${WEBINAR_PATH}`,
    },
  };
}

export default async function WebinarLandingPage() {
  const session = await getSession();

  // No published session: say so rather than render invented details.
  if (!session) return <NoSession />;

  return (
    <>
      <script
        type="application/ld+json"
        // Admin-authored values, JSON-encoded — JSON.stringify escapes the
        // characters that could break out of a <script> block.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(session)) }}
      />
      <WebinarLanding session={session} />
    </>
  );
}

import WebinarLanding from "./_components/WebinarLanding";
import {
  CONFIG,
  WEBINAR_PATH,
  formattedWebinarDate,
  formattedWebinarTime,
  webinarEndDate,
  webinarStartDate,
  SITE_ORIGIN,
} from "./_components/config";

const TITLE = `${CONFIG.title} — free live webinar | Zeminent`;
const DESCRIPTION = `${CONFIG.subtitle} ${formattedWebinarDate()} at ${formattedWebinarTime()}. Free.`;

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: WEBINAR_PATH },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: WEBINAR_PATH,
    siteName: "Zeminent Learning",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Next 15+ wants theme-color on the viewport export, not on metadata.
// #0d1117 is zeminent.com's own theme-color, so the browser chrome matches
// the page on mobile.
export const viewport = {
  themeColor: "#0d1117",
};

// Event structured data — lets the session surface as a rich result and gives
// the date/price/registration URL to anything that reads schema.org.
function eventJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: CONFIG.title,
    description: CONFIG.subtitle,
    startDate: webinarStartDate().toISOString(),
    endDate: webinarEndDate().toISOString(),
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
    performer: {
      "@type": "Person",
      name: CONFIG.instructor.name,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${WEBINAR_PATH}`,
    },
  };
}

export default function FullStackRoadmapWebinarPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Values are our own constants, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd()) }}
      />
      <WebinarLanding />
    </>
  );
}

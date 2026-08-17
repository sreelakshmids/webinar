import ThankYouClient from "../_components/ThankYouClient";
import { getSession } from "../_components/getWebinar";
import { PAGE, SITE_ORIGIN } from "../_components/config";

export async function generateMetadata() {
  const session = await getSession();
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: session
      ? `You're registered — ${session.title} | Zeminent`
      : `You're registered | ${PAGE.fallbackTitle}`,
    description:
      "Your seat is confirmed. The joining link is on its way to your inbox.",
    // A conversion page has no business in search results, and indexing it also
    // lets people reach it without registering.
    robots: { index: false, follow: false },
  };
}

export const viewport = { themeColor: "#0d1117" };

export default async function WebinarThankYouPage() {
  const session = await getSession();
  return <ThankYouClient session={session} />;
}

import ThankYouClient from "../_components/ThankYouClient";
import { CONFIG } from "../_components/config";

export const metadata = {
  title: `You're registered — ${CONFIG.title} | Zeminent`,
  description:
    "Your seat for the Zeminent Full Stack Roadmap webinar is confirmed. The joining link is on its way to your inbox.",
  // A conversion page has no business in search results, and indexing it also
  // lets people reach it without registering.
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#0d1117",
};

export default function WebinarThankYouPage() {
  return <ThankYouClient />;
}

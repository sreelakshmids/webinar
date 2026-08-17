import { ImageResponse } from "next/og";
import {
  formattedWebinarDate,
  formattedWebinarTime,
} from "./_components/config";
import { getSession } from "./_components/getWebinar";

// Social card, generated at build time rather than shipped as a binary.
//
// The metadata used to point at a static og-full-stack-roadmap.jpg, which was
// never created — so every share preview requested a 404. A file convention
// route means Next wires the correct absolute URL into both the Open Graph and
// Twitter tags itself, and the card can never drift from the session data the way a
// hand-exported JPEG would.
//
// Kept to system fonts on purpose: ImageResponse cannot read the next/font
// files, and fetching Geist at build time would make the build depend on the
// network. The brand comes through in the colour and composition instead.

export const alt = "Zeminent webinar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0d1117";
const FG = "#e8ecef";
const DIM = "#a8b0bb";
const MUTE = "#6b7280";
const ACCENT = "#5eead4";

export default async function OpengraphImage() {
  const session = await getSession();

  // No published session: a generic brand card. Better a plain card than one
  // announcing a date that does not exist, since social previews get cached
  // by every platform that scrapes them.

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "72px 80px",
          color: FG,
        }}
      >
        {/* Accent hairline along the top edge, echoing the page's rules */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: ACCENT,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: ACCENT,
            }}
          />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTE,
            }}
          >
            {session ? "Zeminent · Free live webinar" : "Zeminent · Webinars"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, lineHeight: 1.05, letterSpacing: -2 }}>
            {session ? "Become a job-ready" : "Free live sessions"}
          </div>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1.05,
              letterSpacing: -2,
              fontStyle: "italic",
              color: ACCENT,
            }}
          >
            {session ? "full stack developer." : "for future engineers."}
          </div>
          {/* Single interpolated string, not text-beside-expression: Satori
              rejects any element with more than one child unless it declares
              an explicit display, and `{value} text` counts as two. */}
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: DIM,
              maxWidth: 900,
            }}
          >
            {session
              ? `${session.durationMinutes} minutes on exactly what to learn, in what order, and what to skip.`
              : "Announcements appear here as soon as the next session is scheduled."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: 28,
            fontSize: 26,
            color: DIM,
          }}
        >
          <div style={{ display: "flex" }}>
            {session ? `${formattedWebinarDate(session)} · ${formattedWebinarTime(session)}` : "webinar.zeminent.com"}
          </div>
          <div style={{ display: "flex", color: ACCENT }}>
            {session ? session.priceLabel : ""}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

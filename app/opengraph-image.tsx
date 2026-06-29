import { ImageResponse } from "next/og";

// Default social-share card (1200×630). Next also uses this for the Twitter
// card via the summary_large_image metadata in app/layout.tsx.
export const alt = "SkillSprinter — Master any skill, one question at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: -1,
            opacity: 0.95,
          }}
        >
          SkillSprinter
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.04,
            maxWidth: 940,
          }}
        >
          Master any skill, one question at a time.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 34,
            opacity: 0.92,
            maxWidth: 900,
          }}
        >
          AI-personalized, gamified practice for SAT, GMAT, Python, Spanish & more.
        </div>
      </div>
    ),
    { ...size }
  );
}

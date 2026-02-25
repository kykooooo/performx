import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PerformX – Coaching Football Individuel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b0b0d 0%, #1a1c21 50%, #0b0b0d 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 30%, rgba(255,106,0,0.25), transparent 50%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #ffffff, #ff6a00)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            PerformX
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Coaching Football Individuel
          </div>
          <div
            style={{
              marginTop: 20,
              width: 100,
              height: 4,
              borderRadius: 2,
              background: "linear-gradient(90deg, #ff6a00, #ff8a00)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 600,
              textAlign: "center",
              display: "flex",
            }}
          >
            Trouve ton coach, progresse rapidement
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

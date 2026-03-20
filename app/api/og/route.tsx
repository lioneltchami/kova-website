import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1A1A2E",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ fontSize: "72px", fontWeight: "bold", color: "#C0C0C8" }}>
          KOVA
        </div>
      </div>
      <div
        style={{
          fontSize: "32px",
          color: "#C0C0C8",
          opacity: 0.8,
          marginBottom: "16px",
        }}
      >
        AI Dev FinOps
      </div>
      <div style={{ fontSize: "24px", color: "#4361EE" }}>
        See exactly what your AI tools cost.
      </div>
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginTop: "40px",
          fontSize: "18px",
          color: "#8A8A94",
        }}
      >
        <span>5 AI Tools</span>
        <span>|</span>
        <span>Real-Time Costs</span>
        <span>|</span>
        <span>From $15/seat</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

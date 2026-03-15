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
        AI Coding Orchestration CLI
      </div>
      <div style={{ fontSize: "24px", color: "#4361EE" }}>
        Plan the hunt. Run the pack.
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
        <span>17+ Specialist Agents</span>
        <span>|</span>
        <span>415+ Tests</span>
        <span>|</span>
        <span>Free & Open Source</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

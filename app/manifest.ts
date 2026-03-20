import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kova - AI Dev FinOps",
    short_name: "Kova",
    description:
      "Track AI development costs across Claude Code, Cursor, Copilot, and more",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1a1a2e",
    theme_color: "#4361ee",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

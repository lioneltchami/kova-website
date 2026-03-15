import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ defaultTheme: "dark", forcedTheme: "dark" }}>
      <DocsLayout
        tree={source.pageTree}
        nav={{
          title: "Kova",
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}

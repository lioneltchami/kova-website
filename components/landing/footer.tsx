import { WolfLogo } from "@/components/landing/wolf-logo";

const links = {
  Product: [
    { label: "Docs", href: "/docs" },
    { label: "GitHub", href: "https://github.com/lioneltchami/kova-cli" },
    { label: "npm", href: "https://www.npmjs.com/package/kova-cli" },
  ],
  Resources: [
    { label: "Getting Started", href: "/docs/getting-started/installation" },
    { label: "Commands", href: "/docs/commands/init" },
    { label: "Guides", href: "/docs/guides/plan-templates" },
  ],
  Community: [
    {
      label: "GitHub Discussions",
      href: "https://github.com/lioneltchami/kova-cli/discussions",
    },
    {
      label: "Report Issue",
      href: "https://github.com/lioneltchami/kova-cli/issues",
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0d0d] py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Compact 3-column layout: branding | links | links */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <WolfLogo size={24} />
            <div>
              <span className="font-bold text-white text-sm">Kova</span>
              <p className="text-xs text-[#C0C0C8]/50">
                Plan the hunt. Run the pack.
              </p>
            </div>
          </div>

          {/* Link groups in a row */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {Object.entries(links).map(([group, items]) => (
              <div key={group}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#C0C0C8]/50">
                  {group}
                </h3>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="text-xs text-[#C0C0C8]/60 transition-colors hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#C0C0C8]/30">
            MIT License | Built with Next.js
          </p>
          <p className="text-[10px] text-[#C0C0C8]/30">
            &copy; {new Date().getFullYear()} Kova
          </p>
        </div>
      </div>
    </footer>
  );
}

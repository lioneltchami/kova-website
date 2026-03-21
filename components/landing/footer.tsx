import { getTranslations } from "next-intl/server";
import { WolfLogo } from "@/components/landing/wolf-logo";
import { FooterLinks } from "@/components/landing/footer-links";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const links = {
    [t("product")]: [
      { label: tNav("docs"), href: "/docs" },
      { label: tNav("pricing"), href: "/pricing" },
      {
        label: tNav("github"),
        href: "https://github.com/lioneltchami/kova-cli",
      },
      { label: tNav("npm"), href: "https://www.npmjs.com/package/kova-cli" },
    ],
    [t("resources")]: [
      {
        label: t("gettingStarted"),
        href: "/docs/getting-started/installation",
      },
      { label: t("commands"), href: "/docs/commands/init" },
      { label: t("guides"), href: "/docs/guides/plan-templates" },
    ],
    [t("community")]: [
      {
        label: t("githubDiscussions"),
        href: "https://github.com/lioneltchami/kova-cli/discussions",
      },
      {
        label: t("reportIssue"),
        href: "https://github.com/lioneltchami/kova-cli/issues",
      },
    ],
  };

  return (
    <footer className="border-t border-gray-200 dark:border-kova-border bg-gray-50 dark:bg-kova-surface py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Compact 3-column layout: branding | links | links */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <WolfLogo size={24} />
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                Kova
              </span>
              <p className="text-xs text-gray-500 dark:text-kova-silver-dim/70">
                {t("tagline")}
              </p>
            </div>
          </div>

          {/* Link groups in a row */}
          <FooterLinks>
            {Object.entries(links).map(([group, items]) => (
              <div key={group}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-kova-silver-dim/70">
                  {group}
                </h3>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="text-xs text-gray-500 dark:text-kova-silver-dim transition-colors hover:text-gray-900 dark:hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </FooterLinks>
        </div>

        {/* Bottom line */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-kova-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-kova-silver-dim/40">
            {tCommon("mitLicense")}
          </p>
          <p className="text-xs text-gray-400 dark:text-kova-silver-dim/40">
            &copy; {new Date().getFullYear()} Kova
          </p>
        </div>
      </div>
    </footer>
  );
}

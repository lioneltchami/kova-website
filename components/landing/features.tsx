"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  GitBranch,
  Github,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";
import { ShiftCard } from "@/components/ui/shift-card";
import { StripeBgGuides } from "@/components/ui/stripe-bg-guides";
import { TextAnimate } from "@/components/ui/text-animate";

const featureIcons: ReactNode[] = [
  <Users key="users" size={24} />,
  <GitBranch key="gitbranch" size={24} />,
  <Layers key="layers" size={24} />,
  <ShieldCheck key="shield" size={24} />,
  <BarChart3 key="barchart" size={24} />,
  <Github key="github" size={24} />,
];

const featureKeys = [1, 2, 3, 4, 5, 6] as const;

export function Features() {
  const t = useTranslations("features");

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <StripeBgGuides color="#4361EE" count={6} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            <TextAnimate animation="slideUp">{t("heading")}</TextAnimate>
          </h2>
          <p className="mx-auto max-w-xl text-gray-700 dark:text-kova-silver">
            {t("subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((num, idx) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.45,
                delay: idx * 0.08,
                ease: "easeOut",
              }}
            >
              <ShiftCard
                title={t(`feature${num}Title`)}
                icon={featureIcons[idx]}
                hoverContent={
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-kova-silver">
                    {t(`feature${num}Hover`)}
                  </p>
                }
              >
                {t(`feature${num}Description`)}
              </ShiftCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

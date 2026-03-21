"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function FooterLinks({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex flex-wrap gap-x-12 gap-y-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

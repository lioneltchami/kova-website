"use client";

import { motion } from "framer-motion";
import { TextAnimate } from "@/components/ui/text-animate";

const testimonials = [
  {
    quote:
      "Kova turned a 3-hour refactor into a 20-minute plan-and-build. The specialist agents actually know what they are doing.",
    name: "Alex Chen",
    role: "Senior Engineer",
    company: "Series A Startup",
  },
  {
    quote:
      "The token tracking alone saved us hundreds. Knowing exactly what each build costs changed how we think about AI-assisted development.",
    name: "Sarah Kim",
    role: "Tech Lead",
    company: "Product Agency",
  },
  {
    quote:
      "I was skeptical about another AI tool, but the planning phase is what sets Kova apart. It actually analyzes dependencies before coding.",
    name: "Marcus Rivera",
    role: "Full-Stack Developer",
    company: "Independent",
  },
];

export function SocialProof() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            <TextAnimate animation="slideUp">
              What Developers Are Saying
            </TextAnimate>
          </h2>
          <p className="mx-auto max-w-xl text-[#C0C0C8]">
            Early adopters weigh in on what makes Kova different.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1A1A2E] p-6"
            >
              <p className="flex-1 text-sm leading-relaxed text-[#C0C0C8]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="mt-0.5 text-xs text-[#C0C0C8]/60">
                  {testimonial.role} &middot; {testimonial.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

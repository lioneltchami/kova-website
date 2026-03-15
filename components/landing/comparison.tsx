import { TextAnimate } from "@/components/ui/text-animate";
import { Check, Minus, X } from "lucide-react";

const rows = [
  {
    feature: "Planning phase",
    kova: "Yes",
    ralphy: "No",
    aider: "No",
    cursor: "Partial",
  },
  {
    feature: "Specialist agents",
    kova: "17+",
    ralphy: "No",
    aider: "No",
    cursor: "No",
  },
  {
    feature: "Task dependencies",
    kova: "Explicit",
    ralphy: "Implicit",
    aider: "No",
    cursor: "No",
  },
  {
    feature: "Independent QA",
    kova: "Yes",
    ralphy: "No",
    aider: "No",
    cursor: "No",
  },
  {
    feature: "Model tiering",
    kova: "Auto",
    ralphy: "N/A",
    aider: "Manual",
    cursor: "Auto",
  },
  {
    feature: "Crash recovery",
    kova: "Yes",
    ralphy: "Partial",
    aider: "Git",
    cursor: "Auto",
  },
  {
    feature: "GitHub PRs",
    kova: "Yes",
    ralphy: "No",
    aider: "No",
    cursor: "No",
  },
  {
    feature: "Token tracking",
    kova: "Yes",
    ralphy: "No",
    aider: "No",
    cursor: "No",
  },
  {
    feature: "Price",
    kova: "Free",
    ralphy: "Free",
    aider: "Free",
    cursor: "$20/mo",
  },
];

function CellValue({ value, isKova }: { value: string; isKova?: boolean }) {
  if (isKova) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-[#4361EE]">
        <Check size={14} className="shrink-0" />
        {value}
      </span>
    );
  }

  if (value === "No" || value === "N/A") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#C0C0C8]/40">
        <X size={14} className="shrink-0" />
        {value}
      </span>
    );
  }

  if (
    value === "Partial" ||
    value === "Implicit" ||
    value === "Manual" ||
    value === "Git"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#C0C0C8]/60">
        <Minus size={14} className="shrink-0" />
        {value}
      </span>
    );
  }

  return <span className="text-[#C0C0C8]/60">{value}</span>;
}

export function Comparison() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            <TextAnimate animation="slideUp">How Kova Compares</TextAnimate>
          </h2>
          <p className="mx-auto max-w-xl text-[#C0C0C8]">
            Most AI coding tools react. Kova plans, executes, and validates --
            then ships.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#1A1A2E]">
                <th className="px-6 py-4 text-left text-[#C0C0C8]/60 font-medium">
                  Feature
                </th>
                <th className="px-6 py-4 text-center font-semibold text-[#4361EE]">
                  Kova
                </th>
                <th className="px-6 py-4 text-center text-[#C0C0C8]/50 font-medium">
                  Ralphy
                </th>
                <th className="px-6 py-4 text-center text-[#C0C0C8]/50 font-medium">
                  Aider
                </th>
                <th className="px-6 py-4 text-center text-[#C0C0C8]/50 font-medium">
                  Cursor
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "bg-[#0d0d0d]" : "bg-[#1A1A2E]/30"
                  }`}
                >
                  <td className="px-6 py-4 text-[#C0C0C8] font-medium">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.kova} isKova />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.ralphy} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.aider} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.cursor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

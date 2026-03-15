"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

interface CodeBlockProps {
  code?: string;
  language?: string;
  tabs?: CodeTab[];
  className?: string;
}

const KEYWORDS = [
  "const",
  "let",
  "var",
  "function",
  "return",
  "import",
  "export",
  "from",
  "default",
  "async",
  "await",
  "if",
  "else",
  "for",
  "while",
  "class",
  "extends",
  "new",
  "true",
  "false",
  "null",
  "undefined",
  "type",
  "interface",
];

function TokenizeLine({ line }: { line: string }) {
  const tokens: { text: string; color: string }[] = [];
  const parts = line.split(/(\s+|[{}()[\],;.]|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*)/);

  for (const part of parts) {
    if (!part) continue;
    if (/^["'`]/.test(part)) {
      tokens.push({ text: part, color: "#86efac" });
    } else if (/^\/\//.test(part)) {
      tokens.push({ text: part, color: "#6b7280" });
    } else if (/^\d/.test(part)) {
      tokens.push({ text: part, color: "#fbbf24" });
    } else if (KEYWORDS.includes(part.trim())) {
      tokens.push({ text: part, color: "#93c5fd" });
    } else {
      tokens.push({ text: part, color: "#e2e8f0" });
    }
  }

  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color }}>
          {t.text}
        </span>
      ))}
    </>
  );
}

function renderLines(code: string) {
  return code.split("\n").map((line, i) => (
    <div key={i} className="table-row">
      <span className="table-cell pr-6 select-none text-right text-[#C0C0C8]/30 text-xs w-8">
        {i + 1}
      </span>
      <span className="table-cell">
        <TokenizeLine line={line} />
      </span>
    </div>
  ));
}

export function CodeBlock({
  code = "",
  language = "typescript",
  tabs,
  className,
}: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTabs: CodeTab[] = tabs || [{ label: language, code, language }];
  const current = activeTabs[activeTab];

  async function handleCopy() {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 overflow-hidden bg-[#0d0d0d] font-mono text-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-4 py-2">
        <div className="flex gap-1">
          {activeTabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-3 py-1 rounded text-xs transition-colors",
                i === activeTab
                  ? "bg-[#4361EE] text-white"
                  : "text-[#C0C0C8] hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-[#C0C0C8] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="table w-full">{renderLines(current.code)}</div>
      </div>
    </div>
  );
}

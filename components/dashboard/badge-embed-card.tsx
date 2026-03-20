"use client";
import { useState } from "react";

interface BadgeEmbedCardProps {
  userId: string;
  baseUrl: string;
}

export function BadgeEmbedCard({ userId, baseUrl }: BadgeEmbedCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const badgeUrl = `${baseUrl}/api/badges/${userId}`;
  const svgUrl = `${baseUrl}/api/badges/${userId}/svg`;
  const shieldsUrl = `https://img.shields.io/endpoint?url=${encodeURIComponent(badgeUrl)}`;

  const formats = [
    { label: "Markdown", code: `![AI Costs](${shieldsUrl})` },
    { label: "HTML", code: `<img src="${shieldsUrl}" alt="AI Costs" />` },
    { label: "URL (Shields.io)", code: shieldsUrl },
    { label: "SVG Direct", code: svgUrl },
  ];

  const copyToClipboard = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-kova-silver mb-2">
        Cost Badge
      </h3>
      <p className="text-sm text-kova-silver-dim mb-4">
        Add your AI cost badge to READMEs and profiles.
      </p>

      {/* Preview */}
      <div className="mb-4 p-3 bg-kova-charcoal rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shieldsUrl} alt="AI costs badge preview" className="h-5" />
      </div>

      {/* Embed codes */}
      <div className="space-y-3">
        {formats.map(({ label, code }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-kova-silver-dim">{label}</span>
              <button
                onClick={() => copyToClipboard(code, label)}
                className="text-xs text-kova-blue hover:text-kova-blue-light transition-colors"
              >
                {copied === label ? "Copied!" : "Copy"}
              </button>
            </div>
            <code className="block text-xs bg-kova-charcoal text-kova-silver p-2 rounded overflow-x-auto font-mono whitespace-pre">
              {code}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { useState } from "react";

interface SsoSettingsFormProps {
  isEnterprise: boolean;
  entityId: string;
  acsUrl: string;
  currentIdpMetadataUrl?: string | null;
  connectionStatus?: "connected" | "disconnected" | null;
  lastAuthAt?: string | null;
}

export function SsoSettingsForm({
  isEnterprise,
  entityId,
  acsUrl,
  currentIdpMetadataUrl,
  connectionStatus,
  lastAuthAt,
}: SsoSettingsFormProps) {
  const [idpMetadataUrl, setIdpMetadataUrl] = useState(
    currentIdpMetadataUrl ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!idpMetadataUrl.trim()) {
      setError("IdP Metadata URL is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idp_metadata_url: idpMetadataUrl }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save SSO configuration.");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!isEnterprise) {
    return (
      <div className="flex items-center gap-3 py-8 px-4 text-center flex-col">
        <Lock size={24} className="text-kova-silver-dim" />
        <p className="text-sm text-kova-silver-dim">
          SSO / SAML configuration requires an Enterprise plan.
        </p>
        <a
          href="/pricing"
          className="inline-block mt-2 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
        >
          Upgrade to Enterprise
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Connection status */}
      {connectionStatus && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
            connectionStatus === "connected"
              ? "bg-green-900/20 border-green-800/40 text-green-400"
              : "bg-kova-charcoal-light border-kova-border text-kova-silver-dim"
          }`}
        >
          {connectionStatus === "connected" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span>
            {connectionStatus === "connected"
              ? "SSO connected"
              : "SSO not configured"}
          </span>
          {lastAuthAt && connectionStatus === "connected" && (
            <span className="ml-auto text-xs text-green-400/70">
              Last auth:{" "}
              {new Date(lastAuthAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="px-3 py-2 bg-green-900/20 border border-green-800/40 rounded-lg text-sm text-green-400">
          SSO configuration saved.
        </div>
      )}

      {/* IdP Metadata URL */}
      <div>
        <label className="block text-xs text-kova-silver-dim mb-1.5">
          SAML IdP Metadata URL
        </label>
        <input
          type="url"
          required
          value={idpMetadataUrl}
          onChange={(e) => setIdpMetadataUrl(e.target.value)}
          placeholder="https://your-idp.example.com/metadata.xml"
          className="w-full px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-kova-blue transition-colors"
        />
        <p className="text-xs text-kova-silver-dim mt-1">
          Provide the metadata URL from your Identity Provider (Okta, Azure AD,
          etc).
        </p>
      </div>

      {/* Entity ID (read-only) */}
      <div>
        <label className="block text-xs text-kova-silver-dim mb-1.5">
          Entity ID (SP)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={entityId}
            className="flex-1 px-3 py-2 text-sm bg-kova-charcoal/60 border border-kova-border rounded-lg text-kova-silver-dim font-mono cursor-not-allowed"
          />
        </div>
      </div>

      {/* ACS URL (read-only) */}
      <div>
        <label className="block text-xs text-kova-silver-dim mb-1.5">
          ACS URL (Assertion Consumer Service)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={acsUrl}
            className="flex-1 px-3 py-2 text-sm bg-kova-charcoal/60 border border-kova-border rounded-lg text-kova-silver-dim font-mono cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-kova-silver-dim mt-1">
          Configure this as the ACS URL in your Identity Provider settings.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save SSO Configuration"}
      </button>
    </form>
  );
}

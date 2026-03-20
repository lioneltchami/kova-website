"use client";

import { useCallback, useEffect, useState } from "react";

interface NotificationPreferences {
	email_alerts: boolean;
	email_digest: boolean;
	slack_alerts: boolean;
	alert_threshold: "critical_only" | "high" | "all";
	weekly_reports_enabled: boolean;
}

interface TeamData {
	slack_webhook_url?: string | null;
	notification_preferences?: NotificationPreferences | null;
}

const defaultPrefs: NotificationPreferences = {
	email_alerts: true,
	email_digest: true,
	slack_alerts: true,
	alert_threshold: "high",
	weekly_reports_enabled: true,
};

interface ToggleProps {
	id: string;
	label: string;
	description?: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}

function Toggle({
	id,
	label,
	description,
	checked,
	disabled,
	onChange,
}: ToggleProps) {
	return (
		<label
			htmlFor={id}
			className={`flex items-start justify-between gap-4 py-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}
		>
			<div className="min-w-0">
				<span className="block text-sm font-medium text-kova-silver">
					{label}
				</span>
				{description && (
					<span className="block text-xs text-kova-silver-dim mt-0.5">
						{description}
					</span>
				)}
			</div>
			<div className="relative flex-shrink-0 mt-0.5">
				<input
					type="checkbox"
					id={id}
					checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
					className="sr-only peer"
				/>
				<div
					className={`
            w-10 h-6 rounded-full border transition-colors
            ${
							checked && !disabled
								? "bg-kova-blue border-kova-blue"
								: "bg-kova-charcoal-light border-kova-border"
						}
            peer-focus-visible:ring-2 peer-focus-visible:ring-kova-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-kova-charcoal
          `}
				>
					<span
						className={`
              absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform
              ${checked ? "translate-x-4" : "translate-x-0"}
            `}
					/>
				</div>
			</div>
		</label>
	);
}

interface NotificationSettingsProps {
	teamId?: string;
}

export function NotificationSettings({ teamId }: NotificationSettingsProps) {
	const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
	const [hasSlack, setHasSlack] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingWeeklyReport, setSavingWeeklyReport] = useState(false);
	const [toast, setToast] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const fetchPrefs = useCallback(async () => {
		setLoading(true);
		try {
			const [teamRes, profileRes] = await Promise.all([
				fetch("/api/v1/team"),
				fetch("/api/v1/notifications/preferences"),
			]);

			if (teamRes.ok) {
				const data = (await teamRes.json()) as { team?: TeamData };
				if (data.team) {
					setHasSlack(!!data.team.slack_webhook_url);
					if (data.team.notification_preferences) {
						setPrefs((prev) => ({
							...prev,
							...data.team!.notification_preferences,
						}));
					}
				}
			}

			if (profileRes.ok) {
				const data = (await profileRes.json()) as {
					preferences?: { weekly_reports_enabled?: boolean };
				};
				if (typeof data.preferences?.weekly_reports_enabled === "boolean") {
					setPrefs((prev) => ({
						...prev,
						weekly_reports_enabled: data.preferences!.weekly_reports_enabled!,
					}));
				}
			}
		} catch {
			// silent -- non-critical load failure
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchPrefs();
	}, [fetchPrefs]);

	function showToast(type: "success" | "error", message: string) {
		setToast({ type, message });
		setTimeout(() => setToast(null), 3500);
	}

	async function handleSave() {
		setSaving(true);
		try {
			const res = await fetch("/api/v1/team", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notification_preferences: prefs }),
			});
			if (res.ok) {
				showToast("success", "Notification preferences saved.");
			} else {
				const body = (await res.json()) as { error?: string };
				showToast("error", body.error ?? "Failed to save preferences.");
			}
		} catch {
			showToast("error", "Network error. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	function update<K extends keyof NotificationPreferences>(
		key: K,
		value: NotificationPreferences[K],
	) {
		setPrefs((prev) => ({ ...prev, [key]: value }));
	}

	async function handleWeeklyReportToggle(enabled: boolean) {
		setPrefs((prev) => ({ ...prev, weekly_reports_enabled: enabled }));
		setSavingWeeklyReport(true);
		try {
			const res = await fetch("/api/v1/notifications/preferences", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ weekly_reports_enabled: enabled }),
			});
			if (res.ok) {
				showToast("success", "Weekly report preference saved.");
			} else {
				const body = (await res.json()) as { error?: string };
				showToast("error", body.error ?? "Failed to save preference.");
				// Revert optimistic update on failure
				setPrefs((prev) => ({ ...prev, weekly_reports_enabled: !enabled }));
			}
		} catch {
			showToast("error", "Network error. Please try again.");
			setPrefs((prev) => ({ ...prev, weekly_reports_enabled: !enabled }));
		} finally {
			setSavingWeeklyReport(false);
		}
	}

	if (!teamId) {
		return (
			<p className="text-sm text-kova-silver-dim">
				Notification preferences are available for team accounts only.{" "}
				<a
					href="/pricing"
					className="text-kova-blue hover:text-kova-blue-light transition-colors"
				>
					Upgrade to Pro
				</a>{" "}
				to unlock team features.
			</p>
		);
	}

	if (loading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="h-10 bg-kova-charcoal-light rounded-lg animate-pulse"
					/>
				))}
			</div>
		);
	}

	return (
		<div>
			{/* Toast */}
			{toast && (
				<div
					className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
						toast.type === "success"
							? "bg-green-900/30 border-green-800/50 text-green-400"
							: "bg-red-900/30 border-red-800/50 text-red-400"
					}`}
					role="alert"
				>
					{toast.message}
				</div>
			)}

			<div className="divide-y divide-kova-border">
				<Toggle
					id="email_alerts"
					label="Email budget alerts"
					description="Receive an email when a budget threshold is breached."
					checked={prefs.email_alerts}
					onChange={(v) => update("email_alerts", v)}
				/>
				<Toggle
					id="email_digest"
					label="Weekly cost digest"
					description="A weekly summary of AI tool spend delivered to your inbox."
					checked={prefs.email_digest}
					onChange={(v) => update("email_digest", v)}
				/>
				<Toggle
					id="slack_alerts"
					label="Slack budget alerts"
					description={
						hasSlack
							? "Send budget alert notifications to your configured Slack channel."
							: "Connect a Slack webhook in the Slack Integration section to enable."
					}
					checked={prefs.slack_alerts}
					disabled={!hasSlack}
					onChange={(v) => update("slack_alerts", v)}
				/>
				<Toggle
					id="weekly_reports_enabled"
					label="Weekly Cost Report"
					description="Receive a weekly AI cost summary every Monday morning."
					checked={prefs.weekly_reports_enabled}
					disabled={savingWeeklyReport}
					onChange={handleWeeklyReportToggle}
				/>
			</div>

			{/* Alert threshold */}
			<div className="mt-4 pt-4 border-t border-kova-border">
				<label
					htmlFor="alert_threshold"
					className="block text-sm font-medium text-kova-silver mb-1.5"
				>
					Alert threshold
				</label>
				<p className="text-xs text-kova-silver-dim mb-2">
					Controls which budget breaches trigger notifications.
				</p>
				<select
					id="alert_threshold"
					value={prefs.alert_threshold}
					onChange={(e) =>
						update(
							"alert_threshold",
							e.target.value as NotificationPreferences["alert_threshold"],
						)
					}
					className="w-full sm:w-64 bg-kova-charcoal-light border border-kova-border text-kova-silver text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kova-blue focus:border-kova-blue transition-colors"
				>
					<option value="critical_only">Critical only (100% of budget)</option>
					<option value="high">High (80% of budget)</option>
					<option value="all">All (50%, 80%, 100%)</option>
				</select>
			</div>

			<div className="mt-6">
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-5 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving ? "Saving..." : "Save Preferences"}
				</button>
			</div>
		</div>
	);
}

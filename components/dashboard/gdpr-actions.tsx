"use client";

import { Download, Trash2, X } from "lucide-react";
import { useState } from "react";

type ExportStatus = "idle" | "pending" | "ready" | "error";

export function GdprActions() {
	// Data export state
	const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
	const [exportUrl, setExportUrl] = useState<string | null>(null);
	const [exportError, setExportError] = useState<string | null>(null);

	// Account deletion state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	async function handleExport() {
		setExportStatus("pending");
		setExportError(null);
		setExportUrl(null);
		try {
			const res = await fetch("/api/v2/me/export", { method: "POST" });
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setExportStatus("error");
				setExportError(data.error ?? "Export failed.");
				return;
			}
			const data = (await res.json()) as { url?: string; job_id?: string };
			if (data.url) {
				setExportUrl(data.url);
				setExportStatus("ready");
			} else {
				// Polling for async job
				if (data.job_id) {
					await pollExportStatus(data.job_id);
				} else {
					setExportStatus("error");
					setExportError("Unexpected response from server.");
				}
			}
		} catch {
			setExportStatus("error");
			setExportError("Network error. Please try again.");
		}
	}

	async function pollExportStatus(jobId: string) {
		const maxAttempts = 20;
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((r) => setTimeout(r, 3000));
			try {
				const res = await fetch(`/api/v2/me/export?job_id=${jobId}`);
				if (res.ok) {
					const data = (await res.json()) as {
						status?: string;
						url?: string;
					};
					if (data.status === "ready" && data.url) {
						setExportUrl(data.url);
						setExportStatus("ready");
						return;
					} else if (data.status === "failed") {
						setExportStatus("error");
						setExportError("Export job failed.");
						return;
					}
				}
			} catch {
				// Continue polling
			}
		}
		setExportStatus("error");
		setExportError("Export timed out. Please try again.");
	}

	async function handleDeleteAccount() {
		if (deleteConfirmText !== "DELETE") return;
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch("/api/v2/me", { method: "DELETE" });
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setDeleteError(data.error ?? "Account deletion failed.");
			} else {
				// Redirect to logout / home
				window.location.href = "/";
			}
		} catch {
			setDeleteError("Network error. Please try again.");
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="space-y-4">
			{/* Data export */}
			<div className="flex items-start justify-between gap-4 py-4 border-b border-kova-border">
				<div>
					<p className="text-sm font-medium text-white">Download My Data</p>
					<p className="text-xs text-kova-silver-dim mt-0.5">
						Export all your usage records, settings, and account data as JSON.
					</p>
					{exportStatus === "error" && exportError && (
						<p className="text-xs text-red-400 mt-1">{exportError}</p>
					)}
					{exportStatus === "ready" && exportUrl && (
						<a
							href={exportUrl}
							download
							className="inline-flex items-center gap-1.5 mt-2 text-xs text-kova-blue hover:text-kova-blue-light transition-colors"
						>
							<Download size={12} />
							Download your data
						</a>
					)}
				</div>
				<button
					onClick={handleExport}
					disabled={exportStatus === "pending"}
					className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-kova-charcoal-light border border-kova-border text-sm text-kova-silver rounded-lg hover:border-kova-blue/50 hover:text-white disabled:opacity-50 transition-colors"
				>
					<Download size={14} />
					{exportStatus === "pending" ? "Preparing..." : "Export Data"}
				</button>
			</div>

			{/* Account deletion */}
			<div className="flex items-start justify-between gap-4 py-4">
				<div>
					<p className="text-sm font-medium text-white">Delete My Account</p>
					<p className="text-xs text-kova-silver-dim mt-0.5">
						Permanently delete your account and all associated data. This cannot
						be undone.
					</p>
				</div>
				<button
					onClick={() => setShowDeleteDialog(true)}
					className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/40 text-sm text-red-400 rounded-lg hover:bg-red-900/30 hover:border-red-700/50 transition-colors"
				>
					<Trash2 size={14} />
					Delete Account
				</button>
			</div>

			{/* Delete confirmation dialog */}
			{showDeleteDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
					<div className="relative w-full max-w-md bg-kova-surface border border-kova-border rounded-xl p-6 shadow-xl">
						<button
							onClick={() => {
								setShowDeleteDialog(false);
								setDeleteConfirmText("");
								setDeleteError(null);
							}}
							className="absolute top-4 right-4 text-kova-silver-dim hover:text-kova-silver transition-colors"
							aria-label="Close"
						>
							<X size={16} />
						</button>

						<div className="mb-5">
							<div className="w-10 h-10 rounded-full bg-red-900/30 border border-red-800/40 flex items-center justify-center mb-4">
								<Trash2 size={18} className="text-red-400" />
							</div>
							<h3 className="text-base font-semibold text-white mb-1">
								Delete Account
							</h3>
							<p className="text-sm text-kova-silver-dim">
								This will permanently delete your account, all usage records,
								API keys, and billing data. This action is irreversible.
							</p>
						</div>

						<div className="mb-4">
							<label className="block text-xs text-kova-silver-dim mb-1.5">
								Type{" "}
								<span className="font-mono font-bold text-red-400">DELETE</span>{" "}
								to confirm
							</label>
							<input
								type="text"
								value={deleteConfirmText}
								onChange={(e) => setDeleteConfirmText(e.target.value)}
								placeholder="DELETE"
								className="w-full px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-red-500/50 transition-colors"
							/>
						</div>

						{deleteError && (
							<div className="mb-4 px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-400">
								{deleteError}
							</div>
						)}

						<div className="flex gap-3">
							<button
								onClick={() => {
									setShowDeleteDialog(false);
									setDeleteConfirmText("");
									setDeleteError(null);
								}}
								className="flex-1 px-4 py-2 bg-kova-charcoal-light border border-kova-border text-sm text-kova-silver rounded-lg hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteAccount}
								disabled={deleteConfirmText !== "DELETE" || deleting}
								className="flex-1 px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								{deleting ? "Deleting..." : "Delete My Account"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

import { type NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// POST /api/v2/me/export  -- initiate a GDPR data export job
// GET  /api/v2/me/export?job_id=...  -- check job status / retrieve download URL
//
// Auth: session or API key (any scope)

async function resolveUserId(request: NextRequest): Promise<string | null> {
	// Try API key first
	const ctx = await verifyApiKey(request);
	if (ctx) return ctx.userId;

	// Fall back to session
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user?.id ?? null;
}

export async function POST(request: NextRequest) {
	const userId = await resolveUserId(request);
	if (!userId) {
		return NextResponse.json(
			{ error: "Authentication required", code: "UNAUTHORIZED" },
			{ status: 401 },
		);
	}

	const admin = createAdminClient();

	// Call the create_data_export RPC (implemented in a future migration).
	// The RPC creates an async job record and returns the job_id.
	const { data, error } = await admin.rpc("create_data_export", {
		p_user_id: userId,
	});

	if (error) {
		// If the RPC does not exist yet, return a clear 501 rather than a 500.
		const isNotFound =
			error.code === "PGRST202" || error.message?.includes("does not exist");
		if (isNotFound) {
			return NextResponse.json(
				{
					error: "Data export feature is not yet enabled",
					code: "FEATURE_NOT_AVAILABLE",
				},
				{ status: 501 },
			);
		}
		console.error("create_data_export RPC error:", error);
		return NextResponse.json(
			{ error: "Failed to create export job", code: "EXPORT_FAILED" },
			{ status: 500 },
		);
	}

	const jobId = (data as { job_id?: string } | null)?.job_id ?? String(data);

	return NextResponse.json({ job_id: jobId }, { status: 202 });
}

export async function GET(request: NextRequest) {
	const userId = await resolveUserId(request);
	if (!userId) {
		return NextResponse.json(
			{ error: "Authentication required", code: "UNAUTHORIZED" },
			{ status: 401 },
		);
	}

	const { searchParams } = new URL(request.url);
	const jobId = searchParams.get("job_id");

	if (!jobId) {
		return NextResponse.json(
			{ error: "job_id query parameter is required", code: "MISSING_PARAM" },
			{ status: 400 },
		);
	}

	const admin = createAdminClient();

	// Call the get_data_export_status RPC.
	const { data, error } = await admin.rpc("get_data_export_status", {
		p_job_id: jobId,
		p_user_id: userId,
	});

	if (error) {
		const isNotFound =
			error.code === "PGRST202" || error.message?.includes("does not exist");
		if (isNotFound) {
			return NextResponse.json(
				{
					error: "Data export feature is not yet enabled",
					code: "FEATURE_NOT_AVAILABLE",
				},
				{ status: 501 },
			);
		}
		console.error("get_data_export_status RPC error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch export status", code: "QUERY_FAILED" },
			{ status: 500 },
		);
	}

	if (!data) {
		return NextResponse.json(
			{ error: "Export job not found", code: "NOT_FOUND" },
			{ status: 404 },
		);
	}

	const job = data as {
		job_id: string;
		status: string;
		download_url?: string | null;
	};

	return NextResponse.json({
		job_id: job.job_id ?? jobId,
		status: job.status ?? "pending",
		download_url: job.download_url ?? null,
	});
}

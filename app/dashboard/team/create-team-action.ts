"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export async function createPersonalWorkspace() {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		redirect("/login");
	}

	const admin = createAdminClient();

	// Check if user already has a team
	const { data: existing } = await admin
		.from("team_members")
		.select("team_id")
		.eq("user_id", user.id)
		.limit(1)
		.maybeSingle();

	if (existing) {
		redirect("/dashboard/team");
	}

	// Fetch profile for name generation
	const { data: profile } = await admin
		.from("profiles")
		.select("username, email")
		.eq("id", user.id)
		.single();

	const name = profile?.username
		? `${profile.username}'s Workspace`
		: `My Workspace`;

	const baseSlug = (profile?.username ?? user.email ?? "workspace")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 40);

	// Ensure slug uniqueness with a short random suffix
	const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

	// Create the team
	const { data: team, error: teamError } = await admin
		.from("teams")
		.insert({ name, slug, created_by: user.id })
		.select("id")
		.single();

	if (teamError || !team) {
		console.error("Team creation error:", teamError);
		throw new Error("Failed to create workspace");
	}

	// Add creator as owner
	const { error: memberError } = await admin.from("team_members").insert({
		team_id: team.id,
		user_id: user.id,
		role: "owner",
	});

	if (memberError) {
		console.error("Team member creation error:", memberError);
		throw new Error("Failed to add you as team owner");
	}

	redirect("/dashboard/team");
}

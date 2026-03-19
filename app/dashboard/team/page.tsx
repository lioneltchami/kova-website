import { Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
	InviteMemberForm,
	MemberList,
} from "@/components/dashboard/team-actions";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";
import { createPersonalWorkspace } from "./create-team-action";

export const metadata = {
	title: "Team",
};

interface TeamMember {
	id: string;
	userId: string;
	role: string;
	joinedAt: string;
	email: string;
	username: string | null;
	avatarUrl: string | null;
	costThisMonth: number;
	isCurrentUser: boolean;
}

interface TeamData {
	id: string;
	name: string;
	slug: string | null;
	plan: string;
	seats_purchased: number;
	created_at: string;
	totalCostThisMonth: number;
}

export default async function TeamPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const admin = createAdminClient();

	// Find user's team membership
	const { data: membership } = await admin
		.from("team_members")
		.select("team_id, role")
		.eq("user_id", user.id)
		.order("joined_at", { ascending: true })
		.limit(1)
		.maybeSingle();

	// No team yet -- show create workspace prompt
	if (!membership) {
		return (
			<div className="max-w-2xl">
				<h1 className="text-2xl font-bold text-white mb-6">Team</h1>
				<div className="bg-kova-surface border border-kova-border rounded-xl p-8 text-center">
					<div className="flex justify-center mb-4">
						<div className="w-14 h-14 rounded-full bg-kova-blue/10 border border-kova-blue/30 flex items-center justify-center">
							<Users size={24} className="text-kova-blue" />
						</div>
					</div>
					<h2 className="text-lg font-semibold text-white mb-2">
						Create your workspace
					</h2>
					<p className="text-sm text-kova-silver-dim mb-6 max-w-sm mx-auto">
						Set up a personal workspace to track costs across your AI tools and
						invite teammates to share visibility.
					</p>
					<form action={createPersonalWorkspace}>
						<button
							type="submit"
							className="px-6 py-2.5 bg-kova-blue text-white text-sm font-semibold rounded-lg hover:bg-kova-blue-light transition-colors"
						>
							Create Workspace
						</button>
					</form>
				</div>
			</div>
		);
	}

	const teamId = membership.team_id;
	const currentUserRole = membership.role;
	const canManage = ["owner", "admin"].includes(currentUserRole);

	// Fetch team info
	const { data: team } = await admin
		.from("teams")
		.select("id, name, slug, plan, seats_purchased, created_at")
		.eq("id", teamId)
		.single();

	// Fetch members with profiles
	const { data: members } = await admin
		.from("team_members")
		.select(
			`id, role, joined_at, user_id,
       profiles!inner(email, username, avatar_url)`,
		)
		.eq("team_id", teamId)
		.order("joined_at", { ascending: true });

	// Fetch current-month cost rollup
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString()
		.slice(0, 10);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		.toISOString()
		.slice(0, 10);

	const { data: rollups } = await admin
		.from("usage_daily_rollups")
		.select("user_id, total_cost_usd")
		.eq("team_id", teamId)
		.gte("date", monthStart)
		.lte("date", monthEnd);

	const costByUser: Record<string, number> = {};
	for (const row of rollups ?? []) {
		costByUser[row.user_id] =
			(costByUser[row.user_id] ?? 0) + Number(row.total_cost_usd);
	}

	const enrichedMembers: TeamMember[] = (members ?? []).map((m) => {
		const profile = m.profiles as unknown as {
			email: string;
			username: string | null;
			avatar_url: string | null;
		};
		return {
			id: m.id,
			userId: m.user_id,
			role: m.role,
			joinedAt: m.joined_at,
			email: profile.email,
			username: profile.username,
			avatarUrl: profile.avatar_url,
			costThisMonth: costByUser[m.user_id] ?? 0,
			isCurrentUser: m.user_id === user.id,
		};
	});

	const totalCost = enrichedMembers.reduce((s, m) => s + m.costThisMonth, 0);
	const topSpender = enrichedMembers.reduce(
		(top, m) => (m.costThisMonth > (top?.costThisMonth ?? -1) ? m : top),
		null as TeamMember | null,
	);

	const typedTeam = team as TeamData | null;

	return (
		<div className="max-w-4xl">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-white">
						{typedTeam?.name ?? "Team"}
					</h1>
					<p className="text-sm text-kova-silver-dim mt-0.5">
						{typedTeam?.plan
							? typedTeam.plan.charAt(0).toUpperCase() + typedTeam.plan.slice(1)
							: "Free"}{" "}
						plan &middot; {enrichedMembers.length} member
						{enrichedMembers.length !== 1 ? "s" : ""}
					</p>
				</div>
			</div>

			{/* Cost Summary KPIs */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				<KpiCard
					label="Team Cost This Month"
					value={`$${totalCost.toFixed(2)}`}
					subtitle={`${enrichedMembers.length} active member${enrichedMembers.length !== 1 ? "s" : ""}`}
				/>
				<KpiCard
					label="Avg Cost / Member"
					value={
						enrichedMembers.length > 0
							? `$${(totalCost / enrichedMembers.length).toFixed(2)}`
							: "$0.00"
					}
					subtitle="Current month"
				/>
				<KpiCard
					label="Top Spender"
					value={
						topSpender ? `$${topSpender.costThisMonth.toFixed(2)}` : "$0.00"
					}
					subtitle={
						topSpender?.username ?? topSpender?.email ?? "No activity yet"
					}
				/>
			</div>

			{/* Invite form -- visible to owner/admin */}
			<InviteMemberForm canManage={canManage} />

			{/* Member list */}
			<MemberList members={enrichedMembers} currentUserRole={currentUserRole} />
		</div>
	);
}

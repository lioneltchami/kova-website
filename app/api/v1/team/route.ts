import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// Helper: resolve authenticated user and their team via session cookie
async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return { error: "Unauthorized", status: 401 as const };

  const admin = createAdminClient();

  // Find the team the user belongs to (first result, owner-first)
  const { data: membership, error: memberError } = await admin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) {
    console.error("Team membership query error:", memberError);
    return { error: "Failed to resolve team", status: 500 as const };
  }

  return { user, membership, admin };
}

// GET /api/v1/team -- List team members with current-month cost summaries
export async function GET(request: NextRequest) {
  const ctx = await getSessionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { user, membership, admin } = ctx;

  if (!membership) {
    return NextResponse.json({ members: [], team: null, hasTeam: false });
  }

  const teamId = membership.team_id;

  // Fetch team info
  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("id, name, slug, plan, seats_purchased, created_at")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Fetch all team members with profile data
  const { data: members, error: membersError } = await admin
    .from("team_members")
    .select(
      `id, role, joined_at, user_id,
       profiles!inner(email, username, avatar_url)`,
    )
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Team members fetch error:", membersError);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }

  // Fetch current-month cost rollup per user for this team
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

  // Aggregate cost per user
  const costByUser: Record<string, number> = {};
  for (const row of rollups ?? []) {
    costByUser[row.user_id] =
      (costByUser[row.user_id] ?? 0) + Number(row.total_cost_usd);
  }

  const enrichedMembers = (members ?? []).map((m) => {
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

  return NextResponse.json({
    hasTeam: true,
    team: { ...team, totalCostThisMonth: totalCost },
    members: enrichedMembers,
    currentUserRole: membership.role,
  });
}

// POST /api/v1/team -- Invite a member by email
export async function POST(request: NextRequest) {
  const ctx = await getSessionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { membership, admin } = ctx;

  if (!membership) {
    return NextResponse.json(
      { error: "You are not in a team" },
      { status: 403 },
    );
  }

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 },
    );
  }

  let body: { email?: string; role?: string };
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, role = "member" } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // M-3: Basic email format validation before hitting the database.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json(
      { error: "role must be admin or member" },
      { status: 400 },
    );
  }

  // Look up user by email via the RPC helper
  const { data: inviteeId, error: lookupError } = await admin.rpc(
    "get_user_id_by_email",
    { input_email: email },
  );

  if (lookupError || !inviteeId) {
    return NextResponse.json(
      { error: "No user found with that email address" },
      { status: 404 },
    );
  }

  // Check they are not already a member
  const { data: existing } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", membership.team_id)
    .eq("user_id", inviteeId as string)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "User is already a member of this team" },
      { status: 409 },
    );
  }

  const { error: insertError } = await admin.from("team_members").insert({
    team_id: membership.team_id,
    user_id: inviteeId as string,
    role,
    invited_by: (ctx as { user: { id: string } }).user.id,
  });

  if (insertError) {
    console.error("Team member insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, email, role }, { status: 201 });
}

// DELETE /api/v1/team?userId= -- Remove a member
export async function DELETE(request: NextRequest) {
  const ctx = await getSessionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { user, membership, admin } = ctx;

  if (!membership) {
    return NextResponse.json(
      { error: "You are not in a team" },
      { status: 403 },
    );
  }

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Cannot remove the owner
  const { data: targetMember } = await admin
    .from("team_members")
    .select("role, user_id")
    .eq("team_id", membership.team_id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (targetMember.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the team owner" },
      { status: 403 },
    );
  }

  // Admins cannot remove other admins (only owner can)
  if (
    membership.role === "admin" &&
    targetMember.role === "admin" &&
    targetUserId !== user.id
  ) {
    return NextResponse.json(
      { error: "Only the owner can remove admins" },
      { status: 403 },
    );
  }

  const { error: deleteError } = await admin
    .from("team_members")
    .delete()
    .eq("team_id", membership.team_id)
    .eq("user_id", targetUserId);

  if (deleteError) {
    console.error("Team member delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/v1/team -- Update a member's role
export async function PATCH(request: NextRequest) {
  const ctx = await getSessionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { membership, admin } = ctx;

  if (!membership) {
    return NextResponse.json(
      { error: "You are not in a team" },
      { status: 403 },
    );
  }

  if (membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can change roles" },
      { status: 403 },
    );
  }

  let body: { userId?: string; role?: string };
  try {
    body = (await request.json()) as { userId?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 },
    );
  }

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json(
      { error: "role must be admin or member" },
      { status: 400 },
    );
  }

  const { error: updateError } = await admin
    .from("team_members")
    .update({ role })
    .eq("team_id", membership.team_id)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Role update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, userId, role });
}

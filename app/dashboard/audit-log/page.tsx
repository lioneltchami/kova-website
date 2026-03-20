import {
  type AuditEvent,
  AuditLogTable,
} from "@/components/dashboard/audit-log-table";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Audit Log",
};

interface AuditLogPageProps {
  searchParams: Promise<{
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AuditLogPage({
  searchParams,
}: AuditLogPageProps) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Get team
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const teamId = membership?.team_id ?? null;

  // Build query
  let query = admin
    .from("audit_events")
    .select(
      "id, created_at, actor_email, action, resource_type, resource_id, old_data, new_data",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (teamId) {
    query = query.eq("team_id", teamId);
  } else {
    query = query.eq("actor_user_id", user.id);
  }

  if (params.actor) {
    query = query.ilike("actor_email", `%${params.actor}%`);
  }
  if (params.action) {
    query = query.eq("action", params.action);
  }
  if (params.from) {
    query = query.gte("created_at", params.from);
  }
  if (params.to) {
    // Include the entire "to" day
    const toDate = new Date(params.to);
    toDate.setDate(toDate.getDate() + 1);
    query = query.lt("created_at", toDate.toISOString().slice(0, 10));
  }

  const { data: events } = await query;

  // Collect distinct actions for filter dropdown
  const { data: allEvents } = teamId
    ? await admin
        .from("audit_events")
        .select("action")
        .eq("team_id", teamId)
        .limit(200)
    : await admin
        .from("audit_events")
        .select("action")
        .eq("actor_user_id", user.id)
        .limit(200);

  const distinctActions = [
    ...new Set((allEvents ?? []).map((e) => e.action)),
  ].sort();

  const auditEvents: AuditEvent[] = (events ?? []).map((e) => ({
    id: e.id,
    created_at: e.created_at,
    actor_email: e.actor_email ?? "unknown",
    action: e.action,
    resource_type: e.resource_type ?? "unknown",
    resource_id: e.resource_id ?? null,
    old_data: e.old_data as Record<string, unknown> | null,
    new_data: e.new_data as Record<string, unknown> | null,
  }));

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          All administrative actions taken in your workspace
        </p>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 mb-6 bg-kova-surface border border-kova-border rounded-xl p-4"
      >
        <div>
          <label className="block text-xs text-kova-silver-dim mb-1.5">
            Actor email
          </label>
          <input
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="filter by email"
            className="px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver placeholder:text-kova-silver-dim/60 focus:outline-none focus:border-kova-blue transition-colors w-48"
          />
        </div>

        <div>
          <label className="block text-xs text-kova-silver-dim mb-1.5">
            Action
          </label>
          <select
            name="action"
            defaultValue={params.action ?? ""}
            className="appearance-none px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
          >
            <option value="">All actions</option>
            {distinctActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-kova-silver-dim mb-1.5">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-kova-silver-dim mb-1.5">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="px-3 py-2 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver focus:outline-none focus:border-kova-blue transition-colors"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
        >
          Filter
        </button>

        {(params.actor || params.action || params.from || params.to) && (
          <a
            href="/dashboard/audit-log"
            className="px-4 py-2 text-sm text-kova-silver-dim hover:text-kova-silver transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Events</h2>
          <span className="text-xs text-kova-silver-dim">
            {auditEvents.length} event{auditEvents.length !== 1 ? "s" : ""}
          </span>
        </div>
        <AuditLogTable events={auditEvents} />
      </div>
    </div>
  );
}

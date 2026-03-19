"use client";

import { useState } from "react";
import { UserPlus, Trash2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface TeamActionsProps {
  members: TeamMember[];
  currentUserRole: string;
}

function MemberAvatar({
  email,
  avatarUrl,
  username,
}: {
  email: string;
  avatarUrl: string | null;
  username: string | null;
}) {
  const initials = (username ?? email)[0].toUpperCase();
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={username ?? email}
        className="w-9 h-9 rounded-full border border-kova-border flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-kova-charcoal-light border border-kova-border flex items-center justify-center text-kova-silver font-bold text-sm flex-shrink-0">
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-amber-900/30 text-amber-400",
    admin: "bg-kova-blue/20 text-kova-blue",
    member: "bg-kova-charcoal-light text-kova-silver-dim",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${colors[role] ?? colors.member}`}
    >
      {role}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InviteMemberForm({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!canManage) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setError(data.error ?? "Failed to invite member");
      } else {
        setSuccess(`${email} has been added to your team`);
        setEmail("");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleInvite}
      className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6"
    >
      <h2 className="text-base font-semibold text-white mb-4">Invite Member</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          className="flex-1 bg-kova-charcoal-light border border-kova-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-kova-silver-dim focus:outline-none focus:ring-1 focus:ring-kova-blue"
        />
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="appearance-none bg-kova-charcoal-light border border-kova-border rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kova-blue"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-kova-silver-dim pointer-events-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors disabled:opacity-50"
        >
          <UserPlus size={14} />
          {loading ? "Inviting..." : "Invite"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}
    </form>
  );
}

export function MemberList({ members, currentUserRole }: TeamActionsProps) {
  const router = useRouter();
  const canManage = ["owner", "admin"].includes(currentUserRole);
  const isOwner = currentUserRole === "owner";

  const [removing, setRemoving] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    if (removing) return;
    setRemoving(userId);
    try {
      const res = await fetch(`/api/v1/team?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRemoving(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setRoleUpdating(userId);
    try {
      await fetch("/api/v1/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      router.refresh();
    } finally {
      setRoleUpdating(null);
    }
  }

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-kova-border">
        <h2 className="text-base font-semibold text-white">
          Team Members
          <span className="ml-2 text-sm font-normal text-kova-silver-dim">
            ({members.length})
          </span>
        </h2>
      </div>
      <ul className="divide-y divide-kova-border">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-4 px-6 py-4">
            <MemberAvatar
              email={member.email}
              avatarUrl={member.avatarUrl}
              username={member.username}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white truncate">
                  {member.username ?? member.email}
                  {member.isCurrentUser && (
                    <span className="ml-1 text-kova-silver-dim text-xs font-normal">
                      (you)
                    </span>
                  )}
                </span>
                <RoleBadge role={member.role} />
              </div>
              <p className="text-xs text-kova-silver-dim mt-0.5">
                {member.email} &middot; Joined {formatDate(member.joinedAt)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-white">
                ${member.costThisMonth.toFixed(2)}
              </p>
              <p className="text-[10px] text-kova-silver-dim">this month</p>
            </div>
            {canManage && member.role !== "owner" && !member.isCurrentUser && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwner && (
                  <div className="relative">
                    <select
                      value={member.role}
                      disabled={roleUpdating === member.userId}
                      onChange={(e) =>
                        handleRoleChange(member.userId, e.target.value)
                      }
                      className="appearance-none bg-kova-charcoal-light border border-kova-border rounded-md px-2 py-1 pr-6 text-xs text-kova-silver focus:outline-none focus:ring-1 focus:ring-kova-blue disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown
                      size={10}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-kova-silver-dim pointer-events-none"
                    />
                  </div>
                )}
                <button
                  onClick={() => handleRemove(member.userId)}
                  disabled={removing === member.userId}
                  className="p-1.5 rounded-md text-kova-silver-dim hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

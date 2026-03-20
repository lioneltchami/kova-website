"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface AuditEvent {
  id: string;
  created_at: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

interface AuditLogTableProps {
  events: AuditEvent[];
}

const PAGE_SIZE = 50;

function JsonDiff({
  oldData,
  newData,
}: {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}) {
  if (!oldData && !newData) {
    return (
      <p className="text-xs text-kova-silver-dim">No additional details.</p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {oldData && (
        <div>
          <p className="text-[10px] text-kova-silver-dim uppercase tracking-wider mb-1">
            Before
          </p>
          <pre className="text-xs text-kova-silver bg-kova-charcoal border border-kova-border rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(oldData, null, 2)}
          </pre>
        </div>
      )}
      {newData && (
        <div>
          <p className="text-[10px] text-kova-silver-dim uppercase tracking-wider mb-1">
            After
          </p>
          <pre className="text-xs text-kova-silver bg-kova-charcoal border border-kova-border rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(newData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AuditLogTable({ events }: AuditLogTableProps) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const pageEvents = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-kova-silver-dim text-sm">No audit events found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
              <th className="pb-3 pr-4 w-5" />
              <th className="pb-3 pr-4">Timestamp</th>
              <th className="pb-3 pr-4">Actor</th>
              <th className="pb-3 pr-4">Action</th>
              <th className="pb-3">Resource</th>
            </tr>
          </thead>
          <tbody>
            {pageEvents.map((event) => {
              const isExpanded = expandedId === event.id;
              const hasDetails =
                event.old_data !== null || event.new_data !== null;
              return (
                <>
                  <tr
                    key={event.id}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      {hasDetails ? (
                        <button
                          onClick={() => toggleExpand(event.id)}
                          className="p-0.5 text-kova-silver-dim hover:text-kova-silver transition-colors"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm whitespace-nowrap">
                      {format(
                        new Date(event.created_at),
                        "MMM d, yyyy HH:mm:ss",
                      )}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver text-sm max-w-[160px] truncate">
                      {event.actor_email}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-kova-charcoal-light text-kova-silver">
                        {event.action}
                      </span>
                    </td>
                    <td className="py-3 text-kova-silver-dim text-sm">
                      <span className="font-mono">
                        {event.resource_type}
                        {event.resource_id ? (
                          <span className="text-kova-silver-dim/60">
                            {" "}
                            #{event.resource_id.slice(0, 8)}
                          </span>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr
                      key={`${event.id}-expanded`}
                      className="border-b border-kova-border/50"
                    >
                      <td colSpan={5} className="py-4 px-4 bg-kova-charcoal/40">
                        <JsonDiff
                          oldData={event.old_data}
                          newData={event.new_data}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-kova-border">
          <p className="text-xs text-kova-silver-dim">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, events.length)} of {events.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs bg-kova-charcoal-light border border-kova-border text-kova-silver rounded-lg hover:border-kova-blue/50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-kova-silver-dim">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-xs bg-kova-charcoal-light border border-kova-border text-kova-silver rounded-lg hover:border-kova-blue/50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Sidebar from "./Sidebar";
import { fetchApprovalLogs } from "../api";

dayjs.extend(relativeTime);

const actionColors = {
  STAGE_APPROVED: "var(--status-approve-bg)",
  STAGE_REJECTED: "var(--status-reject-bg)",
  AUTO_REJECTED: "var(--status-reject-bg)",
  FINAL_APPROVED: "var(--status-approve-bg)"
};

export default function ApprovalLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchApprovalLogs({ limit: 200 });
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error("Failed to load approval logs", err);
      setError(err.response?.data?.error || "Unable to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen lg:flex bg-[var(--color-navy)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3 md:flex md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
              Audit Trail
            </p>
            <h1 className="text-4xl font-semibold">Approval Log</h1>
            <p className="text-[var(--color-text)]">
              Timeline of every manual approval and rejection event.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="mt-4 md:mt-0 px-4 py-2 rounded-2xl border border-[var(--color-blue)]/30 hover:border-[var(--color-border-strong)] text-sm transition"
          >
            Refresh
          </button>
        </header>

        {error && (
          <div className="p-4 rounded-2xl border border-red-400/40 bg-red-900/30 text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--color-blue)]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-charcoal)] text-center text-[var(--color-text)]">
            No approval activity yet.
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => {
              const actionAccent =
                actionColors[log.action] || "var(--color-blue)";
              return (
                <article
                  key={log.id}
                  className="rounded-3xl bg-[var(--color-charcoal)] border border-[var(--color-blue)]/10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-inner shadow-black/20"
                >
                  <div className="flex-1 space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-gray)]">
                      {log.application_id}
                    </p>
                    <p className="text-lg font-semibold text-[var(--color-text)]">
                      {log.stage}
                    </p>
                    <p className="text-sm text-[var(--color-text)]/80">
                      {log.notes || "No additional remarks"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text)]/70">
                      <span>
                        {log.actor_email ? (
                          <>
                            {log.actor_email} · {log.actor_role || "N/A"}
                          </>
                        ) : (
                          "System generated"
                        )}
                      </span>
                      <span>•</span>
                      <span>{dayjs(log.created_at).format("MMM D, YYYY HH:mm")}</span>
                      <span className="text-[var(--color-sky)]">
                        ({dayjs(log.created_at).fromNow()})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-stretch md:self-auto">
                    <span
                      className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide border"
                      style={{
                        borderColor: actionAccent,
                        color: actionAccent
                      }}
                    >
                      {log.action.replace("_", " ")}
                    </span>
                    <div className="hidden md:block h-12 w-px bg-[var(--color-blue)]/15" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

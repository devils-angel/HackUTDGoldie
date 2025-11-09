import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { fetchApprovalLogs } from "../api";

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
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3 md:flex md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
              Audit Trail
            </p>
            <h1 className="text-4xl font-semibold">Approval Log</h1>
            <p className="text-[#C3CDDA]">
              Timeline of every manual approval and rejection event.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="mt-4 md:mt-0 px-4 py-2 rounded-2xl border border-white/20 hover:border-white/60 text-sm transition"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2178C4]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 rounded-3xl border border-white/10 bg-[#1B1F35] text-center text-[#C3CDDA]">
            No approval activity yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-[#A5B8D0]">
                <tr>
                  <th className="text-left px-4 py-2">Application</th>
                  <th className="text-left px-4 py-2">Stage</th>
                  <th className="text-left px-4 py-2">Action</th>
                  <th className="text-left px-4 py-2">Performed By</th>
                  <th className="text-left px-4 py-2">Notes</th>
                  <th className="text-left px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="bg-[#1B1F35] border border-white/10 rounded-2xl text-white"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.application_id}
                    </td>
                    <td className="px-4 py-3">{log.stage}</td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.actor_email ? (
                        <>
                          <span className="font-semibold">{log.actor_email}</span>
                          <br />
                          <span className="text-xs text-[#C3CDDA]">
                            {log.actor_role || "N/A"}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#C3CDDA]">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#C3CDDA]">
                      {log.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#C3CDDA]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

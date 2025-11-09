import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { fetchNotifications, markNotificationsRead } from "../api";

const statusTone = (status) => {
  if (status === "READ") return "text-[var(--color-sky)]";
  return "text-[var(--color-sky)]";
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [user, setUser] = useState(null);

  const loadNotifications = async (profile) => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchNotifications({
        email: profile.email,
        role: profile.role
      });
      setNotifications(response.data.notifications || []);
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to load notifications", err);
      setError(err.response?.data?.error || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("OnboardIQUser");
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setUser(profile);
        loadNotifications(profile);
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markRead = async () => {
    if (!selected.size) return;
    try {
      await markNotificationsRead(Array.from(selected));
      setNotifications((prev) =>
        prev.filter((notification) => !selected.has(notification.id))
      );
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to mark notifications read", err);
      setError(err.response?.data?.error || "Unable to mark read.");
    }
  };

  return (
    <div className="min-h-screen lg:flex bg-[var(--color-navy)] text-[var(--color-text)]">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3 md:flex md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
              Notification Center
            </p>
            <h1 className="text-4xl font-semibold">Updates</h1>
            <p className="text-[var(--color-text)]">
              Review recent actions related to your loan workflow.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => user && loadNotifications(user)}
              className="px-4 py-2 rounded-2xl border border-[var(--color-blue)]/30 hover:border-[var(--color-border-strong)] text-sm transition"
            >
              Refresh
            </button>
            <button
              disabled={!selected.size}
              onClick={markRead}
              className="px-4 py-2 rounded-2xl bg-[var(--color-blue)] text-[var(--color-on-blue)] shadow-lg shadow-[var(--color-blue)]/30 hover:bg-[var(--color-gray)] transition disabled:opacity-50"
            >
              Mark as read
            </button>
          </div>
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
        ) : notifications.length === 0 ? (
          <div className="p-6 rounded-3xl border border-[var(--color-blue)]/20 bg-[var(--color-charcoal)] text-center text-[var(--color-text)]">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <label
                key={notification.id}
                className="flex flex-col gap-2 bg-[var(--color-charcoal)] border border-[var(--color-blue)]/20 rounded-3xl p-5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="w-4 h-4 accent-[var(--color-blue)]"
                    />
                    <div>
                      <p className="font-semibold">{notification.message}</p>
                      <p className="text-xs text-[var(--color-text)]">
                        Application {notification.application_id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${statusTone(
                      notification.status
                    )}`}
                  >
                    {notification.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text)]">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { fetchNotifications, markNotificationsRead } from "../api";

const statusTone = (status) => {
  if (status === "READ") return "text-[#A5B8D0]";
  return "text-[#64F6A3]";
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
    const stored = localStorage.getItem("goldmanUser");
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
    <div className="min-h-screen lg:flex bg-[#101327] text-white">
      <Sidebar />
      <div className="flex-1 px-6 py-10 md:px-10 space-y-8">
        <header className="space-y-3 md:flex md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
              Notification Center
            </p>
            <h1 className="text-4xl font-semibold">Updates</h1>
            <p className="text-[#C3CDDA]">
              Review recent actions related to your loan workflow.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => user && loadNotifications(user)}
              className="px-4 py-2 rounded-2xl border border-white/20 hover:border-white/60 text-sm transition"
            >
              Refresh
            </button>
            <button
              disabled={!selected.size}
              onClick={markRead}
              className="px-4 py-2 rounded-2xl bg-[#2178C4] shadow-lg shadow-[#2178C4]/30 hover:bg-[#1b63a0] transition disabled:opacity-50"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2178C4]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 rounded-3xl border border-white/10 bg-[#1B1F35] text-center text-[#C3CDDA]">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <label
                key={notification.id}
                className="flex flex-col gap-2 bg-[#1B1F35] border border-white/10 rounded-3xl p-5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="w-4 h-4 accent-[#2178C4]"
                    />
                    <div>
                      <p className="font-semibold">{notification.message}</p>
                      <p className="text-xs text-[#C3CDDA]">
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
                <p className="text-xs text-[#C3CDDA]">
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

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const roleLinks = {
  ADMIN: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Pending Requests", to: "/pending" },
    { label: "Approval Log", to: "/logs" },
    { label: "Notifications", to: "/notifications" },
    { label: "Sign Out", to: "/login", signOut: true },
  ],
  VENDOR: [
    { label: "Pending Requests", to: "/pending" },
    { label: "Notifications", to: "/notifications" },
    { label: "Sign Out", to: "/login", signOut: true },
  ],
  CLIENT: [
    { label: "Loan Workspace", to: "/loan" },
    { label: "Bank Accounts", to: "/accounts" },
    { label: "Notifications", to: "/notifications" },
    { label: "Sign Out", to: "/login", signOut: true },
  ],
};

const defaultLinks = roleLinks.CLIENT;

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Sidebar() {
  const [links, setLinks] = useState(defaultLinks);
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = () => {
    localStorage.removeItem("goldmanUser");
    localStorage.removeItem("goldmanToken");
    setUser(null);
    setLinks(defaultLinks);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("goldmanUser");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setUser(parsed);
      const role = parsed.role?.toUpperCase();
      setLinks(roleLinks[role] || defaultLinks);
    } catch {
      setLinks(defaultLinks);
    }
  }, []);

  return (
    <aside className="hidden lg:flex w-72 bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-charcoal)] text-[var(--color-text)] flex-col justify-between py-10 px-8 shadow-2xl">
      <div className="space-y-10">
        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-sky)]">
              Goldman
            </p>
            <h2 className="text-2xl font-semibold">Lending Suite</h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/10 p-3">
            <div className="h-12 w-12 rounded-2xl bg-[var(--color-blue)] text-[var(--color-on-blue)] flex items-center justify-center text-lg font-semibold">
              {getInitials(user?.name || "Client User")}
            </div>
            <div className="text-sm">
              <p className="text-[var(--color-text)] font-semibold">
                {user?.name || "Client User"}
              </p>
              <p className="text-[var(--color-text)] text-xs">{user?.email || "—"}</p>
              <p className="text-[var(--color-sky)] text-[11px] uppercase tracking-[0.3em] mt-1">
                {(user?.role || "Client").toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={link.signOut ? handleSignOut : undefined}
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-lg shadow-[var(--nav-active-bg)]/30"
                    : "text-[var(--color-text)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--color-text)]",
                ].join(" ")
              }
            >
              {link.label}
              <span className="text-xs opacity-70">↗</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          className="mt-4 w-full rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/10 px-4 py-3 text-sm font-semibold hover:bg-[var(--color-blue)]/20 transition"
        >
          {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-blue)]/20 p-4 space-y-2 bg-[var(--color-blue)]/10">
        <p className="text-sm text-[var(--color-text)]">Need help?</p>
        <p className="text-lg font-semibold text-[var(--color-text)]">Goldman Support</p>
        <p className="text-xs text-[var(--color-text)]">support@goldman.com</p>
      </div>
    </aside>
  );
}

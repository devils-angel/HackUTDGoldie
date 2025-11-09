import { NavLink } from "react-router-dom";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Pending Requests", to: "/pending" },
  { label: "Loan Workspace", to: "/loan" },
  { label: "Sign Out", to: "/login" },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-72 bg-[#1B1F35] text-white flex-col justify-between py-10 px-8 shadow-2xl">
      <div className="space-y-10">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[#A5B8D0]">
            Goldman
          </p>
          <h2 className="text-2xl font-semibold">Lending Suite</h2>
        </div>

        <nav className="space-y-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[#2178C4] text-white shadow-lg shadow-[#2178C4]/30"
                    : "text-[#C3CDDA] hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {link.label}
              <span className="text-xs opacity-70">↗</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rounded-2xl border border-white/10 p-4 space-y-2 bg-white/5">
        <p className="text-sm text-[#C3CDDA]">Need help?</p>
        <p className="text-lg font-semibold text-white">Goldman Support</p>
        <p className="text-xs text-[#C3CDDA]">support@goldman.com</p>
      </div>
    </aside>
  );
}

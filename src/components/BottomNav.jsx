import { Home, Camera, Grid2x2, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: Camera },
  { to: "/database", label: "Database", icon: Grid2x2 },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--border-soft)] bg-[color:var(--surface-nav)]/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          const TabIcon = Icon;

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-emerald-400"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <TabIcon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

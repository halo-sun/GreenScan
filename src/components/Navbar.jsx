import { Link } from "react-router-dom";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useAuth, signIn, signOut } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--border-soft)] backdrop-blur-xl bg-[color:var(--surface-nav)]/85">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            GreenScan
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)] px-3 py-2 text-[color:var(--text-primary)] transition-colors hover:text-emerald-400"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="hidden md:flex items-center gap-1">
          <Link
            to="/database"
            className="px-4 py-2 text-sm text-[color:var(--text-muted)] hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-all"
          >
            Database
          </Link>

          {user && (
            <Link
              to="/profile"
              className="px-4 py-2 text-sm text-[color:var(--text-muted)] hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-6 h-6 rounded-full ring-2 ring-emerald-500/50"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white font-bold">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline">Profile</span>
            </Link>
          )}

          {user ? (
            <button
              onClick={signOut}
              className="ml-2 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[color:var(--border-soft)] text-[color:var(--text-muted)] hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={signIn}
              className="ml-2 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
}

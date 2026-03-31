import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function navClass({ isActive }) {
  return isActive
    ? "rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
    : "rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/dashboard" className="text-xl font-extrabold tracking-tight text-brand-700 dark:text-brand-300">
          RakshaX AI
        </Link>

        {user && (
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/scan" className={navClass}>
              Scan
            </NavLink>
            <NavLink to="/history" className={navClass}>
              History
            </NavLink>
            <NavLink to="/trends" className={navClass}>
              Trends
            </NavLink>
            {user.role === "admin" && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold dark:border-slate-700"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Logout
            </button>
          ) : (
            <Link className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white" to="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

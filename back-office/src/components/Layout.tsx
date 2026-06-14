import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, GraduationCap, Users, FileUp, Images, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/",        label: "Dashboard",      icon: LayoutDashboard },
  { to: "/classes", label: "Classes",         icon: GraduationCap   },
  { to: "/students",label: "Élèves",          icon: Users           },
  { to: "/import",  label: "Import CSV",      icon: FileUp          },
  { to: "/trombi",  label: "Trombinoscope",   icon: Images          },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Top bar (mobile + tablet) */}
      <header className="xl:hidden fixed top-0 inset-x-0 z-30 bg-indigo-900 text-white flex items-center justify-between px-4 h-14 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-indigo-900 flex items-center justify-center font-extrabold text-base">
            T
          </div>
          <h1 className="text-base font-bold tracking-tight">Trombinoscope</h1>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 rounded-lg hover:bg-indigo-800 active:bg-indigo-700 transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="xl:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed xl:static inset-y-0 left-0 z-50
          w-72 xl:w-60 bg-indigo-900 text-white flex flex-col shrink-0
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} xl:translate-x-0
        `}
      >
        <div className="px-6 py-5 border-b border-indigo-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-indigo-900 flex items-center justify-center font-extrabold text-base">
              T
            </div>
            <h1 className="text-lg font-bold tracking-tight">Trombinoscope</h1>
          </div>
          <button
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="xl:hidden p-1.5 rounded-lg hover:bg-indigo-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-5 py-4 border-t border-indigo-700/50 flex flex-col gap-3">
          <div>
            <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
            <span
              className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? "bg-amber-400 text-amber-900"
                  : "bg-indigo-400 text-indigo-900"
              }`}
            >
              {isAdmin ? "Admin" : "Enseignant"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-indigo-300 hover:text-white text-xs transition-colors"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 xl:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

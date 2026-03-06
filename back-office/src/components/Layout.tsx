import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/classes', label: 'Classes', icon: '🎓' },
  { to: '/students', label: 'Élèves', icon: '👤' },
  { to: '/import', label: 'Import CSV', icon: '📂' },
  { to: '/trombi', label: 'Trombinoscope', icon: '🖼️' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-60 bg-indigo-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-indigo-700">
          <h1 className="text-xl font-bold tracking-tight">Trombinoscope</h1>
          <p className="text-indigo-300 text-xs mt-1">Back Office</p>
        </div>
        <nav className="flex-1 py-4">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-indigo-400 border-t border-indigo-700">
          v2.0.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

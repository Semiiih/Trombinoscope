import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClasses } from '../api/client';
import type { Class } from '../types';

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);

  const totalStudents = classes.reduce((s, c) => s + (c._count?.students ?? 0), 0);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Tableau de bord</h2>
      <p className="text-gray-500 mb-8">Vue d'ensemble de l'application</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard label="Classes" value={classes.length} color="bg-indigo-50 text-indigo-700" />
        <StatCard label="Élèves" value={totalStudents} color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Formats export" value="HTML & PDF" color="bg-amber-50 text-amber-700" />
      </div>

      {/* Quick links */}
      <h3 className="font-semibold text-gray-700 mb-4">Accès rapide</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/classes', label: 'Gérer les classes', icon: '🎓' },
          { to: '/students', label: 'Gérer les élèves', icon: '👤' },
          { to: '/import', label: 'Importer un CSV', icon: '📂' },
          { to: '/trombi', label: 'Générer un trombi', icon: '🖼️' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm transition text-center"
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Classes list */}
      {classes.length > 0 && (
        <div className="mt-10">
          <h3 className="font-semibold text-gray-700 mb-4">Classes enregistrées</h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {classes.map(cls => (
              <div key={cls.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-medium">{cls.label} <span className="text-gray-400 font-normal">— {cls.year}</span></span>
                <span className="text-sm text-gray-500">{cls._count?.students ?? 0} élève(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-6 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

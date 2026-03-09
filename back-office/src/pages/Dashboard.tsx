import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClasses } from "../api/client";
import type { Class } from "../types";

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);

  const totalStudents = classes.reduce(
    (s, c) => s + (c._count?.students ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
          Tableau de bord
        </p>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Vue d'ensemble
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gérez vos classes et élèves depuis un seul endroit.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        <StatCard label="Classes" value={classes.length} accent="violet" />
        <StatCard label="Élèves" value={totalStudents} accent="emerald" />
        <StatCard label="Formats export" value="HTML & PDF" accent="amber" />
      </div>

      {/* Quick links */}
      <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4">
        Accès rapide
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          {
            to: "/classes",
            label: "Gérer les classes",
            sub: "Classes & années",
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            border: "hover:border-violet-300",
          },
          {
            to: "/students",
            label: "Gérer les élèves",
            sub: "Profils & photos",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            border: "hover:border-emerald-300",
          },
          {
            to: "/import",
            label: "Importer un CSV",
            sub: "Import en masse",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            border: "hover:border-amber-300",
          },
          {
            to: "/trombi",
            label: "Générer un trombi",
            sub: "HTML ou PDF",
            iconBg: "bg-rose-100",
            iconColor: "text-rose-500",
            border: "hover:border-rose-300",
          },
        ].map(({ to, label, sub, iconBg, iconColor, border }) => (
          <Link
            key={to}
            to={to}
            className={`group bg-white rounded-2xl border border-slate-200 ${border} hover:shadow-md p-5 flex flex-col gap-3 transition-all duration-200`}
          >
            <div
              className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}
            >
              <span className="text-lg font-bold">→</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">
                {label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Classes list */}
      {classes.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4">
            Classes enregistrées
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Élèves
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classes.map((cls) => (
                  <tr
                    key={cls.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {cls.label}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{cls.year}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block bg-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full">
                        {cls._count?.students ?? 0} élève
                        {(cls._count?.students ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "violet" | "emerald" | "amber";
}) {
  const styles = {
    violet: {
      bg: "bg-violet-600",
      value: "text-violet-600",
      bar: "bg-violet-200",
    },
    emerald: {
      bg: "bg-emerald-600",
      value: "text-emerald-600",
      bar: "bg-emerald-200",
    },
    amber: { bg: "bg-amber-500", value: "text-amber-600", bar: "bg-amber-200" },
  }[accent];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <div className={`w-2 h-2 rounded-full ${styles.bg}`} />
      </div>
      <p className={`text-4xl font-extrabold tracking-tight ${styles.value}`}>
        {value}
      </p>
      <div className={`h-1 rounded-full ${styles.bar} w-full`} />
    </div>
  );
}

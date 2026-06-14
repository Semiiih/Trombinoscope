import { useNavigate } from "react-router-dom";
import type { Class } from "../types";
import Table from "./Table";
import Tooltip from "./Tooltip";
import { Users, Pencil, Trash2 } from "lucide-react";

const COLUMNS = ["Label", "Année", "Élèves", "Créée le", ""];

export default function ClassesTable({
  classes,
  onEdit,
  onDelete,
}: {
  classes: Class[];
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
}) {
  const navigate = useNavigate();

  if (classes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl mb-3">🎓</p>
        <p className="text-slate-400 text-sm">Aucune classe. Créez-en une !</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile : cards */}
      <ul className="md:hidden divide-y divide-slate-100">
        {classes.map((cls) => (
          <li key={cls.id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 truncate">{cls.label}</p>
              <p className="text-xs text-slate-400">
                {cls.year} · {new Date(cls.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <span className="inline-block mt-1.5 bg-violet-100 text-violet-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {cls._count?.students ?? 0} élève{(cls._count?.students ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => navigate(`/students?classId=${cls.id}`)}
                aria-label="Voir les élèves"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Users size={16} />
              </button>
              <button
                onClick={() => onEdit(cls)}
                aria-label="Modifier"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(cls)}
                aria-label="Supprimer"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop : table */}
      <div className="hidden md:block">
        <Table columns={COLUMNS} empty={{ icon: "🎓", message: "Aucune classe. Créez-en une !" }}>
          {classes.map((cls) => (
            <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-700">{cls.label}</td>
              <td className="px-6 py-4 text-slate-500">{cls.year}</td>
              <td className="px-6 py-4">
                <span className="inline-block bg-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full">
                  {cls._count?.students ?? 0} élève{(cls._count?.students ?? 0) !== 1 ? "s" : ""}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-400 text-xs">
                {new Date(cls.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip label="Voir les élèves">
                    <button onClick={() => navigate(`/students?classId=${cls.id}`)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Users size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Modifier">
                    <button onClick={() => onEdit(cls)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <Pencil size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Supprimer">
                    <button onClick={() => onDelete(cls)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}

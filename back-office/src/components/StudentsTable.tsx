import type { Student } from "../types";
import Table from "./Table";
import Tooltip from "./Tooltip";
import { Camera, Pencil, Trash2, Loader2 } from "lucide-react";

const COLUMNS = ["Photo", "Nom", "Email", "Classe", ""];

export default function StudentsTable({
  students,
  uploadingId,
  onEdit,
  onDelete,
  onPhotoUpload,
}: {
  students: Student[];
  uploadingId: number | null;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  onPhotoUpload: (s: Student) => void;
}) {
  if (students.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl mb-3">👤</p>
        <p className="text-slate-400 text-sm">Aucun élève trouvé.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile : cards */}
      <ul className="md:hidden divide-y divide-slate-100">
        {students.map((s) => (
          <li key={s.id} className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center ring-2 ring-white shrink-0">
              {s.photoUrl ? (
                <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-violet-600 font-bold text-sm">
                  {s.firstName[0]}{s.lastName[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 truncate">{s.firstName} {s.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{s.email}</p>
              {s.class && (
                <span className="inline-block mt-1 bg-violet-100 text-violet-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {s.class.label} {s.class.year}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => onPhotoUpload(s)}
                disabled={uploadingId === s.id}
                aria-label="Changer la photo"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
              >
                {uploadingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              <button
                onClick={() => onEdit(s)}
                aria-label="Modifier"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(s)}
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
        <Table columns={COLUMNS} empty={{ icon: "👤", message: "Aucun élève trouvé." }}>
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center ring-2 ring-white">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-violet-600 font-bold text-sm">
                      {s.firstName[0]}{s.lastName[0]}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-700">{s.firstName} {s.lastName}</td>
              <td className="px-6 py-4 text-slate-400 text-xs">{s.email}</td>
              <td className="px-6 py-4">
                {s.class && (
                  <span className="inline-block bg-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full">
                    {s.class.label} {s.class.year}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip label="Changer la photo">
                    <button onClick={() => onPhotoUpload(s)} disabled={uploadingId === s.id} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors">
                      {uploadingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                  </Tooltip>

                  <Tooltip label="Modifier">
                    <button onClick={() => onEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <Pencil size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Supprimer">
                    <button onClick={() => onDelete(s)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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

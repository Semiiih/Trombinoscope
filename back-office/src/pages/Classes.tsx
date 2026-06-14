import { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { getClasses, deleteClass } from "../api/client";
import type { Class } from "../types";
import ClassesTable from "../components/ClassesTable";
import ClassModal from "../components/ClassModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Info } from "lucide-react";

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [editing, setEditing] = useState<Class | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Class | null>(null);
  const [blockedTarget, setBlockedTarget] = useState<{ label: string; message: string } | null>(null);

  const load = () => getClasses().then(setClasses).catch(console.error);
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setShowModal(true); }
  function openEdit(cls: Class) { setEditing(cls); setShowModal(true); }

  function handleDelete(cls: Class) {
    if ((cls._count?.students ?? 0) > 0) {
      setBlockedTarget({
        label: cls.label,
        message: `La classe "${cls.label}" contient encore ${cls._count?.students} élève${(cls._count?.students ?? 0) > 1 ? "s" : ""}. Désassignez-les d'abord depuis la page Élèves.`,
      });
    } else {
      setConfirmTarget(cls);
    }
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteClass(target.id);
      toast.success(`Classe "${target.label}" supprimée`);
      load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const message =
          err.response.data?.error ||
          err.response.data?.message ||
          `Impossible de supprimer la classe "${target.label}" : un ou plusieurs trombinoscopes ont déjà été générés à partir de cette classe.`;
        setBlockedTarget({ label: target.label, message });
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        // 403 toast already shown by axios interceptor
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-10">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">Gestion</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Classes</h1>
          <p className="text-sm text-slate-400 mt-1">
            {classes.length} classe{classes.length !== 1 ? "s" : ""} enregistrée{classes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto">
          + Nouvelle classe
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
        <ClassesTable classes={classes} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      {blockedTarget && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Info className="text-amber-500" size={22} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Impossible de supprimer</h3>
              <p className="text-sm text-slate-500">{blockedTarget.message}</p>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setBlockedTarget(null)} className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium">
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Supprimer la classe"
          message={`Supprimer "${confirmTarget.label}" ?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {showModal && (
        <ClassModal editing={editing} onClose={() => setShowModal(false)} onSaved={load} />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../api/client";
import type { Class } from "../types";
import Tooltip from "../components/Tooltip";
import ConfirmDialog from "../components/ConfirmDialog";
import { Info } from "lucide-react";

interface FormState {
  label: string;
  year: string;
}
const empty: FormState = { label: "", year: "" };

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<Class | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Class | null>(null);
  const [blockedTarget, setBlockedTarget] = useState<Class | null>(null);

  const load = () => getClasses().then(setClasses).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setShowModal(true);
  }
  function openEdit(cls: Class) {
    setEditing(cls);
    setForm({ label: cls.label, year: cls.year });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editing) await updateClass(editing.id, form);
      else await createClass(form);
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    try {
      await deleteClass(confirmTarget.id);
      load();
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setConfirmTarget(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Gestion
          </p>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Classes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {classes.length} classe{classes.length !== 1 ? "s" : ""} enregistrée
            {classes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          + Nouvelle classe
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {classes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">🎓</p>
            <p className="text-slate-400 text-sm">
              Aucune classe. Créez-en une !
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Élèves
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Créée le
                </th>
                <th className="px-6 py-3" />
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
                  <td className="px-6 py-4 text-slate-500">{cls.year}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full">
                      {cls._count?.students ?? 0} élève
                      {(cls._count?.students ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(cls.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label="Modifier">
                        <button
                          onClick={() => openEdit(cls)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 112.97 2.97L7.5 18.79l-4 1 1-4 12.362-12.303z" />
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <button
                          onClick={() =>
                            (cls._count?.students ?? 0) > 0
                              ? setBlockedTarget(cls)
                              : setConfirmTarget(cls)
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Blocked Delete */}
      {blockedTarget && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Info className="text-amber-500" size={22} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Impossible de supprimer</h3>
              <p className="text-sm text-slate-500">
                La classe <span className="font-semibold text-slate-700">"{blockedTarget.label}"</span> contient encore{" "}
                <span className="font-semibold text-slate-700">{blockedTarget._count?.students} élève{(blockedTarget._count?.students ?? 0) > 1 ? "s" : ""}</span>.
                Désassignez-les d'abord depuis la page Élèves.
              </p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setBlockedTarget(null)}
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmTarget && (
        <ConfirmDialog
          title="Supprimer la classe"
          message={`Supprimer "${confirmTarget.label}" ?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? "Modifier la classe" : "Nouvelle classe"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}
            <Field
              label="Label"
              value={form.label}
              onChange={(v) => setForm((f) => ({ ...f, label: v }))}
              placeholder="ex: BTS SIO"
            />
            <Field
              label="Année"
              value={form.year}
              onChange={(v) => setForm((f) => ({ ...f, year: v }))}
              placeholder="ex: 2024-2025"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  );
}

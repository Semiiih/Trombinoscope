import { useEffect, useState } from "react";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../api/client";
import type { Class } from "../types";

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
      if (editing) {
        await updateClass(editing.id, form);
      } else {
        await createClass(form);
      }
      setShowModal(false);
      load();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(cls: Class) {
    if (
      !confirm(
        `Supprimer la classe "${cls.label}" ? Tous les élèves seront supprimés.`,
      )
    )
      return;
    try {
      await deleteClass(cls.id);
      load();
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Classes</h2>
          <p className="text-gray-500 text-sm mt-1">
            {classes.length} classe(s)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Nouvelle classe
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {classes.length === 0 ? (
          <p className="text-gray-400 text-center py-16">
            Aucune classe. Créez-en une !
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Label</th>
                <th className="px-5 py-3 text-left">Année</th>
                <th className="px-5 py-3 text-left">Élèves</th>
                <th className="px-5 py-3 text-left">Créée le</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium">{cls.label}</td>
                  <td className="px-5 py-3 text-gray-600">{cls.year}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {cls._count?.students ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(cls.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(cls)}
                      className="text-indigo-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? "Modifier la classe" : "Nouvelle classe"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">
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
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}

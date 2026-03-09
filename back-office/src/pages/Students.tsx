import { useEffect, useRef, useState } from "react";
import {
  getClasses,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadPhoto,
} from "../api/client";
import type { Class, Student } from "../types";
import Select from "../components/Select";
import Tooltip from "../components/Tooltip";
import ConfirmDialog from "../components/ConfirmDialog";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  classId: number | "";
}
const empty: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  classId: "",
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<Student | null>(null);

  const load = () =>
    getStudents({
      class_id: filterClass ? Number(filterClass) : undefined,
      q: search || undefined,
    })
      .then(setStudents)
      .catch(console.error);

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);
  useEffect(() => {
    load();
  }, [filterClass, search]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setShowModal(true);
  }
  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      classId: s.classId ?? "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && form.classId === "") return;
    setLoading(true);
    setError("");
    try {
      const classId = form.classId === "" ? null : Number(form.classId);
      if (editing) await updateStudent(editing.id, { ...form, classId });
      else await createStudent({ ...form, classId: classId! });
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    try {
      await deleteStudent(confirmTarget.id);
      load();
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setConfirmTarget(null);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!photoTarget || !e.target.files?.[0]) return;
    setUploadingId(photoTarget.id);
    try {
      await uploadPhoto(photoTarget.id, e.target.files[0]);
      load();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Erreur lors de l'upload");
    } finally {
      setUploadingId(null);
      setPhotoTarget(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function triggerPhotoUpload(s: Student) {
    setPhotoTarget(s);
    fileRef.current?.click();
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
            Élèves
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {students.length} élève{students.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          + Nouvel élève
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email...)"
          className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent flex-1 max-w-xs transition"
        />
        <Select
          value={filterClass}
          onChange={setFilterClass}
          placeholder="Toutes les classes"
          options={classes.map((c) => ({
            value: String(c.id),
            label: `${c.label} — ${c.year}`,
          }))}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {students.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">👤</p>
            <p className="text-slate-400 text-sm">Aucun élève trouvé.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center ring-2 ring-white">
                      {s.photoUrl ? (
                        <img
                          src={s.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-violet-600 font-bold text-sm">
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {s.email}
                  </td>
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
                        <button
                          onClick={() => triggerPhotoUpload(s)}
                          disabled={uploadingId === s.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                        >
                          {uploadingId === s.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </Tooltip>
                      <Tooltip label="Modifier">
                        <button
                          onClick={() => openEdit(s)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 112.97 2.97L7.5 18.79l-4 1 1-4 12.362-12.303z" />
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <button
                          onClick={() => setConfirmTarget(s)}
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

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Confirm Delete */}
      {confirmTarget && (
        <ConfirmDialog
          title="Supprimer l'élève"
          message={`Supprimer ${confirmTarget.firstName} ${confirmTarget.lastName} ?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? "Modifier l'élève" : "Nouvel élève"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Prénom"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
              />
              <Field
                label="Nom"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
              />
            </div>
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              type="email"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Classe
              </label>
              <Select
                value={String(form.classId)}
                onChange={(v) => setForm((f) => ({ ...f, classId: v === "" ? "" : Number(v) }))}
                placeholder="Sélectionner une classe"
                options={classes.map((c) => ({
                  value: String(c.id),
                  label: `${c.label} — ${c.year}`,
                }))}
              />
            </div>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  );
}

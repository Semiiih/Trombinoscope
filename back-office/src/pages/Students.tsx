import { useEffect, useRef, useState } from 'react';
import {
  getClasses, getStudents, createStudent, updateStudent, deleteStudent, uploadPhoto,
} from '../api/client';
import type { Class, Student } from '../types';

interface FormState { firstName: string; lastName: string; email: string; classId: number | '' }
const empty: FormState = { firstName: '', lastName: '', email: '', classId: '' };

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<Student | null>(null);

  const load = () =>
    getStudents({ class_id: filterClass ? Number(filterClass) : undefined, q: search || undefined })
      .then(setStudents)
      .catch(console.error);

  useEffect(() => { getClasses().then(setClasses).catch(console.error); }, []);
  useEffect(() => { load(); }, [filterClass, search]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError('');
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, classId: s.classId });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.classId === '') return;
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, classId: Number(form.classId) };
      if (editing) await updateStudent(editing.id, payload);
      else await createStudent(payload);
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(s: Student) {
    if (!confirm(`Supprimer ${s.firstName} ${s.lastName} ?`)) return;
    try { await deleteStudent(s.id); load(); }
    catch { alert('Erreur lors de la suppression'); }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!photoTarget || !e.target.files?.[0]) return;
    setUploadingId(photoTarget.id);
    try {
      await uploadPhoto(photoTarget.id, e.target.files[0]);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploadingId(null);
      setPhotoTarget(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function triggerPhotoUpload(s: Student) {
    setPhotoTarget(s);
    fileRef.current?.click();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Élèves</h2>
          <p className="text-gray-500 text-sm mt-1">{students.length} élève(s)</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Nouvel élève
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email...)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1 max-w-xs"
        />
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.label} — {c.year}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-16">Aucun élève trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Photo</th>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Classe</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-sm">
                          {s.firstName[0]}{s.lastName[0]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="px-5 py-3 text-gray-500">{s.email}</td>
                  <td className="px-5 py-3">
                    {s.class && (
                      <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {s.class.label} {s.class.year}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => triggerPhotoUpload(s)}
                      disabled={uploadingId === s.id}
                      className="text-emerald-600 hover:underline disabled:opacity-40"
                    >
                      {uploadingId === s.id ? '...' : '📷 Photo'}
                    </button>
                    <button onClick={() => openEdit(s)} className="text-indigo-600 hover:underline">Modifier</button>
                    <button onClick={() => handleDelete(s)} className="text-red-500 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hidden file input for photo */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Modifier l\'élève' : 'Nouvel élève'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
              <Field label="Nom" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
            </div>
            <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select
                required
                value={form.classId}
                onChange={e => setForm(f => ({ ...f, classId: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.label} — {c.year}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}

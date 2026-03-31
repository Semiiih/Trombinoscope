import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getClasses,
  getStudents,
  deleteStudent,
  uploadPhoto,
} from "../api/client";
import type { Class, Student } from "../types";
import Select from "../components/Select";
import SearchBar from "../components/SearchBar";
import Breadcrumb from "../components/Breadcrumb";
import StudentsTable from "../components/StudentsTable";
import StudentModal from "../components/StudentModal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Students() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterClass, setFilterClass] = useState(
    searchParams.get("classId") ?? "",
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Student | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<Student | null>(null);

  const load = useCallback(
    () =>
      getStudents({
        class_id: filterClass ? Number(filterClass) : undefined,
        q: search || undefined,
      })
        .then(setStudents)
        .catch(console.error),
    [filterClass, search],
  );

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowModal(true);
  }
  function openEdit(s: Student) {
    setEditing(s);
    setShowModal(true);
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

  const selectedClass = filterClass
    ? classes.find((c) => c.id === Number(filterClass))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <Breadcrumb
            parent="Gestion"
            parentPath="/classes"
            current={selectedClass?.label}
          />
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

      <div className="flex gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher (nom, email...)"
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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <StudentsTable
          students={students}
          uploadingId={uploadingId}
          onEdit={openEdit}
          onDelete={setConfirmTarget}
          onPhotoUpload={(s) => {
            setPhotoTarget(s);
            fileRef.current?.click();
          }}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {confirmTarget && (
        <ConfirmDialog
          title="Supprimer l'élève"
          message={`Supprimer ${confirmTarget.firstName} ${confirmTarget.lastName} ?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {showModal && (
        <StudentModal
          editing={editing}
          classes={classes}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

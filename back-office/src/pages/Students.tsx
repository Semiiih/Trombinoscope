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
import CropModal from "../components/CropModal";
import PhotoPreviewModal from "../components/PhotoPreviewModal";
import { fileToDataUrl } from "../utils/fileToDataUrl";

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

  // Image originale sélectionnée — jamais écrasée entre les crops
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  // URL de la vignette uploadée pour l'aperçu
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Affichage du crop modal
  const [showCrop, setShowCrop] = useState(false);

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

  // ── 1. Sélection → data URL stable → upload auto ─────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!photoTarget || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Convertir en data URL AVANT de vider l'input (évite invalidation du File)
    const dataUrl = await fileToDataUrl(file);
    setCropSourceUrl(dataUrl);

    if (fileRef.current) fileRef.current.value = "";
    setUploadingId(photoTarget.id);
    try {
      const updated = await uploadPhoto(photoTarget.id, file);
      load();
      setPreviewUrl(updated.photoUrl ?? null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Erreur lors de l'upload");
      setCropSourceUrl(null);
      setPhotoTarget(null);
    } finally {
      setUploadingId(null);
    }
  }

  // ── 2a. Confirmer → ferme la popup ───────────────────────────────────────
  function handlePreviewConfirm() {
    setPreviewUrl(null);
    setCropSourceUrl(null);
    setPhotoTarget(null);
  }

  // ── 2b. Rogner manuellement → ouvre le crop modal ────────────────────────
  // cropSourceUrl est inchangé — CropModal reçoit toujours l'original
  function handleOpenCrop() {
    setPreviewUrl(null);
    setShowCrop(true);
  }

  // ── 3. Crop confirmé → upload du résultat rogné ──────────────────────────
  // cropSourceUrl N'EST PAS modifié ici → le prochain rogner repart de l'original
  async function handleCropConfirm(blob: Blob) {
    if (!photoTarget) return;
    setShowCrop(false);
    setUploadingId(photoTarget.id);
    try {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const updated = await uploadPhoto(photoTarget.id, file);
      load();
      setPreviewUrl(updated.photoUrl ?? null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Erreur lors de l'upload");
      setCropSourceUrl(null);
      setPhotoTarget(null);
    } finally {
      setUploadingId(null);
    }
  }

  function handleCropCancel() {
    setShowCrop(false);
    // On garde cropSourceUrl : l'utilisateur peut vouloir re-rogner depuis la preview
    setPhotoTarget(null);
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

      {previewUrl && (
        <PhotoPreviewModal
          photoUrl={previewUrl}
          onConfirm={handlePreviewConfirm}
          onCropManually={handleOpenCrop}
        />
      )}

      {showCrop && cropSourceUrl && (
        <CropModal
          imageUrl={cropSourceUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
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

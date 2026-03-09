import { useRef, useState } from "react";
import { FolderOpen } from "lucide-react";
import { importCsv } from "../api/client";
import type { ImportResult } from "../types";

export default function ImportCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await importCsv(file);
      setResult(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Import
          </p>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Import CSV
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Importez des élèves en masse via un fichier CSV.
          </p>
        </div>

        {/* Format info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Format attendu
          </p>
          <pre className="text-xs text-violet-700 bg-violet-50 rounded-xl p-4 border border-violet-100 overflow-x-auto leading-relaxed">
            {`first_name,last_name,email,class_label,year
Alice,Dupont,alice@example.com,BTS SIO,2024-2025
Bob,Martin,bob@example.com,BTS SIO,2024-2025`}
          </pre>
          <div className="mt-4 space-y-2">
            {[
              "Si la classe n'existe pas, elle sera créée automatiquement",
              "Si l'email existe déjà, l'élève sera mis à jour",
              "Taille max : 2 MB",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                  ·
                </span>
                <p className="text-xs text-slate-500">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
              file
                ? "border-violet-400 bg-violet-50"
                : "border-slate-200 hover:border-violet-300"
            }`}
          >
            <FolderOpen
              size={48}
              className="mb-3 place-self-center text-violet-300"
            />
            {file ? (
              <p className="text-sm font-semibold text-violet-700">
                {file.name}
              </p>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-xs text-slate-400">Format .csv uniquement</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm"
            >
              {loading ? "Import en cours..." : "Importer"}
            </button>
            {(file || result) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-4">
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Résultats
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <p className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                  {result.created}
                </p>
                <div className="h-1 bg-emerald-100 rounded-full my-3 mx-4" />
                <p className="text-xs text-slate-500 font-medium">
                  Élève(s) créé(s) / mis à jour
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <p className="text-4xl font-extrabold text-red-500 tracking-tight">
                  {result.errors}
                </p>
                <div className="h-1 bg-red-100 rounded-full my-3 mx-4" />
                <p className="text-xs text-slate-500 font-medium">Erreur(s)</p>
              </div>
            </div>

            {result.details.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <p className="px-6 py-4 font-semibold text-sm text-slate-700 border-b border-slate-100">
                  Détails ligne par ligne
                </p>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {result.details.map((d, i) => (
                    <div key={i} className="px-6 py-3 flex items-start gap-3">
                      <span
                        className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${d.error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {d.error ? "ERR" : "OK"}
                      </span>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">
                          {d.row.first_name} {d.row.last_name}
                        </span>
                        <span className="text-slate-400 ml-2">
                          {d.row.email}
                        </span>
                        {d.error && (
                          <p className="text-red-500 mt-0.5">{d.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

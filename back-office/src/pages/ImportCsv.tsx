import { useRef, useState } from 'react';
import { importCsv } from '../api/client';
import type { ImportResult } from '../types';

export default function ImportCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await importCsv(file);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Import CSV</h2>
      <p className="text-gray-500 mb-8">Importez des élèves en masse via un fichier CSV.</p>

      {/* Format info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
        <p className="text-sm font-semibold text-indigo-700 mb-2">Format attendu du CSV :</p>
        <pre className="text-xs text-indigo-600 bg-white rounded p-3 border border-indigo-100 overflow-x-auto">
{`first_name,last_name,email,class_label,year
Alice,Dupont,alice@example.com,BTS SIO,2024-2025
Bob,Martin,bob@example.com,BTS SIO,2024-2025`}
        </pre>
        <ul className="mt-3 text-xs text-indigo-600 space-y-1 list-disc list-inside">
          <li>Si la classe n'existe pas, elle sera créée automatiquement</li>
          <li>Si l'email existe déjà, l'élève sera mis à jour</li>
          <li>Taille max : 2 MB</li>
        </ul>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 transition"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-4xl mb-2">📂</p>
          {file ? (
            <p className="text-sm font-medium text-indigo-700">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-500">Cliquez ou déposez votre fichier CSV ici</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40"
          >
            {loading ? 'Import en cours...' : 'Importer'}
          </button>
          {(file || result) && (
            <button type="button" onClick={handleReset} className="px-5 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
              Réinitialiser
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-emerald-700">{result.created}</p>
              <p className="text-sm text-emerald-600 mt-1">Élève(s) créé(s) / mis à jour</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-red-600">{result.errors}</p>
              <p className="text-sm text-red-500 mt-1">Erreur(s)</p>
            </div>
          </div>

          {result.details.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <p className="px-5 py-3 font-semibold text-sm text-gray-700 border-b">Détails ligne par ligne</p>
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {result.details.map((d, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${d.error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {d.error ? 'ERR' : 'OK'}
                    </span>
                    <div className="text-xs">
                      <span className="font-medium">{d.row.first_name} {d.row.last_name}</span>
                      <span className="text-gray-400 ml-2">{d.row.email}</span>
                      {d.error && <p className="text-red-500 mt-0.5">{d.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

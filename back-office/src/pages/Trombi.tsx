import { useEffect, useState } from 'react';
import { getClasses, downloadTrombi } from '../api/client';
import type { Class } from '../types';

export default function Trombi() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState('');
  const [format, setFormat] = useState<'html' | 'pdf'>('html');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { getClasses().then(setClasses).catch(console.error); }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const blob = await downloadTrombi(Number(classId), format);
      const cls = classes.find(c => c.id === Number(classId));
      const filename = `trombinoscope_${cls?.label ?? classId}_${cls?.year ?? ''}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Fichier "${filename}" téléchargé avec succès !`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  }

  const selectedClass = classes.find(c => c.id === Number(classId));

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Générer un Trombinoscope</h2>
      <p className="text-gray-500 mb-8">Sélectionnez une classe et un format pour générer et télécharger le trombinoscope.</p>

      <form onSubmit={handleGenerate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Classe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
          <select
            required
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Sélectionner une classe</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.label} — {c.year} ({c._count?.students ?? 0} élève(s))</option>
            ))}
          </select>
          {selectedClass && (
            <p className="text-xs text-gray-400 mt-1">{selectedClass._count?.students ?? 0} élève(s) dans cette classe</p>
          )}
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
          <div className="flex gap-3">
            {(['html', 'pdf'] as const).map(f => (
              <label key={f} className={`flex items-center gap-3 flex-1 border-2 rounded-xl p-4 cursor-pointer transition ${format === f ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="accent-indigo-600" />
                <div>
                  <p className="font-semibold text-sm">{f.toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{f === 'html' ? 'Page web avec Tailwind CSS' : 'Document PDF imprimable'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">{success}</p>}

        <button
          type="submit"
          disabled={!classId || loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40"
        >
          {loading ? 'Génération en cours...' : `Générer le trombinoscope (${format.toUpperCase()})`}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-700">Comment ça marche ?</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Le fichier est généré côté serveur et téléchargé automatiquement</li>
          <li>L'export est enregistré en base de données</li>
          <li>Le HTML utilise Tailwind CSS (affichable dans un navigateur)</li>
          <li>Le PDF est prêt à imprimer avec les photos des élèves</li>
        </ul>
      </div>
    </div>
  );
}

const TIPS = [
  "Si la classe n'existe pas, elle sera créée automatiquement",
  "Si l'email existe déjà, l'élève sera mis à jour",
  "Taille max : 2 MB",
];

export default function CsvFormatInfo() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Format attendu</p>
      <pre className="text-xs text-violet-700 bg-violet-50 rounded-xl p-4 border border-violet-100 overflow-x-auto leading-relaxed">
        {`first_name,last_name,email,class_label,year\nAlice,Dupont,alice@example.com,BTS SIO,2024-2025\nBob,Martin,bob@example.com,BTS SIO,2024-2025`}
      </pre>
      <div className="mt-4 space-y-2">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold flex-shrink-0">·</span>
            <p className="text-xs text-slate-500">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

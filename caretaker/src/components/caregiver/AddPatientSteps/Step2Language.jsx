const LANGUAGES = [
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Assamese', label: 'অসমীয়া (Assamese)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Manipuri', label: 'মৈতৈলোন্ (Manipuri)' },
  { code: 'Mizo', label: 'Mizo ṭawng' },
  { code: 'Khasi', label: 'Khasi' },
  { code: 'English', label: 'English' },
]

export default function Step2Language({ patient, updatePatient }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">Preferred Language</h3>
      <p className="text-xs text-ink/60">
        This is the language the patient will see in their app.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LANGUAGES.map((lang) => {
          const selected = patient.preferredLanguage === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => updatePatient({ preferredLanguage: lang.code })}
              className={`p-4 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                selected
                  ? 'border-fire bg-fire/10'
                  : 'border-clay/40 bg-cream hover:border-clay'
              }`}
            >
              <p className="text-sm font-semibold text-ink">{lang.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

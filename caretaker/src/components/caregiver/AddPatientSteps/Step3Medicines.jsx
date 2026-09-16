import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../common/Button'

export default function Step3Medicines({ patient, updatePatient }) {
  const [draft, setDraft] = useState({ medicineName: '', dosage: '', time: '08:00' })

  const add = () => {
    if (!draft.medicineName) return
    updatePatient({
      prescriptions: [
        ...(patient.prescriptions || []),
        {
          id: 'rx_' + Date.now(),
          medicineName: draft.medicineName,
          dosage: draft.dosage,
          instructions: '',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: '',
          doctorName: patient.doctorName || '',
        },
      ],
      medications: [
        ...(patient.medications || []),
        {
          id: 'ms_' + Date.now(),
          medicineName: draft.medicineName,
          dosage: draft.dosage,
          time: draft.time,
          status: 'pending',
        },
      ],
    })
    setDraft({ medicineName: '', dosage: '', time: '08:00' })
  }

  const remove = (id) => {
    updatePatient({
      prescriptions: (patient.prescriptions || []).filter((p) => p.id !== id.replace('ms_', 'rx_')),
      medications: (patient.medications || []).filter((m) => m.id !== id),
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">Medicines & Schedule</h3>
      <p className="text-xs text-ink/60">Add medicines the patient needs to take daily.</p>

      <div className="bg-cream rounded-xl p-4 border border-clay/40 space-y-3">
        <input
          type="text"
          value={draft.medicineName}
          onChange={(e) => setDraft({ ...draft, medicineName: e.target.value })}
          placeholder="Medicine name (e.g., Donepezil)"
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.dosage}
            onChange={(e) => setDraft({ ...draft, dosage: e.target.value })}
            placeholder="Dosage (e.g., 5 mg)"
            className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          />
          <input
            type="time"
            value={draft.time}
            onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          />
        </div>
        <Button onClick={add} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Medicine
        </Button>
      </div>

      {(!patient.medications || patient.medications.length === 0) ? (
        <p className="text-sm text-ink/50 text-center py-4">No medicines added yet</p>
      ) : (
        <div className="space-y-2">
          {patient.medications.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-clay/40">
              <div>
                <p className="text-sm font-semibold text-ink">{m.medicineName}</p>
                <p className="text-xs text-ink/60">{m.dosage} • {m.time}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

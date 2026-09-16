import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../common/Button'

export default function Step4Tasks({ patient, updatePatient }) {
  const [draft, setDraft] = useState({ title: '', time: '09:00' })

  const add = () => {
    if (!draft.title) return
    updatePatient({
      tasks: [
        ...(patient.tasks || []),
        {
          id: 't_' + Date.now(),
          title: draft.title,
          description: '',
          time: draft.time,
          status: 'pending',
        },
      ],
    })
    setDraft({ title: '', time: '09:00' })
  }

  const remove = (id) => {
    updatePatient({ tasks: (patient.tasks || []).filter((t) => t.id !== id) })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">Daily Tasks</h3>
      <p className="text-xs text-ink/60">Add daily activities the patient should complete.</p>

      <div className="bg-cream rounded-xl p-4 border border-clay/40 space-y-3">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Task (e.g., Morning Walk)"
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
        <input
          type="time"
          value={draft.time}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
        <Button onClick={add} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {(!patient.tasks || patient.tasks.length === 0) ? (
        <p className="text-sm text-ink/50 text-center py-4">No tasks added yet</p>
      ) : (
        <div className="space-y-2">
          {patient.tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-clay/40">
              <div>
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                <p className="text-xs text-ink/60">{t.time}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
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

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../common/Button'

export default function Step5Memories({ patient, updatePatient }) {
  const [draft, setDraft] = useState({
    title: '',
    relationship: '',
    category: 'family',
    description: '',
  })

  const add = () => {
    if (!draft.title) return
    updatePatient({
      memories: [...(patient.memories || []), { id: 'mem_' + Date.now(), ...draft }],
    })
    setDraft({ title: '', relationship: '', category: 'family', description: '' })
  }

  const remove = (id) => {
    updatePatient({ memories: (patient.memories || []).filter((m) => m.id !== id) })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">Important People & Places</h3>
      <p className="text-xs text-ink/60">Add family members, familiar places, or things the patient loves.</p>

      <div className="bg-cream rounded-xl p-4 border border-clay/40 space-y-3">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Name (e.g., Anita)"
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
        <input
          type="text"
          value={draft.relationship}
          onChange={(e) => setDraft({ ...draft, relationship: e.target.value })}
          placeholder="Relationship (e.g., Daughter)"
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
        <select
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        >
          <option value="family">Family</option>
          <option value="places">Places</option>
          <option value="food">Food</option>
          <option value="hobbies">Hobbies</option>
          <option value="events">Events</option>
        </select>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2.5 bg-surface border border-clay/40 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire resize-none"
        />
        <Button onClick={add} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Memory
        </Button>
      </div>

      {(!patient.memories || patient.memories.length === 0) ? (
        <p className="text-sm text-ink/50 text-center py-4">No memories added yet</p>
      ) : (
        <div className="space-y-2">
          {patient.memories.map((m) => (
            <div key={m.id} className="flex items-start justify-between p-3 bg-cream rounded-xl border border-clay/40">
              <div>
                <p className="text-sm font-semibold text-ink">{m.title}</p>
                <p className="text-xs text-ink/60">{m.relationship}</p>
                {m.description && <p className="text-xs text-ink/70 mt-1">{m.description}</p>}
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

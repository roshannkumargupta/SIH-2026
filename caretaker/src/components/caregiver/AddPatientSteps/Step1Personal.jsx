export default function Step1Personal({ patient, updatePatient }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">Personal Information</h3>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Full Name *</label>
        <input
          type="text"
          value={patient.name}
          onChange={(e) => updatePatient({ name: e.target.value })}
          placeholder="e.g., Savitri Devi"
          className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Age *</label>
          <input
            type="number"
            value={patient.age}
            onChange={(e) => updatePatient({ age: e.target.value })}
            placeholder="72"
            className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Gender</label>
          <select
            value={patient.gender}
            onChange={(e) => updatePatient({ gender: e.target.value })}
            className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          >
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Phone</label>
        <input
          type="tel"
          value={patient.phone}
          onChange={(e) => updatePatient({ phone: e.target.value })}
          placeholder="+91 98765 43210"
          className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Address</label>
        <input
          type="text"
          value={patient.address}
          onChange={(e) => updatePatient({ address: e.target.value })}
          placeholder="Village Rampur, Assam"
          className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Emergency Contact</label>
          <input
            type="text"
            value={patient.emergencyContactName}
            onChange={(e) => updatePatient({ emergencyContactName: e.target.value })}
            placeholder="Priya Devi (Daughter)"
            className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Emergency Phone</label>
          <input
            type="tel"
            value={patient.emergencyContact}
            onChange={(e) => updatePatient({ emergencyContact: e.target.value })}
            placeholder="+91 98765 43211"
            className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-fire"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Assigned Doctor (Optional)</label>
        <input
          type="text"
          value={patient.doctorName}
          onChange={(e) => updatePatient({ doctorName: e.target.value })}
          placeholder="e.g., Dr. Anil Baruah (optional)"
          className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
        />
      </div>
    </div>
  )
}

export const mockPrescriptions = [
  { id: 'rx1', medicineName: 'Donepezil', dosage: '5 mg', instructions: 'Take after breakfast', startDate: '2025-09-01', endDate: '2025-12-01', doctorName: 'Dr. Anil Baruah' },
  { id: 'rx2', medicineName: 'Memantine', dosage: '10 mg', instructions: 'Take before sleep', startDate: '2025-09-01', endDate: '2025-12-01', doctorName: 'Dr. Anil Baruah' },
  { id: 'rx3', medicineName: 'Vitamin B12', dosage: '500 mcg', instructions: 'Take after lunch', startDate: '2025-09-05', endDate: '2025-11-05', doctorName: 'Dr. Anil Baruah' },
]

export const mockMedicationLogs = [
  { id: 'ml1', medicineName: 'Donepezil', scheduledTime: '08:00', takenAt: '08:05', status: 'taken' },
  { id: 'ml2', medicineName: 'Vitamin B12', scheduledTime: '14:00', takenAt: '14:10', status: 'taken' },
  { id: 'ml3', medicineName: 'Memantine', scheduledTime: '21:00', takenAt: null, status: 'pending' },
]
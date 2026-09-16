export const patientData = {
  id: 'p1',
  name: 'Savitri Devi',
  age: 72,
  gender: 'Female',
  phone: '+91 98765 43210',
  preferredLanguage: 'Hindi',
  emergencyContactName: 'Priya Devi (Daughter)',
  emergencyContact: '+91 98765 43211',
  address: 'Village Rampur, Assam',
  joinedAt: '2025-01-15',
  status: 'active',
  doctorName: 'Dr. Anil Baruah',
  pin: '4321',

  prescriptions: [
    { id: 'rx1', medicineName: 'Donepezil', dosage: '5 mg', instructions: 'Take after breakfast', startDate: '2025-09-01', endDate: '2025-12-01', doctorName: 'Dr. Anil Baruah' },
    { id: 'rx2', medicineName: 'Memantine', dosage: '10 mg', instructions: 'Take before sleep', startDate: '2025-09-01', endDate: '2025-12-01', doctorName: 'Dr. Anil Baruah' },
    { id: 'rx3', medicineName: 'Vitamin B12', dosage: '500 mcg', instructions: 'Take with water after lunch', startDate: '2025-09-05', endDate: '2025-11-05', doctorName: 'Dr. Anil Baruah' },
  ],

  medications: [
    { id: 'ms1', medicineName: 'Donepezil', dosage: '5 mg', time: '08:00', scheduledTime: '08:00', takenAt: '08:05', status: 'taken' },
    { id: 'ms2', medicineName: 'Vitamin B12', dosage: '500 mcg', time: '14:00', scheduledTime: '14:00', takenAt: '14:10', status: 'taken' },
    { id: 'ms3', medicineName: 'Memantine', dosage: '10 mg', time: '21:00', scheduledTime: '21:00', takenAt: null, status: 'pending' },
  ],

  tasks: [
    { id: 't1', title: 'Morning Walk', description: 'Walk 15 min', time: '09:00', completedAt: '09:10', status: 'completed' },
    { id: 't2', title: 'Drink Water', description: 'Drink a glass', time: '10:00', completedAt: '10:05', status: 'completed' },
    { id: 't3', title: 'Memory Exercise', description: 'Play memory game', time: '11:00', completedAt: null, status: 'pending' },
    { id: 't4', title: 'Call Family', description: 'Call son', time: '18:00', completedAt: null, status: 'pending' },
  ],

  games: [
    { id: 'gs1', gameName: 'Memory Matching', score: 90, accuracy: 90, durationSeconds: 240, difficulty: 'easy', completedAt: '2025-09-11T11:00:00' },
    { id: 'gs2', gameName: 'Pattern Recognition', score: 75, accuracy: 75, durationSeconds: 180, difficulty: 'medium', completedAt: '2025-09-11T11:15:00' },
    { id: 'gs3', gameName: 'Object Recall', score: 82, accuracy: 82, durationSeconds: 220, difficulty: 'easy', completedAt: '2025-09-10T11:00:00' },
    { id: 'gs4', gameName: 'Memory Matching', score: 85, accuracy: 85, durationSeconds: 230, difficulty: 'medium', completedAt: '2025-09-09T11:00:00' },
    { id: 'gs5', gameName: 'Sequence Memory', score: 78, accuracy: 78, durationSeconds: 200, difficulty: 'medium', completedAt: '2025-09-09T11:20:00' },
  ],

  progress: {
    overallScore: 89,
    medicationAdherence: 92,
    taskCompletion: 85,
    gamePerformance: 84,
    trend: 'improving',
    confidence: 0.81,
  },

  dailyScores: [
    { date: '2025-09-05', overallScore: 82 },
    { date: '2025-09-06', overallScore: 84 },
    { date: '2025-09-07', overallScore: 65 },
    { date: '2025-09-08', overallScore: 87 },
    { date: '2025-09-09', overallScore: 86 },
    { date: '2025-09-10', overallScore: 91 },
    { date: '2025-09-11', overallScore: 89 },
  ],
}

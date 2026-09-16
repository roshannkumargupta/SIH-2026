import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { savePatient, hasCustomPatient, getPatient } from '../../utils/patientStore'

import Step1Personal from '../../components/caregiver/AddPatientSteps/Step1Personal'
import Step2Language from '../../components/caregiver/AddPatientSteps/Step2Language'
import Step3Medicines from '../../components/caregiver/AddPatientSteps/Step3Medicines'
import Step4Tasks from '../../components/caregiver/AddPatientSteps/Step4Tasks'
import Step5Memories from '../../components/caregiver/AddPatientSteps/Step5Memories'

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Language' },
  { id: 3, label: 'Medicines' },
  { id: 4, label: 'Tasks' },
  { id: 5, label: 'Memories' },
]

const EMPTY_PATIENT = {
  id: 'p_' + Date.now(),
  name: '',
  age: '',
  gender: 'Female',
  phone: '',
  address: '',
  emergencyContactName: '',
  emergencyContact: '',
  doctorName: '',
  pin: '1234',
  preferredLanguage: 'Hindi',
  prescriptions: [],
  medications: [],
  tasks: [],
  memories: [],
  joinedAt: new Date().toISOString().slice(0, 10),
  status: 'active',
  progress: {
    overallScore: 0,
    medicationAdherence: 0,
    taskCompletion: 0,
    gamePerformance: 0,
    trend: 'stable',
    confidence: 0,
  },
  dailyScores: [],
  games: [],
}

export default function AddPatient() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [patient, setPatient] = useState(EMPTY_PATIENT)
  const [isEditMode, setIsEditMode] = useState(false)

  // If a patient already exists, pre-fill the form (edit mode)
  useEffect(() => {
    if (hasCustomPatient()) {
      const existing = getPatient()
      setPatient(existing)
      setIsEditMode(true)
    }
  }, [])

  const updatePatient = (updates) => setPatient((prev) => ({ ...prev, ...updates }))
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  const handleFinish = () => {
    if (!patient.name || !patient.age) {
      alert('Please enter name and age')
      setStep(1)
      return
    }
    savePatient(patient)
    navigate('/caregiver')
  }

  const progress = (step / STEPS.length) * 100

  return (
    <DashboardLayout title={isEditMode ? 'Edit Patient' : 'Add Patient'}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink/60 font-medium">
              Step {step} of {STEPS.length}: {STEPS[step - 1].label}
            </span>
            <span className="text-xs text-fire font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-clay/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-fire transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          {step === 1 && <Step1Personal patient={patient} updatePatient={updatePatient} />}
          {step === 2 && <Step2Language patient={patient} updatePatient={updatePatient} />}
          {step === 3 && <Step3Medicines patient={patient} updatePatient={updatePatient} />}
          {step === 4 && <Step4Tasks patient={patient} updatePatient={updatePatient} />}
          {step === 5 && <Step5Memories patient={patient} updatePatient={updatePatient} />}
        </Card>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={step === 1 ? () => navigate('/caregiver') : back}
            className="flex-1"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>
          {step < STEPS.length ? (
            <Button onClick={next} className="flex-1">Next →</Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1">
              {isEditMode ? '✓ Update Patient' : '✓ Save Patient'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

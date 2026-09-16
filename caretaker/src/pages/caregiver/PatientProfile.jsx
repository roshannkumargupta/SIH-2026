import { useState } from 'react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { Badge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { ProgressChart } from '../../components/charts/ProgressChart'
import { MedicineRow } from '../../components/caregiver/MedicineRow'
import { TaskRow } from '../../components/caregiver/TaskRow'
import { QuestionnaireTab } from '../../components/caregiver/QuestionnaireTab'
import { getPatient } from '../../utils/patientStore'
import {
  User,
  Heart,
  Pill,
  CheckCircle,
  Gamepad2,
  TrendingUp,
  FileText,
  Activity,
} from 'lucide-react'

const TABS = [
  'Overview',
  'Prescriptions',
  'Medications',
  'Tasks',
  'Progress',
  'Questionnaire',
]

export default function PatientProfile() {
  const [activeTab, setActiveTab] = useState('Overview')
  const patient = getPatient()

  const overallScore = patient.progress?.overallScore ?? 0
  const medAdherence = patient.progress?.medicationAdherence ?? 0
  const taskComp = patient.progress?.taskCompletion ?? 0
  const gamePerf = patient.progress?.gamePerformance ?? 0
  const trend = patient.progress?.trend || 'stable'
  const prescriptions = patient.prescriptions || []
  const medications = patient.medications || []
  const tasks = patient.tasks || []
  const games = patient.games || []
  const dailyScores = patient.dailyScores || []

  return (
    <DashboardLayout title="Patient Profile">
      <div className="space-y-6">
        {/* ───────── Patient Header Banner ───────── */}
        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-fire rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0">
                {(patient.name || 'P')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-ink">{patient.name}</h1>
                  <Badge variant="success">Active</Badge>
                  <Badge variant="warning">Improving</Badge>
                </div>
                <p className="text-xs md:text-sm text-ink/60 mt-1">
                  Age {patient.age} • {patient.gender} • Primary Language: {patient.preferredLanguage}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-ink/60">
              <p>
                Doctor: <span className="text-ink font-semibold">{patient.doctorName}</span>
              </p>
              <p className="mt-1">
                Joined: <span className="text-ink font-medium">{patient.joinedAt}</span>
              </p>
            </div>
          </div>

          {/* ───────── Tabs Navigation ───────── */}
          <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-5 border-t border-clay/40 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeTab === tab
                    ? 'bg-fire text-white shadow-sm'
                    : 'text-ink/70 hover:bg-cream/70 hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ───────── Tab Content ───────── */}

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <Card>
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-sun/20 text-ink rounded-xl flex-shrink-0">
                    <Activity className="w-5 h-5 text-sun" />
                  </div>
                  <div>
                    <p className="text-xs text-ink/60 font-medium">Overall Score</p>
                    <p className="text-xl md:text-2xl font-bold text-ink">{overallScore}%</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-tea-confirm/20 text-tea-confirm rounded-xl flex-shrink-0">
                    <Pill className="w-5 h-5 text-tea-confirm" />
                  </div>
                  <div>
                    <p className="text-xs text-ink/60 font-medium">Meds Adherence</p>
                    <p className="text-xl md:text-2xl font-bold text-ink">{medAdherence}%</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-fire/15 text-fire rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-fire" />
                  </div>
                  <div>
                    <p className="text-xs text-ink/60 font-medium">Task Completion</p>
                    <p className="text-xl md:text-2xl font-bold text-ink">{taskComp}%</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-sun/20 text-ink rounded-xl flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-sun" />
                  </div>
                  <div>
                    <p className="text-xs text-ink/60 font-medium">Game Memory</p>
                    <p className="text-xl md:text-2xl font-bold text-ink">{gamePerf}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Demographics & Emergency Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-sun" /> Patient Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Full Name</span>
                    <span className="text-ink font-semibold">{patient.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Phone</span>
                    <span className="text-ink font-medium">{patient.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Location</span>
                    <span className="text-ink font-medium">{patient.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Assigned Doctor</span>
                    <span className="text-ink font-medium">{patient.doctorName}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-fire" /> Emergency Contacts
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Emergency Contact</span>
                    <span className="text-ink font-semibold">{patient.emergencyContactName}</span>
                  </div>
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Emergency Phone</span>
                    <span className="text-ink font-medium">{patient.emergencyContact}</span>
                  </div>
                  <div className="flex justify-between border-b border-clay/30 pb-2.5">
                    <span className="text-ink/60">Caregiver Status</span>
                    <span className="text-tea-confirm font-semibold">Linked & Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Cognitive Trend</span>
                    <span className="text-sun font-semibold capitalize">{trend}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Progress Chart Preview */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-fire" /> Cognitive Score History (Last 7 Days)
                </h3>
                <span className="text-xs text-ink/50 font-medium">Daily Evaluation</span>
              </div>
              <ProgressChart data={dailyScores} />
            </Card>
          </div>
        )}

        {/* PRESCRIPTIONS */}
        {activeTab === 'Prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <Card>
                <p className="text-sm text-ink/60 text-center py-4">No prescriptions recorded</p>
              </Card>
            ) : (
              prescriptions.map((rx) => (
                <Card key={rx.id}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-fire/15 border border-fire/25 text-fire rounded-xl mt-0.5 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-ink">{rx.medicineName}</h4>
                        <p className="text-xs text-ink/60 mt-0.5">
                          Dosage: <span className="text-ink font-semibold">{rx.dosage}</span>
                        </p>
                        {rx.instructions && (
                          <p className="text-xs text-fire font-medium mt-1">Instructions: {rx.instructions}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-ink/60">
                      <p>
                        Prescribed by: <span className="text-ink font-semibold">{rx.doctorName || patient.doctorName}</span>
                      </p>
                      {rx.startDate && (
                        <p className="mt-1">
                          Valid: {rx.startDate} {rx.endDate ? `to ${rx.endDate}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* MEDICATIONS */}
        {activeTab === 'Medications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Daily Medication Logs</h3>
              <span className="text-xs text-ink/60 font-medium">{medications.length} doses scheduled</span>
            </div>
            {medications.length === 0 ? (
              <Card>
                <p className="text-sm text-ink/60 text-center py-4">No medications scheduled</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {medications.map((log) => (
                  <MedicineRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TASKS */}
        {activeTab === 'Tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Daily Routine & Memory Tasks</h3>
              <span className="text-xs text-ink/60 font-medium">{tasks.length} tasks recorded</span>
            </div>
            {tasks.length === 0 ? (
              <Card>
                <p className="text-sm text-ink/60 text-center py-4">No daily tasks recorded</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((log) => (
                  <TaskRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {activeTab === 'Progress' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-bold text-ink mb-4">Overall Score Trend</h3>
              <ProgressChart data={dailyScores} />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <Card>
                <p className="text-xs text-ink/60 font-medium">Medication Adherence</p>
                <p className="text-2xl font-bold text-tea-confirm mt-1">{medAdherence}%</p>
                <p className="text-xs text-ink/50 mt-2">Consistent intake schedule</p>
              </Card>
              <Card>
                <p className="text-xs text-ink/60 font-medium">Task Completion Rate</p>
                <p className="text-2xl font-bold text-sun mt-1">{taskComp}%</p>
                <p className="text-xs text-ink/50 mt-2">Active daily engagement</p>
              </Card>
              <Card>
                <p className="text-xs text-ink/60 font-medium">Memory Games Accuracy</p>
                <p className="text-2xl font-bold text-fire mt-1">{gamePerf}%</p>
                <p className="text-xs text-ink/50 mt-2">Positive cognitive stimulus</p>
              </Card>
            </div>
          </div>
        )}

        {/* QUESTIONNAIRE */}
        {activeTab === 'Questionnaire' && <QuestionnaireTab />}
      </div>
    </DashboardLayout>
  )
}
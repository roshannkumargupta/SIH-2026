import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Pill, CheckCircle, Bell, User, Key, TrendingUp, Sparkles, Activity } from 'lucide-react'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { StatCard } from '../../components/common/StatCard'
import { AlertCard } from '../../components/caregiver/AlertCard'
import { MedicineRow } from '../../components/caregiver/MedicineRow'
import { TaskRow } from '../../components/caregiver/TaskRow'
import { getPatient } from '../../utils/patientStore'
import { mockAlerts } from '../../mockData'

export default function CaregiverDashboard() {
  const navigate = useNavigate()
  const patient = getPatient()
  const [hasOnboarding, setHasOnboarding] = useState(true)

  useEffect(() => {
    const onboarding = localStorage.getItem('nermemorycare_onboarding')
    setHasOnboarding(!!onboarding)
  }, [])

  const takenMeds = (patient.medications || []).filter((l) => l.status === 'taken').length
  const pendingMeds = (patient.medications || []).filter((l) => l.status === 'pending').length
  const completedTasks = (patient.tasks || []).filter((l) => l.status === 'completed').length
  const unreadAlerts = mockAlerts.filter((a) => !a.read).length

  return (
    <DashboardLayout title="Caregiver Overview">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/caregiver/add-patient')}
          className="w-full py-3 bg-fire text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
        >
          <span>+ Add New Patient</span>
        </button>

        {!hasOnboarding && (
          <div className="bg-sun/20 border border-sun/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sun/30 flex items-center justify-center text-xl flex-shrink-0">
                🎯
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Calibrate Game Difficulty for {patient.name}</p>
                <p className="text-xs text-ink/70">Take the 4-question assessment to tailor memory games and challenge level.</p>
              </div>
            </div>
            <Link
              to="/caregiver/onboarding"
              className="px-4 py-2 bg-fire text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors whitespace-nowrap shadow-xs"
            >
              Set Difficulty Now →
            </Link>
          </div>
        )}

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Today's Overview</h1>
          <p className="text-sm text-ink/60 mt-1">Monitoring {patient.name}</p>
        </div>

        {/* Patient Hero Card with Login Credentials */}
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
                <p className="text-xl font-bold text-ink">{patient.name}</p>
                <p className="text-sm text-ink/60 mt-0.5">
                  Age {patient.age} • {patient.preferredLanguage} • {patient.address || 'Home Care'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tea-confirm/15 text-tea-confirm border border-tea-confirm/30">
                    Active Patient
                  </span>
                  <span className="text-xs text-ink/50">Dr. {patient.doctorName || 'Assigned Physician'}</span>
                </div>
              </div>
            </div>

            {/* Patient Tablet / Companion Credentials */}
            <div className="w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-clay/30 flex flex-col sm:items-end">
              <span className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider">Patient Login Credentials</span>
              <div className="flex items-center gap-2 mt-1 bg-cream/80 px-3 py-1.5 rounded-lg border border-clay/40">
                <Key className="w-3.5 h-3.5 text-fire" />
                <span className="text-xs font-mono text-ink">ID: <strong>{patient.id || 'p1'}</strong></span>
                <span className="text-clay">|</span>
                <span className="text-xs font-mono text-ink">PIN: <strong>{patient.pin || '4321'}</strong></span>
              </div>
              <span className="text-[10px] text-tea-confirm font-medium mt-1">✓ Companion Tablet Auth Active</span>
            </div>
          </div>
        </div>

        {/* Overall Progress of the Patient */}
        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-fire" /> Overall Progress & Cognitive Health
              </h3>
              <p className="text-xs text-ink/60">Overall performance score and therapy completion metrics</p>
            </div>
            <Link to="/caregiver/patient" className="text-xs text-fire hover:underline font-medium">
              Full Analytics →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-cream/60 rounded-xl border border-clay/30">
              <span className="text-xs text-ink/60 font-medium">Cognitive Score</span>
              <p className="text-2xl font-bold text-ink mt-0.5">{patient.progress?.overallScore ?? 89}%</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-tea-confirm font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span className="capitalize">{patient.progress?.trend || 'improving'}</span>
              </div>
            </div>
            <div className="p-3.5 bg-cream/60 rounded-xl border border-clay/30">
              <span className="text-xs text-ink/60 font-medium">Med Adherence</span>
              <p className="text-2xl font-bold text-ink mt-0.5">{patient.progress?.medicationAdherence ?? 92}%</p>
              <span className="text-[11px] text-ink/60 font-medium">High compliance</span>
            </div>
            <div className="p-3.5 bg-cream/60 rounded-xl border border-clay/30">
              <span className="text-xs text-ink/60 font-medium">Daily Tasks</span>
              <p className="text-2xl font-bold text-ink mt-0.5">{patient.progress?.taskCompletion ?? 85}%</p>
              <span className="text-[11px] text-ink/60 font-medium">Routine on track</span>
            </div>
            <div className="p-3.5 bg-cream/60 rounded-xl border border-clay/30">
              <span className="text-xs text-ink/60 font-medium">Game Performance</span>
              <p className="text-2xl font-bold text-ink mt-0.5">{patient.progress?.gamePerformance ?? 84}%</p>
              <span className="text-[11px] text-sun font-medium">Calibrated level</span>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatCard
            label="Medicines Taken"
            value={`${takenMeds}/${(patient.medications || []).length}`}
            icon={Pill}
            color="tea-confirm"
          />
          <StatCard
            label="Pending Medicines"
            value={pendingMeds}
            icon={Pill}
            color="fire"
          />
          <StatCard
            label="Tasks Completed"
            value={`${completedTasks}/${(patient.tasks || []).length}`}
            icon={CheckCircle}
            color="tea-confirm"
          />
          <StatCard
            label="Unread Alerts"
            value={unreadAlerts}
            icon={Bell}
            color="sun"
          />
        </div>

        {/* Today's Medicines */}
        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-ink text-base">Today's Medicines</h3>
            <Link to="/caregiver/patient" className="text-xs text-fire hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {(patient.medications || []).map((log) => (
              <MedicineRow key={log.id} log={log} />
            ))}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-ink text-base">Today's Tasks</h3>
            <Link to="/caregiver/patient" className="text-xs text-fire hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {(patient.tasks || []).map((log) => (
              <TaskRow key={log.id} log={log} />
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-ink text-base">Recent Alerts</h3>
            <Link to="/caregiver/alerts" className="text-xs text-fire hover:underline font-medium">
              View all ({unreadAlerts} unread) →
            </Link>
          </div>
          <div className="space-y-3">
            {mockAlerts.slice(0, 2).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <Link
            to="/caregiver/patient"
            className="bg-surface rounded-2xl border border-clay/40 p-5 hover:border-sun shadow-sm hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-sun/15 text-sun flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Patient Profile</p>
          </Link>
          <Link
            to="/caregiver/alerts"
            className="bg-surface rounded-2xl border border-clay/40 p-5 hover:border-fire shadow-sm hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-fire/15 text-fire flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Alerts</p>
          </Link>
          <Link
            to="/caregiver/patient"
            className="bg-surface rounded-2xl border border-clay/40 p-5 hover:border-fire shadow-sm hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-fire/15 text-fire flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Medicines</p>
          </Link>
          <Link
            to="/caregiver/patient"
            className="bg-surface rounded-2xl border border-clay/40 p-5 hover:border-sun shadow-sm hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-tea-confirm/15 text-tea-confirm flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Tasks</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
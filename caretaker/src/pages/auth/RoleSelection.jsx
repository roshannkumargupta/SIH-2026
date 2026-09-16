import { useNavigate } from 'react-router-dom'
import { Users, User, ChevronRight } from 'lucide-react'
import brainLogo from '../../assets/brain-logo.png'

export default function RoleSelection() {
  const navigate = useNavigate()

  return (
    <div className="auth-theme min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] flex flex-col items-center">
        {/* Logo Badge */}
        <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-4 select-none border-2 border-sun/30">
          <img src={brainLogo} alt="SmritiSetu Logo" className="w-full h-full object-contain" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-bold text-cream text-center tracking-tight">
          SmritiSetu
        </h1>
        <p className="text-sm text-cream/60 text-center mt-1">
          Cognitive assistance for elderly care
        </p>

        {/* Big Gap & Selection Cards */}
        <div className="w-full mt-10 space-y-4">
          {/* Card 1: Caregiver */}
          <button
            type="button"
            onClick={() => navigate('/login/caregiver')}
            className="w-full min-h-[140px] bg-surface border-2 border-clay rounded-2xl p-6 flex items-center justify-between text-left transition-all duration-200 hover:border-fire hover:scale-[1.02] shadow-md cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-fire flex items-center justify-center flex-shrink-0 shadow-sm">
                <Users className="w-7 h-7 text-cream" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-cream group-hover:text-fire transition-colors">
                  Caregiver
                </h2>
                <p className="text-sm text-cream/60 mt-0.5">
                  Family member / Caretaker
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-cream/40 group-hover:text-cream/80 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </button>

          {/* Card 2: Patient */}
          <button
            type="button"
            onClick={() => navigate('/login/patient')}
            className="w-full min-h-[140px] bg-surface border-2 border-clay rounded-2xl p-6 flex items-center justify-between text-left transition-all duration-200 hover:border-sun hover:scale-[1.02] shadow-md cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-sun flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-7 h-7 text-ink" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-cream group-hover:text-sun transition-colors">
                  Patient
                </h2>
                <p className="text-sm text-cream/60 mt-0.5">
                  Elderly user
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-cream/40 group-hover:text-cream/80 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </button>
        </div>

        {/* Demo Mode Footer Note */}
        <p className="text-xs text-cream/40 text-center mt-8">
          Demo mode — no real authentication
        </p>
      </div>
    </div>
  )
}
